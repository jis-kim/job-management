import { faker } from '@faker-js/faker';
import { v4 } from 'uuid';
import { Job, JobStatus } from '../src/entity/job.entity';
import { JobsRepository } from '../src/jobs/jobs.repository';

export const jobFactory: () => Job = () => {
  return {
    id: v4(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(Object.values(JobStatus)),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const seed = async () => {
  const jobsRepository = new JobsRepository('jobs.json');
  await jobsRepository.pushMany(Array.from({ length: 100000 }, jobFactory));
};

seed();
