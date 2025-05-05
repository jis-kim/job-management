import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JOBS_DB_NAME, JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, { provide: JOBS_DB_NAME, useValue: 'jobs' }, JobsRepository],
})
export class JobsModule {}
