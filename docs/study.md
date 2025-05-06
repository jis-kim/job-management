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

## Error

DataError (데이터 관련 에러)
| 에러 메시지 | 발생 상황 |
|-------------|-----------|
| The Data Path can't be empty | 데이터 경로(DataPath)가 비어 있을 때. (최소한 루트 구분자 /는 있어야 함) |
| Can't find dataPath: /XXX. Stopped at YYY | 지정한 DataPath의 전체 계층이 DB에 존재하지 않을 때. (getData, delete 등에서 경로가 없을 때) |
| Can't merge another type of data with an Array | 현재 데이터가 배열이 아닌데, 배열 데이터를 병합(push)하려고 할 때. |
| Can't merge an Array with an Object | 현재 데이터가 배열인데, 객체 데이터를 병합(push)하려고 할 때. |
| DataPath: /XXX. YYY is not an array. | 배열이어야 할 경로에 배열이 아닌 데이터가 있을 때. |
| DataPath: /XXX. Can't find index INDEX in array YYY | 배열에서 존재하지 않는 인덱스에 접근하려고 할 때. |
| Only numerical values accepted for array index | 배열 인덱스에 숫자가 아닌 값을 사용하려고 할 때. |
| The entry at the path (/XXX) needs to be either an Object or an Array | find 메서드 사용 시, rootPath가 객체나 배열이 아닐 때. |


DatabaseError (DB 파일 관련 에러)
| 에러 메시지 | 발생 상황 |
|-------------|-----------|
| Can't Load Database: XXXX | DB 파일을 불러오는 데 실패했을 때. (내부 에러는 error.inner에 있음) |
| Can't save the database: XXX | DB 파일 저장에 실패했을 때. (내부 에러는 error.inner에 있음) |
| DataBase not loaded. Can't write | DB가 제대로 로드되지 않아, 데이터 저장을 막을 때. (기존 DB 손상 방지 목적) |
