import { JobStatus } from '@/entity/job.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';
export class JobSearchQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'job status',
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiProperty({
    description: 'job title',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  title?: string;
}
