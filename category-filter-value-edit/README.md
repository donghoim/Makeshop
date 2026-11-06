# 분류 검색 필터 상세값 수정

분류 검색 필터에 이미 등록한 상세값(필터 단어)을 삭제·재등록 없이 바로 수정할 수 있게 하는 기획입니다. 4단계 분류를 쓰던 상점이 이전해 오면서 부족한 세부 분류를 필터로 대신하게 되었고, 상품군이 늘며 상세값 이름을 바꿔야 하는 일이 생겨 시작했습니다. 개발·QA가 끝난 기능을 표준 산출물로 정리한 공개본입니다.

| 구분 | 위치 | 내용 |
|---|---|---|
| 목업 | [`index.html`](./index.html) · [바로 보기](https://donghoim.github.io/Makeshop/category-filter-value-edit/) | 분류 검색 필터 설정, 상세값 수정·중복·검증 안내 |
| HTML 화면정의서 | [`screen-spec.html`](./screen-spec.html) · [바로 보기](https://donghoim.github.io/Makeshop/category-filter-value-edit/screen-spec.html) | 화면 18개, 번호 마커와 DESCRIPTION |
| 기획 문서 | [`08_Spec/`](./08_Spec) | 사양 정의서(FR 8·POL 31·AC 44), 요구사항 정의서, 정책서, 와이어프레임 초안, CS 운영·응대 가이드 |
| 테스트 케이스 | [`qa/`](./qa) | 품질관리팀 표준 템플릿 기준 TC 45건(P0~P2) |

이전 단계의 필터 관리 개선 프로토타입은 [`../category-filter-improvement/`](../category-filter-improvement)에 있습니다.

## 실행 방법

- `index.html`을 브라우저로 열면 동작합니다(백엔드·DB 없음, Mock 데이터).
- `screen-spec.html`은 목업을 내장한 단일 파일이라 따로 열어도 동작합니다.

공개본에서는 고객사명·사내 이슈 번호·문서 링크·담당자 정보를 일반 표현으로 바꾸거나 제외했습니다.
