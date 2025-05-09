# job-management
작업(Job) 관리 백엔드 시스템

## 프로젝트 실행

- node v20 이상이 필요합니다. (nest v11 요구사항)
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

## 구현 세부사항

### 1. node-json-db 에 특화된 exception filter

- `DataError`, `DataBaseError`를 처리하는 `src/common/filter/json-db-exception.filter.ts` 파일의 `JsonDBExceptionFilter` 클래스
- cause, inner등의 정보를 추가 로깅 후 500 response 반환

- 모든 exception catch하는 `src/common/filter/all-exception.filter.ts` 파일의 `AllExceptionFilter` 클래스
- 4xx일 경우 에러 원인 반환
- 5xx일 경우 에러 원인 로깅 후 메세지로는 'Internal Server Error' 반환해서 클라이언트에서는 세부 원인을 알 수 없도록 함.

### 2. node-json-db 성능 개선

#### 1. constructor에서 파일 로드

- node-json-db에서는 `getData`가 처음 이루어질 때 `load()`를 명시적으로 호출함
- `JobsRepository` (`src/jobs/jobs.repository.ts`)의 constructor에서 `load()`를 미리 호출해 GET API가 처음 호출될 때의 지연을 방지

#### 2. create, update 시 push/save 다른 시점에 호출
- `node-json-db`의 `saveOnPush` 옵션을 false로 지정.
- `POST /jobs` 요청 시 node-json-db의 `push` 메서드 호출은 `await` 처리
  - `save`메서드는 `await` 없이 호출하여 비동기 처리

##### 성능 비교

- 10000개의 job 데이터가 있고, `POST /jobs` API를 요청하는 상황
- `POST` 호출 직후 `GET /jobs/search?title` 요청으로 리소스가 created 되었는지 확가
- 100명의 vu, 10초동안 0.1초 간격으로 요청

1. push/save 동시 호출 (둘 다 await 처리)

```bash
 █ TOTAL RESULTS

    CUSTOM
    get_duration............................................................: avg=46.844347   min=3.016    med=35.461   max=954.909  p(90)=78.7406   p(95)=107.3912
    post_duration...........................................................: avg=2592.455107 min=468.509  med=2663.984 max=9946.969 p(90)=2905.2758 p(95)=3420.906

    HTTP
    http_req_duration.......................................................: avg=1.31s       min=3.01ms   med=482.53ms max=9.94s    p(90)=2.83s     p(95)=2.9s
      { expected_response:true }............................................: avg=1.31s       min=3.01ms   med=482.53ms max=9.94s    p(90)=2.83s     p(95)=2.9s
    http_req_failed.........................................................: 0.00%  0 out of 2194
    http_reqs...............................................................: 2194   72.94425/s

    EXECUTION
    iteration_duration......................................................: avg=2.73s       min=600.04ms med=2.8s     max=10.06s   p(90)=3.07s     p(95)=3.55s
    iterations..............................................................: 1097   36.472125/s
    vus.....................................................................: 100    min=100       max=100
    vus_max.................................................................: 100    min=100       max=100

    NETWORK
    data_received...........................................................: 951 kB 32 kB/s
    data_sent...............................................................: 327 kB 11 kB/s




running (0m30.1s), 000/100 VUs, 1097 complete and 0 interrupted iterations
default ✓ [======================================] 100 VUs  30s
➜ job-management (feature/scheduler) ✗ k6 run test/jobs-stress-test.js

         /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /
   /  \/    \    | |/ /  /   ‾‾\
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/

     execution: local
        script: test/jobs-stress-test.js
        output: -

     scenarios: (100.00%) 1 scenario, 100 max VUs, 1m0s max duration (incl. graceful stop):
              * default: 100 looping VUs for 30s (gracefulStop: 30s)
```

2. push만 awiat, save는 비동기 처리

```bash
 █ TOTAL RESULTS

    CUSTOM
    get_duration............................................................: avg=644.164493  min=3.969   med=585.579  max=2378.982  p(90)=1227.2565 p(95)=1429.8595
    post_duration...........................................................: avg=2007.150839 min=30.684  med=804.0345 max=32436.923 p(90)=1721.9995 p(95)=7569.7625

    HTTP
    http_req_duration.......................................................: avg=1.32s       min=3.96ms  med=699.8ms  max=32.43s    p(90)=1.45s     p(95)=1.78s
      { expected_response:true }............................................: avg=1.32s       min=3.96ms  med=699.8ms  max=32.43s    p(90)=1.45s     p(95)=1.78s
    http_req_failed.........................................................: 0.00%  0 out of 2292
    http_reqs...............................................................: 2292   70.416849/s

    EXECUTION
    iteration_duration......................................................: avg=2.75s       min=157.9ms med=1.41s    max=32.54s    p(90)=2.93s     p(95)=8.53s
    iterations..............................................................: 1146   35.208425/s
    vus.....................................................................: 16     min=16        max=100
    vus_max.................................................................: 100    min=100       max=100

    NETWORK
    data_received...........................................................: 995 kB 31 kB/s
    data_sent...............................................................: 342 kB 11 kB/s




running (0m32.5s), 000/100 VUs, 1146 complete and 0 interrupted iterations
default ✓ [======================================] 100 VUs  30s
```

- get 실패율 0 (count 사용해서 측정, 0이므로 해당 결과에 출력되지 않음.)
- post 평균 응답속도 2초,


| 항목 | 1.await 있음(동기) | 2.await 없음(비동기) |
|---------------------|--------------------------|-------------------------|
| POST 평균 | 2,592ms (2.6초) | 2,007ms (2.0초) |
| POST 중앙값 | 2,664ms (2.7초) | 804ms |
| POST 최대 | 9,946ms (9.9초) | 32,436ms (32.4초) |
| POST 90% | 2,905ms | 1,721ms |
| POST 95% | 3,420ms | 7,569ms |
| GET 평균 | 46.8ms | 644ms |
| GET 중앙값 | 35.5ms | 585ms |
| GET 최대 | 954ms | 2,378ms |
| 전체 HTTP 평균 | 1.31초 | 1.32초 |
| 전체 HTTP 최대 | 9.94초 | 32.43초 |
| 전체 요청 수 | 2,194 | 2,292 |
| 초당 처리량 | 72.9 | 70.4 |
| 실패율 | 0% | 0% |
| iteration 평균 | 2.73초 | 2.75초 |
| iteration 최대 | 10.06초 | 32.54초 |

- 전반적인 응답속도 향상
- 평균, 중앙값 향상
- 그러나 p95가 file 병목으로 엄청 느림

##### 새로운 개선안
  POST 요청마다 하는게 아니라 10초마다 save()를 따로 호출.
  - 데이터 유실 가능성
  - POST 요청이 적을 때 비효율적임


#### 3. index hash map 사용

- node-json-db에서 id로 특정 job데이터를 조회하려면 `getIndex`를 호출해야 함
- `getIndex`는 배열의 길이에 비례하는 시간이 소요됨

- node-json-db에서 제공하는 getIndex

(node-json-db의 getIndex 메서드)
```ts
/**
 * Returns the index of the object that meets the criteria submitted. Returns -1, if no match is found.
 * @param dataPath  base dataPath from where to start searching
 * @param searchValue value to look for in the dataPath
 * @param propertyName name of the property to look for searchValue
 * @returns {Promise<number>}
 */
public async getIndex(
    dataPath: string,
    searchValue: string | number,
    propertyName: string = 'id'
): Promise<number> {
    const data = await this.getArrayData(dataPath)
    return data
        .map(function (element: any) {
            return element[propertyName]
        })
        .indexOf(searchValue)
}
```

- `Map<id: string, index: number>` 형식의 hash map을 만들어서 조회를 O(1)로 만들 수 있음
- `JobsRepository` (`src/jobs/jobs.repository.ts`)의 `getIndex` 메서드에 `node-json-db`의 `getIndex` 메서드 대신 hash map을 사용하여 조회 시간을 줄임

- constructor에서 index map 초기화 (`buildIndexMap`)
- `push` 메서드에서 index map 업데이트
- `get` 메서드에서 index map 사용


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
