import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export type Sort = 'createdAt' | 'updatedAt';
export type Order = 'asc' | 'desc';

export class PaginationQueryDto {
  @ApiProperty({
    description: '페이지 번호',
    required: false,
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @ApiProperty({
    description: '페이지 당 아이템 수',
    required: false,
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiProperty({
    description: '정렬 기준',
    required: false,
    enum: ['createdAt', 'updatedAt'],
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sort?: Sort;

  @ApiProperty({
    description: '정렬 방향',
    required: false,
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: Order = 'desc';
}
