import { Module, OnModuleDestroy } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsController } from './jobs.controller';
import { JOBS_DB_NAME, JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [JobsController],
  providers: [JobsService, { provide: JOBS_DB_NAME, useValue: 'jobs' }, JobsRepository],
})
export class JobsModule implements OnModuleDestroy {
  constructor(private readonly jobsRepository: JobsRepository) {}
  async onModuleDestroy() {
    await this.jobsRepository.save();
  }
}
