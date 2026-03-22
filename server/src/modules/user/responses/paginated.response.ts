// responses/paginated.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Danh sách dữ liệu' })
  data!: T[];

  meta!: MetaResponseDto;
  constructor(partial: Partial<PaginatedResponseDto<T>>) {
    Object.assign(this, partial);
  }
}

export class MetaResponseDto {
  @ApiProperty({ example: 1, description: 'Trang hiện tại' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Số lượng mỗi trang' })
  limit!: number;

  @ApiProperty({ example: 100, description: 'Tổng số bản ghi' })
  total!: number;

  @ApiProperty({ example: 10, description: 'Tổng số trang' })
  totalPage!: number;

  @ApiProperty({ example: false, description: 'Có trang trước không' })
  hasPreviousPage!: boolean;

  @ApiProperty({ example: true, description: 'Có trang sau không' })
  hasNextPage!: boolean;
}
