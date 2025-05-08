import { Job } from '@/entity/job.entity';
import { Inject, Injectable } from '@nestjs/common';
import { Config, JsonDB } from 'node-json-db';

export const JOBS_DB_NAME = 'JOBS_DB_NAME';

// CRUD 일어날 때 마다 파일 전체를 다시 쓴다.
@Injectable()
export class JobsRepository {
  private db: JsonDB;

  // filename 동적으로 설정
  constructor(@Inject(JOBS_DB_NAME) private readonly dbName: string) {
    this.db = new JsonDB(new Config(dbName, true, true, '/'));
    this.db.load(); // 파일 로드
  }

  async findAll(): Promise<Job[]> {
    return this.db.getData('/jobs');
  }

  async findById(id: string): Promise<Job | null> {
    const index = await this.getIndex('id', id);
    if (index === -1) {
      return null;
    }
    return this.db.getData(`/jobs[${index}]`);
  }

  // TODO: 추후 push/save 분리 고려
  /**
   * 데이터 저장
   * @param job 저장할 데이터
   * @returns void
   */
  async save(job: Job): Promise<void> {
    // append
    return this.db.push('/jobs[]', job);
  }

  /**
   * 배열 형태로 데이터 저장 (initialize)
   * @param jobs
   */
  async saveMany(jobs: Job[]): Promise<void> {
    this.db.push('/jobs', jobs);
  }

  async delete(id: string): Promise<void> {
    this.db.delete(`/jobs/${id}`);
  }

  async count(): Promise<number> {
    return this.db.count('/jobs');
  }

  async search(key: keyof Job, value: string): Promise<Job[]> {
    return this.db.getData(`/jobs[${await this.getIndex(key, value)}]`);
  }

  /**
   * key=value 인 모든 데이터 반환.
   * @param key
   * @param value
   * @returns
   */
  async filter(key: keyof Job, value: string): Promise<Job[] | undefined> {
    return this.db.filter('/jobs', (job: Job) => job[key] === value);
  }

  /**
   * 배열 중 key=value인 데이터의 index 반환
   * -1이 나온다면 결과 없음.
   * @param key
   * @param value
   * @returns
   */
  private async getIndex(key: keyof Job, value: string): Promise<number> {
    // getIndexValue: property인 경우 반환?
    return this.db.getIndex('/jobs', value, key);
  }
}
