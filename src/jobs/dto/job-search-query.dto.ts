import { JobStatus } from '@/entity/job.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class JobSearchQueryDto {
  @ApiProperty({
    description: 'job status',
    required: false,
  })
  @IsString()
  @IsOptional()
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
