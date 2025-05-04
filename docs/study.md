### package manager
- "기본 노드 환경에서 실행되게끔 세팅" 이라고 되어있었기 때문에 npm선택


### node-json-db
[https://www.npmjs.com/package/node-json-db](https://www.npmjs.com/package/node-json-db)

- JSON 파일을 이용한 데이터베이스
- DataPath로 데이터를 탐색할 수 있다. (XMLPath와 유사)


#### CRUD

```ts
{
    test: {
        data1 : {
            array : ['test','array']
        },
        data2 : 5
    }
}
```

- 배열 값 가져오기 : /test/data1/array
- 객체 값 가져오기 : /test/data2
- 전체 객체 가져오기 : /test
- 루트 : /

[참고-tests](https://github.com/Belphemur/node-json-db/tree/master/test)

- CRUD가 일어날 때 마다 파일 전체를 다시 쓴다.
- 따라서 데이터가 많아지면 성능이 떨어진다.

```ts
db.push(path, data);
```

- 기본적으로 기존 데이터 override
- DataPath가 없으면 계층 생성
- 객체를 직접 push 할 수 있음
- append 하고 싶을 경우
- 재귀적으로 동작하고 객체와 배열에 대해서도 동작함

```ts
// If you don't want to override the data but to merge them
// The merge is recursive and works with Object and Array.
await db.push("/test3", {
    new:"cool",
    json: {
        important : 5
    }
}, false); // false option

/*
This give you this results :
{
   "test":"test",
   "json":{
      "test":[
         "test"
      ],
      "important":5
   },
   "new":"cool"
}
```

- primitive타입에서는 불가능 (그냥 override)

```ts
db.getData(path);
```

- 데이터 가져오기
- path가 유효하지 않으면 Error.

```ts
db.getObjectDefault<T>(path, defaultValue: T);
```

- path가 유효하지 않으면 defaultValue 반환하는 getObjectDefault method

```ts
db.save();
```

- saveOnPush false일 경우 매번 호출해서 실제 디스크에 작성해야 함

```ts
db.delete(path);
```

- 데이터 삭제

```ts
db.reload();
```

- 외부 파일 변경사항으로 리로드가 필요할 경우 사용

#### Array

- array index로 접근 가능

```ts
// This will create an array 'myarray' with the object '{obj:'test'}' at index 0
await db.push("/arraytest/myarray[0]", {
    obj:'test'
}, true);

// You can retrieve a property of an object included in an array
// testString = 'test';
var testString = await db.getData("/arraytest/myarray[0]/obj");
```
- 배열 element삭제해도 배열 자체가 사라지진않음.


- 추가 시 [] 사용

```ts
// You can also easily append a new item to an existing array
// This sets the next index with {obj: 'test'}
await db.push("/arraytest/myarray[]", {
    obj:'test'
}, true);


// 이건 { myTest: 'test' } 형식의 객체로 append됨.
await db.push("/arraytest/myarray[]/myTest", 'test', true);
```
- lastItem에는 음수로 접근할 수 있음 (파이썬같이)
- db.count() 로 배열 길이 확인할 수 있음


```ts
// You can have the current index of an object
await db.push("/arraytest/myarray", [{id: 65464646155, name: "test"}], true);
await db.getIndex("/arraytest/myarray", 65464646155);
// The default property is 'id'
// You can add another property instead
await db.getIndex("/arraytest/myarray", "test", "name");

// It's useful if you want to delete an object
await db.delete("/arraytest/myarray[" + await db.getIndex("/arraytest/myarray", 65464646155) + "]");
```
- id 기준으로 index를 반환하는 getIndex.
- 다른 프로퍼티를 찾아 반환할 수 있음.


more: [JsonDB.ts](https://github.com/Belphemur/node-json-db/blob/c38a9e73c98599c7404ac6858e5ad1cba60a37ef/src/JsonDB.ts#L403)


#### filter

```ts
db.filter(path, callback);
```

- 콜백 함수를 이용해 필터링
