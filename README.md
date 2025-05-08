# job-management
작업(Job) 관리 백엔드 시스템

## 프로젝트 실행

- node v20 이상이 필요합니다.

- 프로젝트 루트에서 아래 명령어로 실행

```bash
npm install
npm run build
npm run start
```

## API 명세

### POST /jobs

- 새로운 작업을 생성합니다.

```json
{
  "title": "string",
  "description": "string"
}
```

- 응답 (생성된 Job)

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "pending",
  "createdAt": "2025-05-05T00:00:00.000Z",
  "updatedAt": "2025-05-05T00:00:00.000Z"
}
```

### GET /jobs

- 모든 작업을 조회합니다.

### GET /jobs/:id

- 특정 작업을 조회합니다.

### GET /jobs/search

- 작업을 검색합니다.
- Query Parameter로 검색 조건을 지정할 수 있습니다.
  - "title": job의 제목
  - "status": job의 상태 (pending, processing, completed, failed)



## 기타

### merge strategy

- 기능 단위로 커밋 히스토리 관리하기 위해 squash merge 사용

### node-json-db 성능 테스트
- 간단히 console.time()으로 `db.push()`와 `db.getData()` 성능 측정

```bash
=============== 10 jobs test ===============
test 10 jobs push: 0.673ms
test 10 jobs get: 0.014ms
test 10 jobs append: 0.139ms
=============== 10 jobs test end ===============
=============== 1000000 jobs test ===============
test 1000000 jobs push: 9.706s
test 1000000 jobs get: 0.159ms
test 1000000 jobs append: 4.682s
=============== 1000000 jobs test end ===============
```

1000000개의 데이터가 있는데 job을 create하는 경우 4.682s 소요로 개선이 필요함.

개선 방안
- 샤딩
- 데이터 저장 방식을 변경
