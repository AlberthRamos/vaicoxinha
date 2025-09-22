import amqp from 'amqplib';
import { logger } from '@/utils/logger';

export interface QueueConfig {
  name: string;
  durable: boolean;
  maxPriority?: number;
  messageTtl?: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
}

export interface ExchangeConfig {
  name: string;
  type: 'direct' | 'topic' | 'fanout' | 'headers';
  durable: boolean;
  autoDelete?: boolean;
}

export interface RabbitMQConfig {
  url: string;
  exchanges: ExchangeConfig[];
  queues: QueueConfig[];
  bindings: Array<{
    exchange: string;
    queue: string;
    routingKey: string;
  }>;
  retryAttempts: number;
  retryDelay: number;
  connectionTimeout: number;
}

export class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private config: RabbitMQConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: RabbitMQConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      logger.info('Conectando ao RabbitMQ...', { url: this.config.url });

      this.connection = await amqp.connect(this.config.url, {
        timeout: this.config.connectionTimeout,
      });

      this.channel = await this.connection.createChannel();

      // Configurar confirmações de publicação
      await this.channel.confirmSelect();

      // Configurar prefetch para consumo controlado
      await this.channel.prefetch(10);

      // Configurar eventos de conexão
      this.setupConnectionEvents();

      // Criar exchanges
      await this.setupExchanges();

      // Criar filas
      await this.setupQueues();

      // Criar bindings
      await this.setupBindings();

      this.isConnected = true;
      this.reconnectAttempts = 0;

      logger.info('Conectado ao RabbitMQ com sucesso');

    } catch (error) {
      logger.error('Erro ao conectar ao RabbitMQ', error);
      await this.handleConnectionError(error);
      throw error;
    }
  }

  private setupConnectionEvents(): void {
    if (!this.connection) return;

    this.connection.on('error', (error) => {
      logger.error('Erro na conexão RabbitMQ', error);
      this.isConnected = false;
      this.handleConnectionError(error);
    });

    this.connection.on('close', () => {
      logger.warn('Conexão RabbitMQ fechada');
      this.isConnected = false;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    if (this.channel) {
      this.channel.on('error', (error) => {
        logger.error('Erro no canal RabbitMQ', error);
      });

      this.channel.on('close', () => {
        logger.warn('Canal RabbitMQ fechado');
      });
    }
  }

  private async setupExchanges(): Promise<void> {
    if (!this.channel) throw new Error('Canal não está disponível');

    for (const exchange of this.config.exchanges) {
      await this.channel.assertExchange(exchange.name, exchange.type, {
        durable: exchange.durable,
        autoDelete: exchange.autoDelete || false,
      });

      logger.info('Exchange criada', {
        name: exchange.name,
        type: exchange.type,
      });
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) throw new Error('Canal não está disponível');

    for (const queue of this.config.queues) {
      await this.channel.assertQueue(queue.name, {
        durable: queue.durable,
        maxPriority: queue.maxPriority,
        messageTtl: queue.messageTtl,
        deadLetterExchange: queue.deadLetterExchange,
        deadLetterRoutingKey: queue.deadLetterRoutingKey,
      });

      logger.info('Fila criada', {
        name: queue.name,
        durable: queue.durable,
      });
    }
  }

  private async setupBindings(): Promise<void> {
    if (!this.channel) throw new Error('Canal não está disponível');

    for (const binding of this.config.bindings) {
      await this.channel.bindQueue(
        binding.queue,
        binding.exchange,
        binding.routingKey
      );

      logger.info('Binding criado', {
        exchange: binding.exchange,
        queue: binding.queue,
        routingKey: binding.routingKey,
      });
    }
  }

  private async handleConnectionError(error: any): Promise<void> {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.warn(`Tentando reconectar ao RabbitMQ (tentativa ${this.reconnectAttempts})`);
      this.scheduleReconnect();
    } else {
      logger.error('Máximo de tentativas de reconexão atingido');
      throw new Error('Não foi possível conectar ao RabbitMQ');
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconexão falhou', error);
      }
    }, delay);
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
    options?: amqp.Options.Publish
  ): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const publishOptions: amqp.Options.Publish = {
        persistent: true,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
        ...options,
      };

      const result = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        publishOptions
      );

      if (!result) {
        logger.warn('Falha ao publicar mensagem - fila cheia');
        return false;
      }

      logger.info('Mensagem publicada', {
        exchange,
        routingKey,
        messageId: publishOptions.messageId,
      });

      return true;

    } catch (error) {
      logger.error('Erro ao publicar mensagem', {
        exchange,
        routingKey,
        error,
      });
      throw error;
    }
  }

  async consumeMessage(
    queue: string,
    onMessage: (msg: amqp.Message) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    try {
      await this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          await onMessage(msg);
          this.channel!.ack(msg);
        } catch (error) {
          logger.error('Erro ao processar mensagem', {
            queue,
            messageId: msg.properties.messageId,
            error,
          });

          // Rejeitar mensagem e reencaminhar para fila de retry
          this.handleMessageError(msg, queue, error);
        }
      });

      logger.info('Consumidor configurado', { queue });

    } catch (error) {
      logger.error('Erro ao configurar consumidor', { queue, error });
      throw error;
    }
  }

  private handleMessageError(
    msg: amqp.Message,
    queue: string,
    error: any
  ): void {
    if (!this.channel) return;

    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
    const maxRetries = 3;

    if (retryCount <= maxRetries) {
      // Reencaminhar para retry com contador incrementado
      const retryOptions: amqp.Options.Publish = {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          'x-retry-count': retryCount,
          'x-original-queue': queue,
          'x-error': error.message,
        },
        expiration: (this.config.retryDelay * retryCount).toString(),
      };

      this.channel!.publish(
        '',
        `${queue}.retry`,
        msg.content,
        retryOptions
      );

      logger.warn('Mensagem reencaminhada para retry', {
        queue,
        retryCount,
        maxRetries,
      });
    } else {
      // Enviar para fila de dead letter
      const deadLetterOptions: amqp.Options.Publish = {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          'x-death-reason': 'max-retries-exceeded',
          'x-original-queue': queue,
          'x-error': error.message,
          'x-death-time': new Date().toISOString(),
        },
      };

      this.channel!.publish(
        '',
        `${queue}.dlq`,
        msg.content,
        deadLetterOptions
      );

      logger.error('Mensagem enviada para dead letter queue', {
        queue,
        retryCount,
        error: error.message,
      });
    }

    // Rejeitar mensagem original
    this.channel!.nack(msg, false, false);
  }

  async createDelayedQueue(
    queueName: string,
    delayMs: number,
    options?: Partial<QueueConfig>
  ): Promise<void> {
    if (!this.channel) throw new Error('Canal não está disponível');

    const delayedQueueName = `${queueName}.delayed.${delayMs}`;
    
    await this.channel.assertExchange(delayedQueueName, 'x-delayed-message', {
      durable: true,
      arguments: {
        'x-delayed-type': 'direct',
      },
    });

    await this.channel.assertQueue(delayedQueueName, {
      durable: true,
      ...options,
    });

    await this.channel.bindQueue(delayedQueueName, delayedQueueName, queueName);

    logger.info('Fila atrasada criada', {
      queueName,
      delayMs,
      delayedQueueName,
    });
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getQueueStats(queue: string): Promise<amqp.Replies.AssertQueue> {
    if (!this.channel) throw new Error('Canal não está disponível');

    return await this.channel.assertQueue(queue, { passive: true });
  }

  async purgeQueue(queue: string): Promise<void> {
    if (!this.channel) throw new Error('Canal não está disponível');

    await this.channel.purgeQueue(queue);
    logger.info('Fila limpa', { queue });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      logger.info('Desconectado do RabbitMQ');

    } catch (error) {
      logger.error('Erro ao desconectar do RabbitMQ', error);
      throw error;
    }
  }

  get isHealthy(): boolean {
    return this.isConnected && this.connection !== null && this.channel !== null;
  }
}

// Configuração padrão para o sistema
export const defaultRabbitMQConfig: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchanges: [
    {
      name: 'orders.exchange',
      type: 'topic',
      durable: true,
    },
    {
      name: 'payments.exchange',
      type: 'topic',
      durable: true,
    },
    {
      name: 'notifications.exchange',
      type: 'topic',
      durable: true,
    },
    {
      name: 'inventory.exchange',
      type: 'topic',
      durable: true,
    },
  ],
  queues: [
    {
      name: 'orders.created',
      durable: true,
      deadLetterExchange: 'orders.dlx',
      deadLetterRoutingKey: 'orders.failed',
    },
    {
      name: 'orders.updated',
      durable: true,
      deadLetterExchange: 'orders.dlx',
      deadLetterRoutingKey: 'orders.failed',
    },
    {
      name: 'payments.processed',
      durable: true,
      deadLetterExchange: 'payments.dlx',
      deadLetterRoutingKey: 'payments.failed',
    },
    {
      name: 'notifications.email',
      durable: true,
      maxPriority: 10,
      deadLetterExchange: 'notifications.dlx',
      deadLetterRoutingKey: 'notifications.failed',
    },
    {
      name: 'notifications.sms',
      durable: true,
      maxPriority: 10,
      deadLetterExchange: 'notifications.dlx',
      deadLetterRoutingKey: 'notifications.failed',
    },
    {
      name: 'inventory.reserved',
      durable: true,
      deadLetterExchange: 'inventory.dlx',
      deadLetterRoutingKey: 'inventory.failed',
    },
  ],
  bindings: [
    {
      exchange: 'orders.exchange',
      queue: 'orders.created',
      routingKey: 'order.created',
    },
    {
      exchange: 'orders.exchange',
      queue: 'orders.updated',
      routingKey: 'order.updated',
    },
    {
      exchange: 'payments.exchange',
      queue: 'payments.processed',
      routingKey: 'payment.*',
    },
    {
      exchange: 'notifications.exchange',
      queue: 'notifications.email',
      routingKey: 'notification.email',
    },
    {
      exchange: 'notifications.exchange',
      queue: 'notifications.sms',
      routingKey: 'notification.sms',
    },
    {
      exchange: 'inventory.exchange',
      queue: 'inventory.reserved',
      routingKey: 'inventory.reserved',
    },
  ],
  retryAttempts: 3,
  retryDelay: 5000,
  connectionTimeout: 30000,
};