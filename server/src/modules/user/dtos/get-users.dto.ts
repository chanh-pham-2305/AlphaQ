import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  SORT_FIELDS,
  SORT_ORDERS,
  type SortField,
  type SortOrder,
} from '../types/user.type';
import { USER_ROLES, type UserRole } from 'src/global/types/roles.type';

export class GetUsersDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(20)
  limit: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: USER_ROLES,
    description: 'User role',
  })
  @IsOptional()
  @IsIn(USER_ROLES, {
    message: 'Role must be one of: CUSTOMER, ADMIN',
  })
  role?: UserRole;

  @ApiProperty({
    required: false,
    enum: SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: SortField = 'createdAt';

  @ApiProperty({
    required: false,
    enum: SORT_ORDERS,
    default: 'desc',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder: SortOrder = 'desc';
}
