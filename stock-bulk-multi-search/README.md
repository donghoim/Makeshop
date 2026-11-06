# 재고 일괄 관리 상품번호 복수 검색

재고 일괄 관리 화면에서도 전체 상품 관리처럼 상품번호를 쉼표로 여러 개 넣어 한 번에 검색할 수 있게 하는 기획입니다. 운영 상점의 요청에서 시작했고, 다른 메뉴에서 이미 쓰는 복수 검색 방식을 그대로 재사용합니다.

| 구분 | 위치 | 내용 |
|---|---|---|
| 목업 | [`index.html`](./index.html) · [바로 보기](https://donghoim.github.io/Makeshop/stock-bulk-multi-search/) | 재고 일괄 관리 검색 영역, 복수 검색 결과·오류 안내 |
| HTML 화면정의서 | [`screen-spec.html`](./screen-spec.html) · [바로 보기](https://donghoim.github.io/Makeshop/stock-bulk-multi-search/screen-spec.html) | 화면 8개, 번호 마커와 DESCRIPTION |
| 기획 문서 | [`08_Spec/`](./08_Spec) | 사양 정의서(FR 4·POL 16·AC 24), 요구사항 정의서, 정책서, 와이어프레임 초안, CS 운영·응대 가이드 |
| 테스트 케이스 | [`qa/`](./qa) | 품질관리팀 표준 템플릿 기준 TC 29건(P0~P2) |

## 실행 방법

- `index.html`을 브라우저로 열면 동작합니다(백엔드·DB 없음, Mock 데이터).
- `screen-spec.html`은 목업을 내장한 단일 파일이라 따로 열어도 동작합니다.

공개본에서는 고객사명·사내 이슈 번호·문서 링크·담당자 정보·테스트 상점 정보를 일반 표현으로 바꾸거나 제외했습니다.
