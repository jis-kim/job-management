import { Job } from '@/entity/job.entity';
import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { JobsRepository } from '@/jobs/jobs.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}

  async createJob(createJobDto: CreateJobDto) {
    const job = Job.fromDto(createJobDto);
    await this.jobsRepository.save(job);
    return job;
  }
}
