import { Job } from '@/entity/job.entity';
import { Injectable } from '@nestjs/common';
import { Config, JsonDB } from 'node-json-db';

const DB_NAME = 'jobs';

// CRUD 일어날 때 마다 파일 전체를 다시 쓴다.
@Injectable()
export class JobsRepository {
  private db: JsonDB;
  //public db: JsonDB;

  constructor() {
    this.db = new JsonDB(new Config(DB_NAME, true, true, '/'));
  }

  async findAll(): Promise<Job[]> {
    return this.db.getData('/jobs');
  }

  // TODO: 추후 push/save 분리 고려
  async save(job: Job): Promise<void> {
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
