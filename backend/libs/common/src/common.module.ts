import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { configuration, validationSchema } from './config/configuration';
import { CommonConfigService } from './config/config.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: CommonConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiration },
      }),
      inject: [CommonConfigService],
    }),
  ],
  providers: [CommonConfigService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [CommonConfigService, JwtAuthGuard, RolesGuard, JwtModule, PassportModule],
})
export class CommonModule {}