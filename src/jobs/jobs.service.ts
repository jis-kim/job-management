import { Job } from '@/entity/job.entity';
import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { JobSearchQueryDto } from '@/jobs/dto/job-search-query.dto';
import { JobsRepository } from '@/jobs/jobs.repository';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}

  async getAllJobs(): Promise<Job[]> {
    return this.jobsRepository.findAll();
  }

  async getJobDetail(id: string): Promise<Job> {
    const job = await this.jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundException('해당하는 id가 없습니다.');
    }
    return job;
  }

  async createJob(createJobDto: CreateJobDto) {
    const job = Job.fromDto(createJobDto);
    await this.jobsRepository.push(job);
    return job;
  }

  async searchJob(query: JobSearchQueryDto): Promise<Job[]> {
    const { status, title } = query;

    // status가 있으면 status로
    // title이 있으면 title로
    // 둘 다 있으면 status와 title로

    if (status) {
      return this.jobsRepository.filter('status', status);
    }
    if (title) {
      return this.jobsRepository.filter('title', title);
    }
    return [];
  }
}
