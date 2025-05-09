import { faker } from '@faker-js/faker';
import { v4 } from 'uuid';
import { Job, JobStatus } from '../src/entity/job.entity';
import { JobsRepository } from '../src/jobs/jobs.repository';

const recent = faker.date.recent();

export const jobFactory: (interval: number) => Job = (interval) => {
  const createdAt = new Date(recent.getTime() + interval * 1000);
  return {
    id: v4(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(Object.values(JobStatus)),
    //status: JobStatus.PENDING,
    createdAt,
    updatedAt: createdAt,
  };
};

const seed = async () => {
  const jobsRepository = new JobsRepository('jobs.json');
  await jobsRepository.pushMany(Array.from({ length: process.argv[2] ? parseInt(process.argv[2]) : 1000 }, (_, index) => jobFactory(index)));
  await jobsRepository.save();
};

seed();
