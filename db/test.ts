import { Job } from '@/entity/job.entity';
import { JobsRepository } from '@/jobs/jobs.repository';

const test = async () => {
  const jobsRepository = new JobsRepository();

  const count = await jobsRepository.count();
  console.log('test count', count);

  const allJobs: Job[] = await jobsRepository.search('title', 'test');
  console.log('test allJobs', allJobs);

  const filteredJobs = await jobsRepository.filter('title', 'test');
  console.log('test filteredJobs', filteredJobs);

  const filteredJobs2 = await jobsRepository.filter('status', 'pending');
  console.log('test filteredJobs2', filteredJobs2);
};

test();
