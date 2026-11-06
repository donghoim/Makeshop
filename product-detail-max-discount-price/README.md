# 상품 상세페이지 최대할인가 노출

상품 상세페이지에서 그 상품에 적용할 수 있는 할인 목록(쿠폰·회원 등급·적립금·결제수단 혜택 등)과 예상 최저가(최대할인가)를 보여 주는 기능의 기획입니다. 일부 대형 운영 상점에 먼저 배포한 기능을 전체 상점에 공개하기 위해 정책·화면·예외를 표준 산출물로 정리했습니다.

| 구분 | 위치 | 내용 |
|---|---|---|
| 목업 | [`index.html`](./index.html) · [바로 보기](https://donghoim.github.io/Makeshop/product-detail-max-discount-price/) | 상품 상세 최대할인가 영역, 할인 목록 레이어, 관리자 설정 |
| HTML 화면정의서 | [`screen-spec.html`](./screen-spec.html) · [바로 보기](https://donghoim.github.io/Makeshop/product-detail-max-discount-price/screen-spec.html) | 화면 24개, 번호 마커와 DESCRIPTION |
| 기획 문서 | [`08_Spec/`](./08_Spec) | 사양 정의서(FR 13·POL 60·AC 29), 요구사항 정의서, 정책서, 와이어프레임 초안, CS 운영·응대 가이드 |
| 테스트 케이스 | [`qa/`](./qa) | 품질관리팀 표준 템플릿 기준 TC 71건(P0~P2) |

## 실행 방법

- `index.html`을 브라우저로 열면 동작합니다(백엔드·DB 없음, Mock 데이터).
- `screen-spec.html`은 목업을 내장한 단일 파일이라 따로 열어도 동작합니다.

공개본에서는 고객사명·사내 이슈 번호·문서 링크·담당자 정보를 일반 표현으로 바꾸거나 제외했습니다.
