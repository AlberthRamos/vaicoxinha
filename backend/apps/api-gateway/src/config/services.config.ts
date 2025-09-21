import { Transport } from '@nestjs/microservices';

export const SERVICES_CONFIG = {
  PRODUCTS_SERVICE: {
    name: 'PRODUCTS_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'products_queue',
      queueOptions: {
        durable: true,
      },
    },
  },
  ORDERS_SERVICE: {
    name: 'ORDERS_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'orders_queue',
      queueOptions: {
        durable: true,
      },
    },
  },
  PAYMENTS_SERVICE: {
    name: 'PAYMENTS_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'payments_queue',
      queueOptions: {
        durable: true,
      },
    },
  },
  ADMIN_SERVICE: {
    name: 'ADMIN_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'admin_queue',
      queueOptions: {
        durable: true,
      },
    },
  },
};