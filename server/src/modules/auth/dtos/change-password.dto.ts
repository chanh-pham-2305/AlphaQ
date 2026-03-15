import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'User password minimum 6 characters',
    example: 'password123',
    required: true,
    type: String,
    minLength: 6,
    format: 'password',
  })
  @MinLength(6, { message: 'Password must be at least 6 characters!' })
  @IsNotEmpty({ message: 'Password is required!' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: 'User password minimum 6 characters',
    example: 'password123',
    required: true,
    type: String,
    minLength: 6,
    format: 'password',
  })
  @MinLength(6, { message: 'New Password must be at least 6 characters!' })
  @IsNotEmpty({ message: 'Password is required!' })
  @IsString()
  newPassword!: string;

  @ApiProperty({
    description: 'User password minimum 6 characters',
    example: 'password123',
    required: true,
    type: String,
    minLength: 6,
    format: 'password',
  })
  @MinLength(6, { message: 'Password must be at least 6 characters!' })
  @IsNotEmpty({ message: 'Password is required!' })
  @IsString()
  reNewPassword!: string;
}
