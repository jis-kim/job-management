import { Job } from '@/entity/job.entity';
import { Inject, Injectable } from '@nestjs/common';
import { Config, JsonDB } from 'node-json-db';

export const JOBS_DB_NAME = 'JOBS_DB_NAME';

// CRUD 일어날 때 마다 파일 전체를 다시 쓴다.
@Injectable()
export class JobsRepository {
  public db: JsonDB;

  // filename 동적으로 설정
  constructor(@Inject(JOBS_DB_NAME) private readonly dbName: string) {
    this.db = new JsonDB(new Config(dbName, false, true, '/'));
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

  /**
   * 데이터 저장
   * push/save를 분리하여 실제 파일에 save하는 시간 감소
   * @param job 저장할 데이터
   * @returns void
   */
  async push(job: Job): Promise<void> {
    // append
    await this.db.push('/jobs[]', job);
    this.db.save(); // async
  }

  /**
   * 배열 형태로 데이터 저장 (initialize)
   * @param jobs
   */
  async pushMany(jobs: Job[]): Promise<void> {
    await this.db.push('/jobs', jobs);
    this.db.save();
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(`/jobs/${id}`);
    this.db.save();
  }

  async update(id: string, job: Job): Promise<void> {
    await this.db.push(`/jobs/${id}`, job);
    this.db.save();
  }

  /**
   * key=value 인 모든 데이터 반환.
   * @param key
   * @param value
   * @returns
   */
  async filter(key: keyof Job, value: string): Promise<Job[]> {
    const result = await this.db.filter('/jobs', (job: Job) => job[key] === value);
    if (!result || result.length === 0) {
      return [];
    }
    return result as Job[];
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
