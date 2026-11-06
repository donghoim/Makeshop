# 상품 옵션 식별 체계 개선 v0.2 (옵션코드)

판매·재고 단위(옵션)마다 바뀌지 않는 식별 코드 **옵션코드** `{상품번호}-{순번}`을 하나 추가하는 기획의 v0.2입니다. v0.1이 너무 길고 세부 경우가 많아 핵심만 남겨 새로 작성했고, 상품 검색 조건·옵션 목록 표시 순서까지 정리했습니다. v0.1 정책서·와이어프레임은 상위 폴더 [`../`](../)에 있습니다.

| 구분 | 위치 | 내용 |
|---|---|---|
| 목업 | [`index.html`](./index.html) · [바로 보기](https://donghoim.github.io/Makeshop/product-option-identification/v0.2/) | 옵션 유형별 옵션코드 표시, 상품 검색 조건 |
| HTML 화면정의서 | [`screen-spec.html`](./screen-spec.html) · [바로 보기](https://donghoim.github.io/Makeshop/product-option-identification/v0.2/screen-spec.html) | 화면 13개, 번호 마커와 DESCRIPTION |
| 기획 문서 | [`08_Spec/`](./08_Spec) | 사양 정의서(FR 8·POL 47·AC 31), 요구사항 정의서, 정책서, 와이어프레임 초안, CS 운영·응대 가이드 |
| 테스트 케이스 | [`qa/`](./qa) | 품질관리팀 표준 템플릿 기준 TC 48건(P0~P2) |

## 실행 방법

- `index.html`을 브라우저로 열면 동작합니다(백엔드·DB 없음, Mock 데이터).
- `screen-spec.html`은 목업을 내장한 단일 파일이라 따로 열어도 동작합니다.

공개본에서는 사내 이슈 번호·문서 링크·담당자 정보를 빼고, 내부 DB 필드명은 일반 용어(상품번호·옵션 번호·조합 순번·관리코드)로 바꿨습니다.
