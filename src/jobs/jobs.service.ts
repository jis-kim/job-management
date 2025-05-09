import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { JobIdExistsError } from '@/common/error/job-id-exists-error';
import { chunkArray } from '@/common/util/chunk-array.util';
import { Job, JobStatus } from '@/entity/job.entity';
import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { JobSearchQueryDto } from '@/jobs/dto/job-search-query.dto';
import { JobsRepository } from '@/jobs/jobs.repository';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}
  private readonly logger = new Logger(JobsService.name);

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
    try {
      await this.jobsRepository.push(job);
      this.jobsRepository.save();
    } catch (error) {
      if (error instanceof JobIdExistsError) {
        this.logger.error('uuid conflict');
        throw new ConflictException(error.message);
      }
      throw error;
    }
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
}
