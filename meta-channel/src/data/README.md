# src/data

이 폴더의 JSON 파일은 **참고용 Mock 데이터 사본**입니다.

- 실제 프로토타입(`index.html`)이 로드해서 사용하는 데이터는 `src/js/data.js`(`window.MOCK` 객체)입니다.
- `file://` 로 로컬에서 index.html을 직접 열었을 때 `fetch()`로 JSON을 불러오면 브라우저 CORS 정책에 막혀 동작하지 않으므로, 별도 서버 없이 더블클릭만으로 실행 가능하도록 데이터를 JS 객체로 인라인했습니다.
- 아래 JSON 파일들은 `data.js`와 동일한 스키마를 문서화 목적으로 보여주는 참고 자료이며, 코드에서 직접 fetch하지 않습니다.
