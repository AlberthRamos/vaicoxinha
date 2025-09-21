import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Telefone do usuário', required: false })
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Endereço do usuário', required: false })
  @IsString()
  address?: string;
}