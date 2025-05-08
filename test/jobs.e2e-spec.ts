import { Job, JobStatus } from '@/entity/job.entity';
import { JobsModule } from '@/jobs/jobs.module';
import { JOBS_DB_NAME, JobsRepository } from '@/jobs/jobs.repository';
import { faker } from '@faker-js/faker/.';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

describe('Jobs API 통합 테스트', () => {
  let app: INestApplication;
  let repository: JobsRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JobsModule],
    })
      .overrideProvider(JOBS_DB_NAME)
      .useValue('jobs-test')
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    repository = app.get<JobsRepository>(JobsRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    //await repository.clear();
  });

  describe('POST /jobs', () => {
    it('정상적으로 job 생성', async () => {
      const createJobDto = {
        title: 'test job',
        description: 'test description',
      };

      const response = await request(app.getHttpServer()).post('/jobs').send(createJobDto).expect(201);

      expect(response.body).toMatchObject({
        title: createJobDto.title,
        description: createJobDto.description,
        status: JobStatus.PENDING,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('/jobs (POST) 필수값 누락시 400', async () => {
      const badDto = {
        description: 'only description',
      };
      await request(app.getHttpServer()).post('/jobs').send(badDto).expect(400);
    });

    it('/jobs (POST) 타입이 잘못된 경우 400', async () => {
      const badDto = {
        title: 123, // number
        description: {},
      };
      await request(app.getHttpServer()).post('/jobs').send(badDto).expect(400);
    });

    it('/jobs (POST) 문자열 길이 제한 초과시 400', async () => {
      const badDto = {
        title: faker.string.alpha(101), // 100자 제한
        description: 'description',
      };
      await request(app.getHttpServer()).post('/jobs').send(badDto).expect(400);
    });

    it('/jobs (POST)  길이 제한 초과시 400', async () => {
      const badDto = {
        title: 'title',
        description: faker.string.alpha(1001), // 1000자 제한
      };
      await request(app.getHttpServer()).post('/jobs').send(badDto).expect(400);
    });
  });

  describe('GET /jobs/:id', () => {
    it('정상적으로 job 조회', async () => {
      const job = await request(app.getHttpServer()).post('/jobs').send({
        title: 'test job',
        description: 'test description',
      });

      const response = await request(app.getHttpServer()).get(`/jobs/${job.body.id}`).expect(200);
      expect(response.body.id).toBe(job.body.id);
      expect(response.body.title).toBe(job.body.title);
      expect(response.body.description).toBe(job.body.description);
      expect(response.body.status).toBe(job.body.status);
      expect(response.body.createdAt).toBe(job.body.createdAt);
      expect(response.body.updatedAt).toBe(job.body.updatedAt);
    });
  });
});
