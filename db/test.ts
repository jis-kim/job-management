import { Config, JsonDB } from 'node-json-db';

import { Job } from '../src/entity/job.entity';
import { JobsRepository } from '../src/jobs/jobs.repository';
import { jobFactory } from './seed';
const test = async () => {
  const jobsRepository = new JobsRepository('test.json');

  const db = new JsonDB(new Config('test.json', true, true, '/'));


  const count = await jobsRepository.count();
  console.log('test count', count);

  const allJobs: Job[] = await jobsRepository.search('title', 'test');
  console.log('test allJobs', allJobs);

  const filteredJobs = await jobsRepository.filter('title', 'test');
  console.log('test filteredJobs', filteredJobs);

  const filteredJobs2 = await jobsRepository.filter('status', 'pending');
  console.log('test filteredJobs2', filteredJobs2);

  console.log('=============== 10 jobs test ===============');

  const tenJobs = new Array(10).fill(0).map(jobFactory);
  console.time('test 10 jobs push');
  await db.push('/jobs', tenJobs);
  console.timeEnd('test 10 jobs push');

  console.time('test 10 jobs get');
  const tenJobs2 = await db.getData('/jobs');
  console.timeEnd('test 10 jobs get');

  console.time('test 10 jobs append');
  const tenJobs3 = await db.push('/jobs', jobFactory());
  console.timeEnd('test 10 jobs append');

  console.log('=============== 10 jobs test end ===============');

  console.log('=============== 1000000 jobs test ===============');

  const soManyJobs = new Array(1000000).fill(0).map(jobFactory);
  console.time('test 1000000 jobs push');
  await db.push('/jobs', soManyJobs);
  console.timeEnd('test 1000000 jobs push');

  console.time('test 1000000 jobs get');
  const soManyJobs2 = await db.getData('/jobs');
  console.timeEnd('test 1000000 jobs get');

  console.time('test 1000000 jobs append');
  const soManyJobs3 = await db.push('/jobs[]', jobFactory());
  console.timeEnd('test 1000000 jobs append');

  console.log('=============== 1000000 jobs test end ===============');
};

test();
