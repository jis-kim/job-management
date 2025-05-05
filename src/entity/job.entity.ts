import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class Job {
  @ApiProperty({ description: '생성된 job의 key(uuid)', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;
  @ApiProperty({ description: 'job의 제목', example: 'process-image' })
  title: string;
  @ApiProperty({ description: 'job의 설명', example: 'Process image and save to database' })
  description: string;
  @ApiProperty({ description: 'job의 상태 (생성 시 pending)', example: JobStatus.PENDING })
  status: JobStatus = JobStatus.PENDING;
  @ApiProperty({ description: 'job의 생성 일시', example: '2025-05-05T04:21:18.902Z' })
  createdAt: Date = new Date();
  @ApiProperty({ description: 'job의 수정 일시', example: '2025-05-05T04:21:18.902Z' })
  updatedAt: Date = new Date();

  static fromDto(dto: CreateJobDto): Job {
    return {
      id: v4(),
      title: dto.title,
      description: dto.description,
      status: JobStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
