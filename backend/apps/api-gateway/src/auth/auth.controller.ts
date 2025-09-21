import { Controller, Post, Body, Get, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '@app/common';
import { JwtAuthGuard } from '@app/common';
import { LoginDto, RegisterDto } from '../common/dto';
import { WinstonLoggerService } from '../common/logger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 201, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Tentativa de login para: ${loginDto.email}`, 'AuthController');
      const result = await this.authService.login(loginDto.email, loginDto.password);
      this.logger.log(`Login bem-sucedido para: ${loginDto.email}`, 'AuthController');
      return result;
    } catch (error) {
      this.logger.error(`Falha no login para: ${loginDto.email}`, error.stack, 'AuthController');
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      this.logger.log(`Registrando novo usuário: ${registerDto.email}`, 'AuthController');
      const result = await this.authService.register(registerDto);
      this.logger.log(`Usuário registrado com sucesso: ${registerDto.email}`, 'AuthController');
      return result;
    } catch (error) {
      this.logger.error(`Falha ao registrar usuário: ${registerDto.email}`, error.stack, 'AuthController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = await this.authService.findById(req.user.userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validate(@Request() req) {
    return { valid: true, user: req.user };
  }
}