import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { UpdateUserDto } from '@generated/nestjs-dto';

export class UpdateProfileDto extends PickType(UpdateUserDto, [
  'phoneNumber',
  'fullname',
  'username',
  'address',
  'gender',
  'birthDate',
]) {
  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  fullname?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  username?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gender?: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: Date | null;
}
