import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('7d'),
  MONGO_URI: Joi.string().required(),
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  BCRYPT_SALT_ROUNDS: Joi.number().default(10),
  ADMIN_PASSWORD_HASH: Joi.string().required(),
});

export const configuration = registerAs('config', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION || '7d',
  },
  database: {
    mongoUri: process.env.MONGO_URI,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
  admin: {
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },
}));