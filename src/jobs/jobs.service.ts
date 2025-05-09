import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

import { JobIdExistsError } from '@/common/error/job-id-exists-error';
import { chunkArray } from '@/common/util/chunk-array.util';
import { Job, JobStatus } from '@/entity/job.entity';
import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { JobSearchQueryDto } from '@/jobs/dto/job-search-query.dto';
import { JobsRepository } from '@/jobs/jobs.repository';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}
  private readonly logger = new Logger(JobsService.name);

  async getAllJobs(pagination: PaginationQueryDto): Promise<Job[]> {
    const { offset, limit, sort, order } = pagination; // default
    let jobs: Job[] = await this.jobsRepository.findAll();

    if (sort) {
      // sort query exists
      jobs = jobs.sort((a, b) => {
        const aTime = a[sort].getTime();
        const bTime = b[sort].getTime();
        return order === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }
    return jobs.slice(offset, offset + limit);
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
    try {
      await this.jobsRepository.push(job);
    } catch (error) {
      if (error instanceof JobIdExistsError) {
        this.logger.error('uuid conflict');
        throw new ConflictException(error.message);
      }
      throw error;
    }
    return job;
  }

  async searchJob(search: JobSearchQueryDto): Promise<Job[]> {
    const { offset, limit, sort, order, status, title } = search; // default
    let jobs: Job[] = [];

    if (status) {
      jobs = await this.jobsRepository.filter('status', status);
      if (title) {
        jobs = jobs.filter((job) => job.title.includes(title));
      }
    }
    if (title) {
      jobs = await this.jobsRepository.filter('title', title);
    }

    if (sort) {
      jobs = jobs.sort((a, b) => {
        const aTime = a[sort].getTime();
        const bTime = b[sort].getTime();
        return order === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }

    return jobs.slice(offset, offset + limit);
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'updatePendingJobs',
    waitForCompletion: true, // 작업이 완료되지 않았다면 skip
  })
  async updatePendingJobs() {
    // status가 pending인 job 조회
    const pendingJobs = await this.jobsRepository.filter('status', 'pending');

    const batchSize = 100;
    const jobChunks = chunkArray(pendingJobs, batchSize);
    const allStart = Date.now();

    for (const chunk of jobChunks) {
      const result = await Promise.allSettled(
        chunk.map(async (job) => {
          const start = Date.now();
          const { id } = job;
          try {
            //await this.jobsRepository.update(id, { ...job, status: JobStatus.PROCESSING });
            // something processing
            await this.jobsRepository.update(id, { ...job, status: JobStatus.COMPLETED, updatedAt: new Date() });
          } catch (error) {
            this.logger.error(`Job ${id} failed to update status to processing: ${error} +${Date.now() - start}ms`);
            await this.jobsRepository.update(id, { ...job, status: JobStatus.FAILED, updatedAt: new Date() }); // 하나의 job 실패
          }
        }),
      );

      if (result.filter((r) => r.status === 'fulfilled').length !== chunk.length) {
        this.logger.error('Job update failed');
      }
    }

    await this.jobsRepository.save(); // 명시적 save
    this.logger.log(`All jobs are completed(with index map) : ${pendingJobs.length}  +${Date.now() - allStart}ms`);
  }

  @Interval(1000)
  async saveJobs() {
    const result = await this.jobsRepository.save();
    if (result) {
      this.logger.log('Jobs saved');
    }
  }
}
