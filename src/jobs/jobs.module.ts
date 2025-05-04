import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsRepository } from './jobs.repository';

@Module({
  controllers: [JobsController],
  providers: [JobsRepository],
})
export class JobsModule {}
