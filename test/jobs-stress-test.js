import { sleep } from 'k6';
import http from 'k6/http';
import { Counter, Trend } from 'k6/metrics';

const postDuration = new Trend('post_duration');
const getDuration = new Trend('get_duration');
const emptyGetCount = new Counter('empty_get_count'); // 빈 배열 카운트, 0이면 리포트에 출력안됨.

export const options = {
  vus: 100, // 동시에 실행할 가상 유저 수 (원하는 만큼 조절)
  duration: '30s', // 테스트 지속 시간
};

export default function () {
  // POST 요청 - 동기 요청
  const postRes = http.post(
    'http://localhost:3000/jobs',
    JSON.stringify({
      title: `${__VU}-${__ITER}`,
      description: `Job description ${__VU}-${__ITER}`,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
  postDuration.add(postRes.timings.duration);

  // GET 요청
  const getRes = http.get(`http://localhost:3000/jobs/search?title=${__VU}-${__ITER}`);
  // check getRes body size (array)
  // GET 결과가 빈 배열인지 확인
  const body = getRes.json();
  if (Array.isArray(body) && body.length === 0) {
    emptyGetCount.add(1);
  }

  getDuration.add(getRes.timings.duration);

  sleep(0.1); //
}
