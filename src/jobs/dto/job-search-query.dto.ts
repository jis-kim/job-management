import { JobStatus } from '@/entity/job.entity';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class JobSearchQueryDto {
  @IsString()
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  title?: string;
}
