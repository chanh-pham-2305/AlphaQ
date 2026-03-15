import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateUserDto } from '@generated/nestjs-dto';

export class LoginLocalUserDto extends PickType(CreateUserDto, [
  'email',
  'password',
]) {
  @ApiProperty({
    description: 'User email address for registration and login',
    example: 'admin123@gmail.com',
    required: true,
    type: String,
    format: 'email',
  })
  @IsEmail({}, { message: 'Email is not in the correct format' })
  @IsNotEmpty({ message: 'Email is required!' })
  email!: string;

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
  password!: string;
}
