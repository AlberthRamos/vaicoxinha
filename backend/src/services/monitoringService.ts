import { logger } from '@/utils/logger';
import { prisma } from '@/database/prisma';
import { EventEmitter } from 'events';
import os from 'os';
import process from 'process';

// Tipos de métricas
export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface AlertData {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  source: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: Date;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export class MonitoringService extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: AlertData[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private isCollecting = false;
  private collectionInterval?: NodeJS.Timeout;
  
  // Limites de alerta
  private readonly ALERT_THRESHOLDS = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 80, critical: 90 },
    responseTime: { warning: 1000, critical: 3000 },
    errorRate: { warning: 5, critical: 10 },
  };

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.on('metric', this.handleMetric.bind(this));
    this.on('alert', this.handleAlert.bind(this));
    this.on('health_check', this.handleHealthCheck.bind(this));
  }

  // Iniciar coleta de métricas
  startCollection(intervalMs: number = 30000): void {
    if (this.isCollecting) {
      logger.warn('Coleta de métricas já está em execução');
      return;
    }

    this.isCollecting = true;
    logger.info('Iniciando coleta de métricas', { interval: intervalMs });

    // Coletar métricas imediatamente
    this.collectSystemMetrics();
    this.collectApplicationMetrics();
    this.collectDatabaseMetrics();

    // Configurar intervalo de coleta
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectDatabaseMetrics();
    }, intervalMs);
  }

  // Parar coleta de métricas
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    this.isCollecting = false;
    logger.info('Coleta de métricas parada');
  }

  // Coletar métricas do sistema
  private collectSystemMetrics(): void {
    try {
      // CPU
      const cpuUsage = this.getCPUUsage();
      this.recordMetric('system.cpu.usage', cpuUsage, { type: 'system' });

      // Memória
      const memoryUsage = this.getMemoryUsage();
      this.recordMetric('system.memory.usage', memoryUsage.percent, { type: 'system' });
      this.recordMetric('system.memory.used', memoryUsage.used, { type: 'system', unit: 'bytes' });
      this.recordMetric('system.memory.total', memoryUsage.total, { type: 'system', unit: 'bytes' });

      // Disco
      const diskUsage = this.getDiskUsage();
      this.recordMetric('system.disk.usage', diskUsage.percent, { type: 'system' });

      // Processo
      const processMemory = process.memoryUsage();
      this.recordMetric('process.memory.rss', processMemory.rss, { type: 'process', unit: 'bytes' });
      this.recordMetric('process.memory.heapUsed', processMemory.heapUsed, { type: 'process', unit: 'bytes' });
      this.recordMetric('process.memory.heapTotal', processMemory.heapTotal, { type: 'process', unit: 'bytes' });

      // Uptime
      this.recordMetric('process.uptime', process.uptime(), { type: 'process', unit: 'seconds' });

    } catch (error) {
      logger.error('Erro ao coletar métricas do sistema', { error });
    }
  }

  // Coletar métricas da aplicação
  private async collectApplicationMetrics(): Promise<void> {
    try {
      // Contadores de requisições (deveriam ser coletados de um middleware)
      // Por enquanto, usaremos valores simulados
      this.recordMetric('app.requests.total', Math.floor(Math.random() * 100), { type: 'application' });
      this.recordMetric('app.requests.success', Math.floor(Math.random() * 90), { type: 'application' });
      this.recordMetric('app.requests.error', Math.floor(Math.random() * 10), { type: 'application' });

      // Taxa de erro
      const totalRequests = this.getMetricValue('app.requests.total') || 100;
      const errorRequests = this.getMetricValue('app.requests.error') || 0;
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
      this.recordMetric('app.error_rate', errorRate, { type: 'application', unit: 'percent' });

      // Tempo de resposta médio
      const avgResponseTime = Math.floor(Math.random() * 500) + 100;
      this.recordMetric('app.response_time.avg', avgResponseTime, { type: 'application', unit: 'ms' });

      // Conexões ativas
      this.recordMetric('app.connections.active', Math.floor(Math.random() * 50), { type: 'application' });

    } catch (error) {
      logger.error('Erro ao coletar métricas da aplicação', { error });
    }
  }

  // Coletar métricas do banco de dados
  private async collectDatabaseMetrics(): Promise<void> {
    try {
      // Contadores de conexões
      const activeConnections = await this.getDatabaseConnections();
      this.recordMetric('db.connections.active', activeConnections, { type: 'database' });

      // Queries por segundo
      this.recordMetric('db.queries.total', Math.floor(Math.random() * 1000), { type: 'database' });

      // Tempo de resposta do banco
      const dbResponseTime = await this.measureDatabaseResponseTime();
      this.recordMetric('db.response_time.avg', dbResponseTime, { type: 'database', unit: 'ms' });

      // Tamanho do banco de dados (simulado)
      this.recordMetric('db.size.total', Math.floor(Math.random() * 1000000), { type: 'database', unit: 'bytes' });

    } catch (error) {
      logger.error('Erro ao coletar métricas do banco de dados', { error });
    }
  }

  // Registrar métrica
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      ...metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Limitar a 1000 registros por métrica
    if (metricArray.length > 1000) {
      metricArray.shift();
    }

    this.emit('metric', metric);
  }

  // Obter valor de uma métrica
  getMetricValue(name: string): number | undefined {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return undefined;
    }
    return metrics[metrics.length - 1].value;
  }

  // Obter histórico de uma métrica
  getMetricHistory(name: string, limit: number = 100): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-limit);
  }

  // Criar alerta
  createAlert(alert: AlertData): void {
    this.alerts.push({
      ...alert,
      timestamp: new Date(),
    });

    // Limitar a 100 alertas
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    this.emit('alert', alert);
    logger.log(alert.level, alert.title, alert);
  }

  // Obter alertas recentes
  getAlerts(limit: number = 50, level?: string): AlertData[] {
    let filteredAlerts = this.alerts;
    
    if (level) {
      filteredAlerts = this.alerts.filter(alert => alert.level === level);
    }
    
    return filteredAlerts.slice(-limit);
  }

  // Registrar health check
  recordHealthCheck(check: Omit<HealthCheck, 'timestamp'>): void {
    const healthCheck: HealthCheck = {
      ...check,
      timestamp: new Date(),
    };

    this.healthChecks.set(check.name, healthCheck);
    this.emit('health_check', healthCheck);

    // Criar alerta baseado no status
    if (check.status === 'unhealthy') {
      this.createAlert({
        level: 'critical',
        title: `Health Check Falhou: ${check.name}`,
        description: check.message,
        source: 'health_check',
        metadata: check.metadata,
      });
    } else if (check.status === 'degraded') {
      this.createAlert({
        level: 'warning',
        title: `Health Check Degradado: ${check.name}`,
        description: check.message,
        source: 'health_check',
        metadata: check.metadata,
      });
    }
  }

  // Obter status de saúde
  getHealthStatus(): Record<string, HealthCheck> {
    return Object.fromEntries(this.healthChecks);
  }

  // Verificar saúde geral do sistema
  getOverallHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, HealthCheck>;
    summary: {
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  } {
    const checks = this.getHealthStatus();
    const summary = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
    };

    Object.values(checks).forEach(check => {
      summary[check.status]++;
    });

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      status = 'unhealthy';
    } else if (summary.degraded > 0) {
      status = 'degraded';
    }

    return { status, checks, summary };
  }

  // Handlers de eventos
  private handleMetric(metric: MetricData): void {
    // Verificar limiares de alerta
    this.checkAlertThresholds(metric);
  }

  private handleAlert(alert: AlertData): void {
    // Persistir alerta no banco de dados
    this.persistAlert(alert).catch(error => {
      logger.error('Erro ao persistir alerta', { error, alert });
    });
  }

  private handleHealthCheck(healthCheck: HealthCheck): void {
    // Persistir health check no banco de dados
    this.persistHealthCheck(healthCheck).catch(error => {
      logger.error('Erro ao persistir health check', { error, healthCheck });
    });
  }

  // Verificar limiares de alerta
  private checkAlertThresholds(metric: MetricData): void {
    const threshold = this.ALERT_THRESHOLDS[metric.name as keyof typeof this.ALERT_THRESHOLDS];
    
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      this.createAlert({
        level: 'critical',
        title: `Métrica Crítica: ${metric.name}`,
        description: `${metric.name} está em ${metric.value} (limite crítico: ${threshold.critical})`,
        source: 'metric_threshold',
        metadata: { metric, threshold },
      });
    } else if (metric.value >= threshold.warning) {
      this.createAlert({
        level: 'warning',
        title: `Métrica de Aviso: ${metric.name}`,
        description: `${metric.name} está em ${metric.value} (limite de aviso: ${threshold.warning})`,
        source: 'metric_threshold',
        metadata: { metric, threshold },
      });
    }
  }

  // Persistir alerta no banco de dados
  private async persistAlert(alert: AlertData): Promise<void> {
    await prisma.alert.create({
      data: {
        level: alert.level,
        title: alert.title,
        description: alert.description,
        source: alert.source,
        tags: alert.tags ? JSON.stringify(alert.tags) : null,
        metadata: alert.metadata ? JSON.stringify(alert.metadata) : null,
      },
    });
  }

  // Persistir health check no banco de dados
  private async persistHealthCheck(healthCheck: HealthCheck): Promise<void> {
    await prisma.healthCheck.create({
      data: {
        name: healthCheck.name,
        status: healthCheck.status,
        message: healthCheck.message,
        responseTime: healthCheck.responseTime,
        metadata: healthCheck.metadata ? JSON.stringify(healthCheck.metadata) : null,
      },
    });
  }

  // Métodos auxiliares
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - Math.floor(100 * totalIdle / totalTick);
  }

  private getMemoryUsage(): { percent: number; used: number; total: number } {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percent = Math.floor((used / total) * 100);

    return { percent, used, total };
  }

  private getDiskUsage(): { percent: number; used: number; total: number } {
    // Simulação - em produção, usar uma biblioteca como 'check-disk-space'
    return { percent: Math.floor(Math.random() * 30) + 20, used: 0, total: 0 };
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      const result = await prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()
      `;
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Erro ao obter conexões do banco de dados', { error });
      return 0;
    }
  }

  private async measureDatabaseResponseTime(): Promise<number> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    } catch (error) {
      logger.error('Erro ao medir tempo de resposta do banco de dados', { error });
      return 0;
    }
  }

  // Health checks específicos
  async checkDatabaseHealth(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        name: 'database',
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        message: 'Conexão com banco de dados estabelecida',
        responseTime,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: 'Falha na conexão com banco de dados',
        responseTime: Date.now() - start,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  async checkRedisHealth(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Implementar verificação do Redis quando disponível
      return {
        name: 'redis',
        status: 'healthy',
        message: 'Redis não configurado',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        message: 'Falha na conexão com Redis',
        responseTime: Date.now() - start,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  async checkRabbitMQHealth(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Implementar verificação do RabbitMQ quando disponível
      return {
        name: 'rabbitmq',
        status: 'healthy',
        message: 'RabbitMQ não configurado',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'rabbitmq',
        status: 'unhealthy',
        message: 'Falha na conexão com RabbitMQ',
        responseTime: Date.now() - start,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}

// Singleton
export const monitoringService = new MonitoringService();

export default monitoringService;