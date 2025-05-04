import { JobStatus } from '@/entity/job.entity';
import { JobsRepository } from '@/jobs/jobs.repository';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const jobsRepository = new JobsRepository();
  jobsRepository.save({
    id: '1',
    title: 'Job 1',
    description: 'Job 1 description',
    status: JobStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const jobs = await jobsRepository.findAll();
  console.log(jobs);
}
bootstrap();
