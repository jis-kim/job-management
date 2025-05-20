import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

import { JobIdExistsError } from '@/common/error/job-id-exists-error';
import { chunkArray } from '@/common/util/chunk-array.util';
import { Job, JobStatus } from '@/entity/job.entity';
import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { JobSearchQueryDto } from '@/jobs/dto/job-search-query.dto';
import { JobsRepository } from '@/jobs/jobs.repository';
import { Order, PaginationQueryDto, Sort } from './dto/pagination-query.dto';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}
  private readonly logger = new Logger(JobsService.name);

  async getAllJobs(pagination: PaginationQueryDto): Promise<Job[]> {
    const { offset, limit, sort, order } = pagination; // default
    let jobs: Job[] = await this.jobsRepository.findAll();

    if (sort) {
      jobs = this.sortJobsByDate(jobs, sort, order);
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
    let jobs: Job[] = await this.jobsRepository.findAll();

    if (status && title) {
      jobs = jobs.filter((job) => job.status === status && job.title.includes(title));
    } else if (status) {
      jobs = jobs.filter((job) => job.status === status);
    } else if (title) {
      jobs = jobs.filter((job) => job.title.includes(title));
    }

    if (sort) {
      jobs = this.sortJobsByDate(jobs, sort, order);
    }

    return jobs.slice(offset, offset + limit);
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'updatePendingJobs',
    waitForCompletion: true, // 작업이 완료되지 않았다면 skip
  })
  async updatePendingJobs() {
    // status가 pending인 job 조회
    const pendingJobs = await this.jobsRepository.filter('status', JobStatus.PENDING);

    const batchSize = 100;
    const jobChunks = chunkArray(pendingJobs, batchSize);
    const allStart = Date.now();

    for (const chunk of jobChunks) {
      // Promise.allSettled를 사용하여 개별 실패와 관련없이 모든 job 업데이트시도
      const result = await Promise.allSettled(
        chunk.map(async (job) => {
          const start = Date.now();
          const { id } = job;
          try {
            //await this.jobsRepository.update(id, { ...job, status: JobStatus.PROCESSING });
            // something processing - 지금은 따로 과정이 없어 바로 완료 처리함.
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

  /**
   * 정렬 기준은 createdAt, updatedAt 두 가지 밖에 없음.
   *
   * @param jobs 정렬할 데이터
   * @param sort 정렬 기준 (createdAt, updatedAt)
   * @param order 정렬 방향 (asc, desc)
   * @returns 정렬된 데이터
   */
  private sortJobsByDate(jobs: Job[], sort: Sort, order: Order) {
    return jobs.sort((a, b) => {
      const aTime = a[sort].getTime();
      const bTime = b[sort].getTime();
      return order === 'asc' ? aTime - bTime : bTime - aTime;
    });
  }
}
