# job-management
작업(Job) 관리 백엔드 시스템

## 프로젝트 실행

- node v20 이상이 필요합니다. (nest v11 요구사항)
- 프로젝트 루트에서 아래 명령어로 실행합니다.

```bash
npm install
# npm run seed ${length} # 필요한 경우, 1000개의 데이터가 생성됩니다. length 조절로 원하는 길이의 job을 생성할 수 있습니다.
npm run build
node dist/main.js #혹은 npm run start
```

## API 명세

- swagger 문서는 `http://localhost:3000/api`에서 확인하실 수 있습니다.


### POST /jobs

- 새로운 작업을 생성합니다.

```bash
curl -X POST 'http://localhost:3000/jobs' -H 'Content-Type: application/json' -d '{"title": "string", "description": "string"}'
```

#### Request
```json
{
  "title": "string", // 100자 이하
  "description": "string" // 1000자 이하
}
```

#### Response (생성된 Job)

- 생성된 작업을 반환합니다.
- 생성된 작업의 id는 uuid 형식입니다.

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
- pagination을 지원합니다. (offset 기반)

#### Request

```bash
curl -X GET 'http://localhost:3000/jobs?offset=0&limit=10&sort=createdAt&order=desc'
```
##### Query Parameter

- offset: 조회할 첫 번째 작업의 인덱스 (default: 0)
- limit: 조회할 작업의 수 (default: 10)
- sort: 정렬 기준 (createdAt, updatedAt) (기본값 없음)
- order: 정렬 순서 (asc, desc) (default: desc)

- sort가 제공되지 않으면 정렬하지 않고 반환합니다.

#### Response

```json
{
  "jobs": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "pending",
      "createdAt": "2025-05-05T00:00:00.000Z",
      "updatedAt": "2025-05-05T00:00:00.000Z"
    },
  ],
}
```

- meta 정보도 고려하였으나 요구사항이 "jobs 객체 리스트"로 명확했으므로 포함하지 않았습니다.
  - total, 현재 페이지 등




### GET /jobs/:id

- id값으로 특정 작업을 조회합니다.
- id가 uuid형식이 아니면 400(Bad Request)오류를 반환합니다.

#### Request

```bash
curl -X GET 'http://localhost:3000/jobs/${uuid형식의 id}'
```

#### Response

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



### GET /jobs/search

- 작업을 검색합니다.
- Query Parameter로 검색 조건을 지정할 수 있습니다.
  - "title": job의 제목
  - "status": job의 상태 (pending, processing, completed, failed)
- title, status 모두 제공되면 둘 다 만족하는 작업을 반환합니다.
- 하나만 제공되면 해당 조건을 만족하는 작업을 반환합니다.
- 둘 다 제공되지 않으면 모든 작업을 반환합니다.
- 페이지네이션을 지원합니다.

#### Request

```bash
curl -X GET 'http://localhost:3000/jobs/search?title=string&status=pending&offset=0&limit=10&sort=createdAt&order=desc'
```

##### Query Parameter

- title: 작업의 제목
- status: 작업의 상태 (pending, processing, completed, failed)
- offset: 조회할 첫 번째 작업의 인덱스 (default: 0)
- limit: 조회할 작업의 수 (default: 10)
- sort: 정렬 기준 (createdAt, updatedAt) (기본값 없음)
- order: 정렬 순서 (asc, desc) (default: desc)

- sort가 제공되지 않으면 정렬하지 않고 반환합니다.

#### Response

```json
{
  "jobs": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "pending",
      "createdAt": "2025-05-05T00:00:00.000Z",
      "updatedAt": "2025-05-05T00:00:00.000Z"
    }
  ]
}
```

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

##### 성능 비교 (k6 사용)

- 10000개의 job 데이터가 있고, `POST /jobs` API를 요청하는 상황
- `POST` 호출 직후 `GET /jobs/search?title` 요청으로 리소스가 created 되었는지 확가
- 100명의 vu, 10초동안 0.1초 간격으로 요청

###### 1. push/save 동시 호출 (둘 다 await 처리)

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
```

###### 2. push만 await, save는 비동기 처리

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


| 항목 | 1.await 있음(동기) | 2.await 없음(비동기- 개선안) |
|---------------------|--------------------------|-------------------------|
| POST 평균 | 2,592ms (2.6초) | 2,007ms (2.0초) |
| POST 중앙값 | 2,664ms (2.7초) | 804ms |
| POST 최대 | 9,946ms (9.9초) | 32,436ms (32.4초) |
| POST 90% | 2,905ms | 1,721ms |
| POST 95% | 3,420ms | 7,569ms 안
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
- 그러나 p95가 file I/O 병목으로 엄청 느림..
  - 덩달아 GET도 느려짐.

=> 새로운 개선안의 필요성을 느끼고 3번으로 개선

#### 3.POST 요청마다 save()를 하는게 아니라 1초마다 따로 호출
  - 데이터 유실 가능성 -> 간격을 1초로 설정하여 최소화
  - POST 요청이 적을 때 비효율적임 -> `dirty`라는 플래그를 이용해 `dirty === true`일 때만 `save()` 호출

- 성능 테스트

```bash

  █ TOTAL RESULTS

    CUSTOM
    get_duration............................................................: avg=16.373569 min=0.32     med=5.896    max=288.064  p(90)=46.7824  p(95)=71.19695
    post_duration...........................................................: avg=29.670749 min=0.178    med=12.83    max=287.975  p(90)=81.1729  p(95)=111.19215

    HTTP
    http_req_duration.......................................................: avg=23.02ms   min=178µs    med=8.05ms   max=288.06ms p(90)=65.05ms  p(95)=93.54ms
      { expected_response:true }............................................: avg=23.02ms   min=178µs    med=8.05ms   max=288.06ms p(90)=65.05ms  p(95)=93.54ms
    http_req_failed.........................................................: 0.00%  0 out of 40976
    http_reqs...............................................................: 40976  1357.824678/s

    EXECUTION
    iteration_duration......................................................: avg=146.83ms  min=100.62ms med=123.01ms max=520.08ms p(90)=221.92ms p(95)=253.18ms
    iterations..............................................................: 20488  678.912339/s
    vus.....................................................................: 100    min=100        max=100
    vus_max.................................................................: 100    min=100        max=100

    NETWORK
    data_received...........................................................: 18 MB  592 kB/s
    data_sent...............................................................: 6.2 MB 205 kB/s




running (0m30.2s), 000/100 VUs, 20488 complete and 0 interrupted iterations
default ✓ [======================================] 100 VUs  30s
```

- 총 요청 수: 40,976건 (30초간, 100 VU)
- 평균 응답속도: 23ms (0.023초)
- POST 평균: 29.7ms
- POST 중앙값: 12.8ms
- POST 최대: 288ms
- POST 90%: 81ms
- POST 95%: 111ms
- GET 평균: 16.4ms
- GET 중앙값: 5.9ms
- GET 최대: 288ms
- GET 90%: 46ms
- GET 95%: 71ms
- 실패율: 0%
- 초당 처리량: 1,357건


이전 결과(비동기 save, 평균 1.3초, 2,292건)와 비교
| 항목 | 이전 결과(비동기 save) | 이번 결과(주기적 save) |
|---------------------|-----------------------|-----------------------|
| POST 평균 | 2,007ms (2.0초) | 29.7ms |
| POST 중앙값 | 804ms | 12.8ms |
| POST 최대 | 32,436ms (32.4초) | 288ms |
| POST 90% | 1,721ms | 81ms |
| POST 95% | 7,569ms | 111ms |
| GET 평균 | 644ms | 16.4ms |
| GET 중앙값 | 585ms | 5.9ms |
| GET 최대 | 2,378ms | 288ms |
| 전체 HTTP 평균 | 1.32초 | 23ms |
| 전체 HTTP 최대 | 32.43초 | 288ms |
| 전체 요청 수 | 2,292 | 40,976 |
| 초당 처리량 | 70 | 1,357 |
| 실패율 | 0% | 0% |

- **POST, GET /jobs/search 모두 응답속도 10~100배 향상**
- 초당 처리량 20배 증가
- 실패율 0%

#### 4. rxjs debounceTime

- 변경 이벤트를 구독하고 1초 동안 변경이 없으면 마지막 데이터를 방출
- 3의 단점인 interval을 매번 호출하는 문제 해결



```bash
  █ TOTAL RESULTS

    CUSTOM
    get_duration............................................................: avg=19.882529 min=0.308    med=7.676   max=242.859  p(90)=57.282   p(95)=77.7194
    post_duration...........................................................: avg=37.446717 min=0.178    med=19.622  max=258.185  p(90)=96.6316  p(95)=115.1484

    HTTP
    http_req_duration.......................................................: avg=28.66ms   min=178µs    med=11.24ms max=258.18ms p(90)=81.84ms  p(95)=103.2ms
      { expected_response:true }............................................: avg=28.66ms   min=178µs    med=11.24ms max=258.18ms p(90)=81.84ms  p(95)=103.2ms
    http_req_failed.........................................................: 0.00%  0 out of 37930
    http_reqs...............................................................: 37930  1254.17792/s

    EXECUTION
    iteration_duration......................................................: avg=158.78ms  min=100.62ms med=135.2ms max=460.22ms p(90)=234.23ms p(95)=272.39ms
    iterations..............................................................: 18965  627.08896/s
    vus.....................................................................: 100    min=100        max=100
    vus_max.................................................................: 100    min=100        max=100

    NETWORK
    data_received...........................................................: 17 MB  547 kB/s
    data_sent...............................................................: 5.7 MB 189 kB/s




running (0m30.2s), 000/100 VUs, 18965 complete and 0 interrupted iterations
default ✓ [======================================] 100 VUs  30s
```
- 빠른 성능, 낮은 실패율.


##### 문제점
- 1초동안 변경이 없으면 `save()`하므로 끊임없이 요청이 오는 경우 저장이 안됨.
- 닫길 때 처리를 위해 `onModuleDestroy`에서 `save()` 호출.
  적용을 위해 `main.ts`에서 `app.enableShutdownHooks()` 추가.
- SIGINT, SIGTERM 등으로 종료 시 `save()` 호출되는 것을 확인함.

- 그런데 onModuleDestroy 호출 시점에 이벤트 큐에 쌓여있던 request가 모두 처리되지 않아 `save()`가 먼저 호출되면서 나중에 들어온 request가 201을 받는데도 실제 파일에는 저장되지 않고 유실되는 문제가 발생.
- queue(req, req, req, save(onModuleDestroy), req, req, req)... <- 뒤의 요청들이 파일에 반영되지 않음.
- 종료 시 데이터 유실이 커서 3번 개선안을 적용 (1초마다 `save()` 호출하므로 예상치 못한 종료 시에도 데이터 유실이 적음)

### 3. index hash map 사용

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


## 기타

### merge strategy

- 기능 단위로 커밋 히스토리 관리하기 위해 squash merge 사용

### package manager
- 기본 환경으로 가정되었으므로 npm 사용

### 동시성 처리
- 다중 POST, POST 직후의 GET 요청 등은 node-json-db의 동시성 처리 기능 테스트 및 k6를 활용한 실제 성능 테스트로 데이터 유실이 없음을 확인.
- 다중 POST: 데이터 오류 없이 정상데이터가 저장됨.
- POST 직후의 GET 요청: 데이터 오류 없이 정상데이터가 조회됨.


<details>
<summary>node-json-db의 테스트 코드</summary>

[github-node-json-db 동시성 처리 테스트](https://github.com/Belphemur/node-json-db/blob/master/test/06-concurrency.test.ts)

```ts
describe('Multi push', () => {
        test('should not corrupt the data', async () => {
            const db = new JsonDB(new Config('test-concurrent-write'));
            db.resetData({});
            let promiseList = [];
            for (let i = 0; i < 10; i++) {
                // NOTE: pushing the promise without awaiting for it!
                promiseList.push(addData(db) as never);
            }

            // Represent multiple async contexts, all running concurrently
            await Promise.all(promiseList);

            const result = await db.getData("/");
            expect(result).toHaveProperty('record');
            for (let i = 0; i < 10; i++) {
                expect(result.record).toHaveProperty(`key${i}`)
                expect(result.record[`key${i}`].strval).toBe(`value ${i}`);
                expect(result.record[`key${i}`].intval).toBe(i);
            }
            expect(counter).toBe(10)
        })

    });

describe('Multi getData', () => {
    test('should be blocking and wait for push to finish', async () => {
        const db = new JsonDB(new Config('test-concurrent-read'));
        let counter = 1;
        let record = {
            strval: `value ${counter}`,
            intval: counter
        };
        //We don't await the promise directly, to trigger a concurrent case
        const pushPromise = db.push(`/test/key${counter}`, record, false);
        const data = await db.getData("/test")

        await pushPromise;

        expect(data).toHaveProperty(`key${counter}`)
        expect(data[`key${counter}`]).toEqual(record);
    });
});
```

</details>

- rwlock을 내부적으로 사용 중.
  - write 중 일 때 read, write 접근 불가능.
  - read 중 일 때는 다른 read 접근 가능, write 접근 불가능.

### 아쉬운 점?
- 너무 많은 요청이 일어나면 in-memory 데이터의 크기가 커지고, GC가 제대로 안되어서 OOM이 발생함(4GB)
   - late limiter를 적용하는 방법 등 (nestjs/throttler)
   - 근본 해결이 아님.. 데이터 쌓이면 그냥 메모리에 부담이 커짐. (파일 4기가되면 그대로 뻥)
   - 다른 DB를 사용하는 게 어떨까..
- 데이터 유실을 좀 더 적극적으로 막을 수 없을까?
  - node-json-db가 내부에서 `fs.open()` 사용해서 truncate 되는 것이 기본 옵션임.
  - write 하다 실패하면 그대로 파일 데이터 죄다 손실
  - 백업 파일의 생성 등으로 막을 수 있을까?
    - 이것도 write lock 문제 때문에 동일 프로세스에서 진행해야 될 것으로 예상됨.
- GET API들의 caching
  - index hash map을 적용하는 것으로 속도가 많이 빨라졌고.. 부하 테스트 하느라 시간이 많이 흘러서 적용하지는 못했음.
  - 어느 API에 어떤 기준으로 적용할지, 어떻게 적용시킬지 불분명함.
