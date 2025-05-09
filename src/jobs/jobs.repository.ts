import { Job } from '@/entity/job.entity';
import { Inject, Injectable } from '@nestjs/common';
import { Config, DataError, JsonDB } from 'node-json-db';

export const JOBS_DB_NAME = 'JOBS_DB_NAME';

// CRUD 일어날 때 마다 파일 전체를 다시 쓴다.
@Injectable()
export class JobsRepository {
  public db: JsonDB;

  // js map은 hashmap이라서 조회가 O(1)
  // (key: id, value: index)
  private jobIndexMap: Map<string, number> = new Map();
  private dirty: boolean; // 데이터 변경 여부, save 호출.

  // filename 동적으로 설정
  constructor(@Inject(JOBS_DB_NAME) private readonly dbName: string) {
    this.db = new JsonDB(new Config(dbName, false, true, '/'));
    this.db.load(); // 파일 로드
    this.buildIndexMap();
    this.dirty = false;
  }

  private async buildIndexMap() {
    const jobs = await this.findAll();
    this.jobIndexMap.clear();
    jobs.forEach((job, idx) => {
      this.jobIndexMap.set(job.id, idx);
    });
  }

  /**
   * "dirty == true"인 경우에만 실제 save를 호출.
   * @returns
   */
  async save(): Promise<boolean> {
    if (!this.dirty) return false;
    await this.db.save();
    this.dirty = false;
    return true;
  }

  async findAll(): Promise<Job[]> {
    try {
      const jobs = await this.db.getData('/jobs');
      return jobs as Job[];
    } catch (error) {
      if (error instanceof DataError && error.message.includes("Can't find dataPath")) {
        return []; // 데이터가 없는 경우 빈 배열 반환
      }
      throw error;
    }
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
    const exists = await this.findById(job.id);
    if (exists) {
      throw new Error(`Job with id ${job.id} already exists`);
    }
    await this.db.push('/jobs[]', job);
    this.dirty = true;
    // jobs 배열의 길이를 구해서 마지막 인덱스에 추가된 것으로 처리
    const jobs = await this.findAll();
    this.jobIndexMap.set(job.id, jobs.length - 1);
  }

  /**
   * 배열 형태로 데이터 저장 (initialize)
   * 데이터를 덮어씌움으로 seed에서만 호출할 것
   * @param jobs
   */
  async pushMany(jobs: Job[]): Promise<void> {
    await this.db.push('/jobs', jobs);
    this.dirty = true;
    await this.buildIndexMap(); // 전체 초기화 시에만 전체 빌드
  }

  async delete(id: string): Promise<void> {
    const index = await this.getIndex('id', id);
    if (index === -1) return;
    await this.db.delete(`/jobs[${index}]`);
    // jobIndexMap에서 해당 id 삭제
    this.jobIndexMap.delete(id);
    // 뒤에 있는 인덱스들 1씩 앞으로 당김
    const jobs = await this.findAll();
    for (let i = index; i < jobs.length; i++) {
      this.jobIndexMap.set(jobs[i].id, i);
    }
  }

  /**
   * 특정 job 데이터 업데이트
   * @param id 업데이트할 job id
   * @param job 업데이트 사항을 포함한 job 전체 데이터
   */
  async update(id: string, job: Job): Promise<void> {
    const index = await this.getIndex('id', id);
    if (index === -1) {
      throw new Error(`Job with id ${id} not found`);
    }
    await this.db.push(`/jobs[${index}]`, job);
    this.dirty = true;
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
    if (key === 'id') {
      if (this.jobIndexMap.size === 0) {
        await this.buildIndexMap();
      }
      return this.jobIndexMap.get(value) ?? -1;
    }

    // 다른 key로 검색 (title, status)
    return this.db.getIndex('/jobs', value, key);
  }
}
