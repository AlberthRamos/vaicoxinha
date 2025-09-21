import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommonConfigService {
  private readonly logger = new Logger(CommonConfigService.name);

  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('config.port', 3000);
  }

  get jwtSecret(): string {
    return this.configService.get<string>('config.jwt.secret', '');
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('config.jwt.expiration', '7d');
  }

  get mongoUri(): string {
    return this.configService.get<string>('config.database.mongoUri', '');
  }

  get rabbitmqUrl(): string {
    return this.configService.get<string>('config.rabbitmq.url', 'amqp://localhost:5672');
  }

  get bcryptSaltRounds(): number {
    return this.configService.get<number>('config.bcrypt.saltRounds', 10);
  }

  get adminPasswordHash(): string {
    return this.configService.get<string>('config.admin.passwordHash', '');
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}