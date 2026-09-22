# 메이크샵 MCP Server — 요구사항 정의

> 2026-09-22 갱신: "MakeShop MCP 연동 서비스 기획안"[제안] 내용을 반영해 구조를 개편했습니다. 서비스 정의·서비스 구조·MVP 범위가 구체화되어 기존 초안의 상당수 Open Issue가 해소되었고, 일부 Tool 목록·화면 필요 여부가 변경되었습니다. 기획안 자체가 확정본이 아니므로 본 문서의 신규 반영 내용은 별도 표기가 없는 한 `[제안]`입니다.
>
> 2026-09-22 추가 갱신: 다음 두 가지를 [확정]했습니다 — ① MCP 연결 단위 = 상점(연결 1건은 상점 1개에 귀속), ② `get_product_sales`의 Scope는 `products.read`가 아닌 `analytics.read`. 근거와 상세는 05_Policy 인증·권한 정책을 참고하십시오.
>
> 2026-09-22 OAuth 인증 아키텍처 결정안 반영: 기존 메이크샵 로그인 체계 재사용(MCP 전용 계정 없음), OAuth 2.x Authorization Code + PKCE 구조, 상점 선택 시점, Scope 동의 방식, Access/Refresh Token 사용, 연결 해제 시 revoke 범위를 [확정]했습니다. 상세는 §5-1, §6.1, §10과 05_Policy 인증·권한 정책을 참고하십시오.
>
> 2026-09-22 Tool 세부 정책 결정안 반영: 기준 Timezone(상점 설정 우선, 기본 `Asia/Seoul`), 주문 조회 기준일(주문 생성일), 매출 정의(`gross_sales`/`net_sales` 등), `get_orders`-`get_order_summary` 및 `get_products`-`get_product_sales` 책임 분리, 기본/최대 조회 기간(7일/90일), limit(기본 50/최대 100), Cursor Pagination, 기본 정렬, Timeout(10·15초), Retry 기준, 공통 Error 코드, NO_DATA 처리, AI 분석 책임 범위를 [확정]했습니다. 상세는 06_Data-API/MCP-Tools-Definition.md를 참고하십시오.
>
> 2026-09-22 Task 9 Open Issue 4건 제안 확정: Token 만료시간(Access 1시간/Refresh Idle 90일·절대 1년, Rotation 적용), Rate Limit(상점 단위 분당 60회/시간당 1,000회), 매출 산식(§9 5개 필드 산식), 대표 관리자/부운영자 연결 허용 범위(1차 MVP는 대표 관리자만)를 `[제안]`으로 반영했습니다. 서비스 기획이 업계 표준 관행을 근거로 제시한 값이므로 개발/보안 검증 전까지는 확정본이 아닙니다. 근거는 09_Meeting/2026-09-22_Task9-OpenIssue-최종정책-제안.md 참고.

## 1. 문제 정의

메이크샵 쇼핑몰 운영자가 주문·회원·상품·매출 데이터를 확인하려면 반드시 메이크샵 관리자 화면에 직접 로그인해서 주문/회원/상품/통계 메뉴를 각각 찾아 들어가고, 조건을 설정하고, 조회된 데이터를 직접 비교·분석해야 합니다. "이번 주 주문 몇 건이야?", "지난주 대비 매출이 얼마나 올랐어?" 같은 질문에 ChatGPT·Claude 같은 AI가 답하려면 메이크샵 데이터를 표준화된 방식으로 가져올 수 있는 인터페이스가 있어야 하는데, 현재는 그런 인터페이스가 없습니다.

## 2. 서비스 정의 [제안]

메이크샵 MCP는 **메이크샵 관리자에 AI 채팅 기능을 추가하는 서비스가 아닙니다.** 메이크샵의 Commerce 데이터를 외부 AI가 표준화된 방식으로 조회할 수 있도록 MCP(Model Context Protocol) Server를 제공하는 서비스입니다. 실제 대화형 인터페이스(자연어 해석, Tool 선택, 결과 요약·분석)는 ChatGPT·Claude 등 AI 서비스가 담당하고, 메이크샵은 AI가 정확하고 안전하게 사용할 수 있는 데이터·Tool을 제공하는 역할에 집중합니다.

| 구분 | 메이크샵 MCP가 담당 | AI 서비스가 담당 |
|---|---|---|
| 역할 | 데이터 접근, 사용자 인증, 상점 식별, 권한 검증, Tool 제공, 데이터 반환 | 사용자 자연어 해석, 필요한 Tool 판단, 복수 Tool 호출, 결과 요약·비교·분석, 대화형 인터페이스 |

즉 메이크샵이 자체적으로 자연어 처리나 AI 분석 로직을 개발할 필요는 없습니다.

### 2-1. MCP 연결 주체 [확정]

메이크샵 MCP는 메이크샵 본사 운영자나 슈퍼어드민이 사용하는 기능이 아닙니다. MCP 연결 주체는 **메이크샵을 이용하는 개별 입점사 운영자**입니다. 입점사 운영자는 ChatGPT 등 외부 AI 서비스에서 메이크샵 MCP를 연결해 자신이 운영하는 상점 데이터를 조회·분석할 수 있습니다. 연결 시 사용자는 메이크샵 계정으로 인증하며, 해당 계정이 접근 권한을 보유한 상점만 연결할 수 있고, 다른 입점사 또는 권한이 없는 상점의 데이터에는 접근할 수 없습니다.

**기존 구조 대비 변화**

| 구분 | 기존 구조 | MCP 적용 구조 |
|---|---|---|
| 흐름 | 사용자 → 메이크샵 관리자 접속 → 주문/회원/상품/통계 메뉴 이동 → 조건 설정 → 데이터 조회 → 직접 비교·분석 | 사용자 → ChatGPT/Claude 등 AI 서비스 → 메이크샵 MCP 호출 → 메이크샵 데이터 조회 → AI가 결과·분석 제공 |

## 3. 요청 목적 분석

### 3-1. 쇼핑몰 데이터 접근 방식 개선

현재 쇼핑몰 운영자는 필요한 정보를 확인하기 위해 메이크샵 관리자 내 각 메뉴를 직접 탐색해야 합니다. MCP를 제공하면 외부 AI에서 자연어로 질문하는 것만으로 필요한 데이터를 조회할 수 있습니다.

### 3-2. 기존 메이크샵 데이터를 AI 환경으로 확장

AI 기능 자체를 메이크샵 관리자에 별도로 구축하는 것이 아니라, 기존 메이크샵 데이터를 AI 서비스가 활용할 수 있는 형태로 제공합니다. 이를 통해 메이크샵의 기능을 특정 화면이나 관리자 UI에 한정하지 않고 AI 환경까지 확장할 수 있습니다.

### 3-3. 단순 조회를 넘어 데이터 분석 지원

AI는 하나의 데이터만 조회하는 것이 아니라 여러 MCP Tool을 조합해 데이터를 비교·분석할 수 있습니다. 예를 들어 "지난주보다 이번 주 매출이 왜 떨어졌어?"라는 질문에 AI는 이번 주/지난주 매출, 주문 건수, 객단가, 상품별 판매량, 취소/환불 금액, 신규 회원 수를 각각 조회한 뒤 변화 요인을 분석해 제공할 수 있습니다. (조합 시나리오 상세는 §9 참고)

**기대 효과**
- 운영자가 관리자 화면의 메뉴 구조를 학습하지 않고도 자연어로 즉시 데이터를 확인할 수 있습니다.
- 단순 조회를 넘어, AI가 여러 Tool을 조합해 분석형 질문에도 답할 수 있는 기반이 됩니다.
- 장기적으로는 실행형 액션까지 AI로 처리할 수 있는 구조로 확장 가능합니다.

## 4. 서비스 구조

```
사용자
  ↓
ChatGPT / Claude 등 MCP 지원 AI
  ↓
메이크샵 MCP Server
  ↓
메이크샵 인증 / 권한 검증
  ↓
메이크샵 API / 내부 데이터 서비스
  ↓
주문 / 회원 / 상품 / 매출 데이터
```

## 5. 기본 사용자 Flow

### 5-1. 메이크샵 MCP 연결 [확정: 연결 단위 = 상점 / OAuth 2.x Authorization Code + PKCE]

입점사 운영자가 ChatGPT·Claude 등 MCP 지원 AI 서비스에서 메이크샵 MCP를 추가하는 흐름입니다. MCP 연결 단위는 **상점**이며, 연결 1건은 특정 입점사의 특정 상점 1개에 귀속됩니다. 하나의 메이크샵 계정이 여러 상점을 관리하는 경우, 다른 상점 데이터를 함께 사용하려면 해당 상점에 대한 별도 연결이 필요합니다(연결 도중 상점을 바꾸는 "전환" 개념은 두지 않습니다). 인증은 메이크샵 입점사 관리자 계정 로그인 체계를 그대로 활용하며, MCP 전용 별도 계정·비밀번호는 만들지 않습니다. 연결 과정 자체는 OAuth 2.x 기반 Authorization Code 방식(PKCE 적용)을 따르며, 메이크샵이 Authorization Server 역할을 수행합니다.

```
GPT 등 외부 AI 서비스에서 MakeShop MCP 연결 시작
  ↓
메이크샵 로그인
  ↓
로그인 계정이 접근 가능한 상점 목록 조회
  ↓
연결 대상 상점 1개 선택
  ↓
요청 Scope 확인 및 동의
  ↓
해당 상점 기준 Authorization Code 발급
  ↓
Access Token / Refresh Token 발급
  ↓
AI 서비스로 복귀 → 연결 완료
```

이후 ChatGPT 등에서 조회되는 주문/상품/회원/매출 데이터는 이 연결에 귀속된 상점의 데이터로 제한됩니다. Access Token·Refresh Token은 사용자 계정, 상점 ID, 승인된 Scope, 연결된 외부 AI Client에 귀속되므로, 동일 사용자가 여러 상점을 연결하면 상점별로 별도의 Token 관계를 가집니다.

### 5-2. 데이터 조회

```
사용자: "이번 주 주문 몇 건이야?"
  ↓
AI가 질문을 분석해 메이크샵 MCP Tool 호출
  ↓
메이크샵이 권한 및 상점 정보 확인
  ↓
주문 데이터 반환
  ↓
AI가 결과 제공 (예: "이번 주 현재까지 주문은 총 324건입니다.")
```

## 6. 요구사항 구조화

### 6.1 필수(Must) — 1차 MVP

| 구분 | 요구사항 |
|---|---|
| MCP Server | MCP 표준 프로토콜을 준수하는 서버를 제공하고, ChatGPT·Claude 등 MCP Client에서 연결 가능해야 함 |
| Tool 노출 | §7의 8개 Tool을 통해 주문/매출/회원/상품 데이터를 조회할 수 있어야 함 |
| 인증 | 메이크샵 기존 입점사 관리자 계정 로그인 체계를 재사용해 사용자를 인증해야 함(MCP 전용 별도 계정 없음). 연결 과정은 OAuth 2.x Authorization Code + PKCE 방식을 따라야 함 |
| 상점 식별 | MCP 연결은 상점 단위로 생성되어야 하며, 하나의 계정이 복수 상점을 관리하는 경우 연결 시 대상 상점을 선택할 수 있어야 함. 다른 상점 데이터가 필요하면 별도 연결을 생성해야 함 |
| 권한 동의 | 연결 시 AI가 접근할 수 있는 데이터 범위(Scope)를 사용자에게 안내하고 동의를 받아야 하며, 동의한 범위 내에서만 Tool을 사용할 수 있어야 함 |
| Token 관리 | Access Token과 Refresh Token을 발급해야 하며, 각 Token은 사용자 계정·상점 ID·승인된 Scope·연결된 AI Client에 귀속되어야 함. 연결 해제 시 해당 상점 연결 건의 Token만 revoke하고 다른 상점 연결에는 영향을 주지 않아야 함 |
| 데이터 격리 | 인증된 사용자가 접근 권한을 보유한 상점의 데이터만 조회할 수 있어야 함 |
| 개인정보 최소화 | 회원 데이터는 기본적으로 통계 중심으로 제공하고, 이름·전화번호·이메일·주소 등 개별 개인정보 제공은 MVP에서 제한해야 함 |
| 호출 로그 | 상점 ID, 사용자 ID, 연결된 AI 서비스, 호출 Tool, 호출 일시, 조회 데이터 범위, 처리 결과를 기록해야 함 |
| 연결 해제 | 사용자가 연결을 해제할 수 있어야 함 |

### 6.2 선택(Nice to have, 2단계 이후)

| 구분 | 요구사항 |
|---|---|
| 분석형 Tool 조합 | 여러 Tool 결과를 조합해 비교·분석하는 시나리오 최적화 |
| 실행형 Tool | 판매중지, 가격 변경, 주문 상태 변경, 쿠폰 발급, 회원 등급 변경 등 write 계열 Tool 및 "확인 후 실행" 플로우 |
| 연결 관리 화면 | 연결 서비스/상태/일시/최근 접근/허용 권한을 확인하고 해제할 수 있는 메이크샵 관리자 내 보조 화면 (MCP 핵심 기능은 아님) |

### 6.3 비기능 요구사항

| 구분 | 요구사항 |
|---|---|
| 보안 | 인증된 사용자·상점 단위로 데이터를 격리하고, 사용자가 동의한 Scope 범위 내에서만 데이터를 제공해야 함 |
| 성능 | 대량 주문/통계 조회 시 응답시간 기준이 필요하며, `get_orders` 등 목록성 Tool은 페이지네이션(건수 제한)이 필수임 |
| 호환성 | MCP 표준 프로토콜을 준수해 ChatGPT·Claude 등 여러 MCP Client와 호환되어야 함 |
| 감사(Audit) | 어떤 AI 서비스 연결이 언제 어떤 Tool을 호출했는지 로그로 남겨야 함 (상세는 05_Policy 로그·예외처리 정책 참고) |
| 데이터 정확성 | Tool 응답은 메이크샵 API/DB 원본 값을 그대로 반영해야 하며, AI가 임의로 값을 추정·가공하지 않아야 함. 조회 실패 시 임의의 결과를 생성하지 않고 실패 상태를 그대로 반환해야 함 |
| 개인정보 보호 | 비밀번호·인증키·결제수단 원문 정보·계좌정보 등 민감정보는 어떤 Tool 응답에도 포함하지 않아야 함 |

## 7. 기능 범위 정의 (Scope)

### In-Scope (1차 MVP)

- 메이크샵 MCP Server 신설 (주문/매출/회원/상품 4개 도메인, 조회·분석 기능 중심)
- 메이크샵 기존 계정 로그인 재사용 + OAuth 2.x Authorization Code(PKCE) 기반 연결, 상점 식별, MCP 권한 동의, Access/Refresh Token 발급 및 연결 해제 시 revoke
- 1차 MVP Tool 목록(8개) [제안]

| Tool | 설명 | 주요 입력값(안) |
|---|---|---|
| `get_orders` | 주문 목록 조회 | start_date, end_date, order_status, payment_method, min_order_amount, max_order_amount, limit |
| `get_order_detail` | 특정 주문 상세 조회 | order_id |
| `get_order_summary` | 기간별 주문 현황 조회(전체 주문건수/결제완료건수/취소건수/주문금액/실결제금액) | start_date, end_date |
| `get_sales_summary` | 기간별 매출 현황 조회(총매출/순매출/주문건수/객단가/취소금액/환불금액) | start_date, end_date |
| `get_members` | 회원 데이터 조회 | join_start_date, join_end_date, member_grade, join_channel |
| `get_member_summary` | 회원 통계 조회(전체 회원수/신규 회원수/탈퇴 회원수) | start_date, end_date |
| `get_products` | 상품 정보 조회(상품명/상품번호/판매가/재고/판매상태/카테고리/옵션) | keyword, category_id, product_status, stock_status |
| `get_product_sales` | 상품별 판매 실적 조회(판매수량/주문건수/매출액/기간별 판매순위) | start_date, end_date, sort, limit |

> 기존 초안의 `get_product_sales_rank`는 기획안 반영 과정에서 `get_product_sales`로 명칭이 정리되었습니다. `get_product_sales`가 반환하는 상품명은 식별을 위한 부가 정보일 뿐 Tool의 본질은 판매 실적(분석) 조회이므로, Scope는 `products.read`가 아닌 `analytics.read`로 분류합니다[확정](§10-1 이하 05_Policy 인증·권한 정책 참고).

- Tool 호출 로그 기록, 연결 해제 처리
- 권한 Scope 4종: `orders.read`, `products.read`, `members.read`, `analytics.read` (상세는 05_Policy 인증·권한 정책 참고)
- Tool-Scope 매핑[확정]: `orders.read`→`get_orders`/`get_order_detail`/`get_order_summary`, `products.read`→`get_products`, `members.read`→`get_members`/`get_member_summary`, `analytics.read`→`get_sales_summary`/`get_product_sales`

### Out-of-Scope (1차 MVP 제외)

- 상품 등록/수정, 상품 가격 변경, 주문 상태 변경, 회원정보 수정, 쿠폰 발급, 재고 변경, 대량 작업 실행 등 데이터 변경(write) 기능 전체
- 메이크샵 관리자 내 별도의 AI 채팅 화면 (MCP 사용 화면은 ChatGPT·Claude 등 외부 AI 서비스이며, 메이크샵 자체 AI 질의 화면은 제공하지 않음)
- 2단계(분석형): 여러 Tool을 조합한 AI 자동 원인 분석 로직 자체의 구현(로직은 AI 서비스 측 역할이며, 메이크샵은 원본 데이터 Tool 제공까지가 범위)
- 3단계(실행형): 판매중지·할인·쿠폰 발급 등 write/modify 계열 Tool 및 관련 권한 체계(`products.write`, `orders.write`, `members.write`, `promotions.write`)
- CS, 배송, 정산 등 주문/회원/상품/매출 외 도메인의 MCP Tool화
- 메이크샵이 아닌 제3자 커머스 플랫폼과의 MCP 연동
- 연결 관리 화면(§6.2) — 고도화 단계에서 별도 검토

## 8. 고도화 로드맵 [제안]

| 단계 | 명칭 | 설명 | 권한 Scope |
|---|---|---|---|
| Phase 1 | 조회형 MCP | 사용자가 메이크샵 데이터를 자연어로 조회 (본 프로젝트 1차 MVP 범위) | `orders.read`, `products.read`, `members.read`, `analytics.read` |
| Phase 2 | 분석형 MCP | 여러 Tool 결과를 AI가 조합해 원인·추이를 분석 | Phase 1과 동일 (조회 Scope 재사용) |
| Phase 3 | 실행형 MCP | 상품 판매중지, 가격 변경, 주문 상태 변경, 쿠폰 발급, 회원 등급 변경 등 AI가 관리자 기능을 직접 실행. 데이터 변경 작업은 실행 전 사용자 확인 절차를 거쳐야 함 | `products.write`, `orders.write`, `members.write`, `promotions.write` (조회 Scope와 별도) |

## 9. AI Tool 조합 시나리오 [확정 — 30건]

Phase 1(조회형) 범위에서 AI가 자연어 질문을 어떤 Tool(조합)로 처리하는지를 정의한 대표 시나리오 30건을 `01_Requirements/AI-Tool-매핑-시나리오.md`에 별도 문서로 정리했습니다. 단일 조회, 조건 조회, 기간 비교, 복합 분석(Phase 2 방향성 포함)뿐 아니라 권한 부족·데이터 없음·잘못된 요청·기간 초과·개인정보 요청 같은 예외 케이스까지 포함하며, 각 시나리오는 사용자 질문 / 선택 Tool / 주요 파라미터 / 필요 Scope / 기대 처리 기준으로 구성됩니다. 이 시나리오는 07_QA 시나리오 작성의 기반 자료로 사용합니다.

시나리오를 실제 Tool 스펙에 대입하는 과정에서 `get_order_summary`의 상태별 조건 필터 부재, `get_products`의 재고 수량 임계값 필터 부재, `get_member_summary`의 등급별 조건 필터 부재 등 스펙 공백이 확인되어 Open Issue로 남겼습니다(AI-Tool-매핑-시나리오.md §10, 06_Data-API §12).

## 10. Open Issues

2026-09-22 개발/보안 리뷰 준비 과정에서 전체 Open Issue를 재점검해, 기획 차원에서 바로 결정 가능한 항목은 확정 처리하고 나머지는 검토 주체 기준으로 재분류했습니다.

### 개발 검토 필요

| 번호 | 항목 | 확인 필요 대상 |
|---|---|---|
| 1 | 메이크샵 MCP Server를 신규로 자체 구축할지, 기존 메이크샵 Open API를 MCP 프로토콜로 래핑하는 형태로 할지 | 개발 |
| 2 | 기존 메이크샵 인증 시스템과 신규 MCP Authorization Server(권한 동의·Token 발급 체계) 간 기술적 연동 구조 | 개발 |
| 3 | Response 필드명(영문 snake_case 등)의 최종 확정 (06_Data-API §12 참고) | 개발 |
| 4 | 한 상점에 대표 관리자가 여러 명인 경우 여러 MCP 연결을 어떻게 구분·관리할지 | 정책/개발 |

### 개발/보안 검토 필요

| 번호 | 항목 | 확인 필요 대상 |
|---|---|---|
| 5 | 제안된 Access/Refresh Token 만료시간(1시간/90일/1년)·Rotation 방식이 실제 시스템에서 구현 가능한지 | 개발/보안 |
| 6 | Scope가 변경될 때 기존 발급된 Token을 그대로 사용할지, 재발급할지 | 개발/보안 |
| 7 | 제안된 매출 산식(`gross_sales`/`net_sales` 등)과 Rate Limit 수치(분당 60회/시간당 1,000회)가 실제 시스템·인프라에서 구현 가능한지 (상세는 06_Data-API §9, §11-11, §12 참고) | 개발/인프라 |

### 가정 (검토 대상 아님)

| 번호 | 항목 | 근거 |
|---|---|---|
| 8 | 1차 MVP를 조회형(Phase 1)으로 한정하고 데이터 변경 기능은 전부 제외 | "MakeShop MCP 연동 서비스 기획안" §15에서 포함/제외 범위로 명시한 내용을 근거로 함 |

다음 항목은 논의를 거쳐 [확정]되었으므로 더 이상 Open Issue가 아닙니다.

- ~~MCP 연결 단위(계정 vs 상점)~~ → 상점 단위로 확정 (§2-1, §5-1)
- ~~`get_product_sales`의 Scope(`products.read` vs `analytics.read`)~~ → `analytics.read`로 확정 (§7)
- ~~인증 방식을 기존 계정 로그인 그대로 쓸지, MCP 전용 계정을 만들지~~ → 기존 메이크샵 관리자 계정 로그인 재사용, MCP 전용 계정 없음으로 확정 (§5-1, §6.1)
- ~~OAuth 구조~~ → OAuth 2.x Authorization Code + PKCE, 메이크샵이 Authorization Server 역할 수행으로 확정 (§5-1)
- ~~상점 선택 시점~~ → 로그인 직후, Scope 동의 이전으로 확정 (§5-1)
- ~~Scope 동의 방식~~ → 4종 Scope(orders.read/products.read/members.read/analytics.read) 안내 후 동의, 미동의 Scope의 Tool은 호출 불가로 확정 (§6.1)
- ~~Access/Refresh Token 사용 여부~~ → 둘 다 사용하는 것으로 확정. 구체적 만료시간은 위 표 #2에서 별도로 확인 (§6.1)
- ~~연결 해제 시 revoke 여부~~ → 해제 시 해당 상점 연결 건의 Token만 revoke, 다른 상점 연결에는 영향 없음으로 확정 (§5-1, §6.1)
- ~~날짜 파라미터의 기준 Timezone~~ → 상점 설정 Timezone 우선, 기본값 `Asia/Seoul`로 확정 (06_Data-API §11-1)
- ~~주문/매출 관련 Tool의 날짜 기준(주문일 vs 결제일)~~ → 주문 생성일(`order_created_at`) 기준으로 확정 (06_Data-API §11-2)
- ~~`get_orders`와 `get_order_summary`의 책임 분리 기준~~ → 목록/조건 조회는 `get_orders`, 집계 조회는 `get_order_summary`로 확정 (06_Data-API §9-1)
- ~~통계 Tool(집계 데이터)과 목록 Tool(Raw)의 조회 범위·건수 상한~~ → 집계형 Tool 4종은 기본 7일/최대 90일, 목록형 Tool 4종은 기본 limit 50/최대 100으로 별도 확정 (06_Data-API §11-3, §11-4)
- ~~각 Tool의 Timeout 기준값~~ → 일반 조회 10초 / 집계·분석형 15초로 확정 (06_Data-API §11-9)
- ~~`get_order_summary`의 상태별 조건 집계 파라미터 부재~~ → `order_status` 필터 추가로 확정 (06_Data-API §3)
- ~~`get_products`의 재고 수량 임계값 필터 부재~~ → `min_stock`/`max_stock` 필터 추가로 확정 (06_Data-API §7)
- ~~`get_member_summary`의 등급 조건 필터 부재~~ → `member_grade` 필터 추가로 확정 (06_Data-API §6)
- ~~Access/Refresh Token 만료시간·Rotation 방식~~ → Access Token 1시간, Refresh Token Idle 만료 90일·절대 만료 1년, Rotation+재사용 탐지 적용으로 제안 확정[제안] (05_Policy 인증·권한 정책 §3-7)
- ~~대표 관리자/부운영자 MCP 연결 허용 범위~~ → 1차 MVP는 대표 관리자만 허용으로 제안 확정[제안] (05_Policy 인증·권한 정책 §3-10)
- ~~Rate Limit 기준~~ → 상점 단위 분당 60회/시간당 1,000회로 제안 확정[제안] (06_Data-API §11-11)
- ~~매출 산식 및 배송비/포인트/취소·환불 반영 기준~~ → §9와 같이 제안 확정[제안] (06_Data-API §9)
- ~~쇼핑몰(상점) 1곳당 AI 서비스 연결 허용 개수~~ → 제한하지 않음(무제한)으로 확정 — 연결이 상점 단위로 격리되고 매 요청마다 Token의 상점 ID를 검증하므로, 연결 개수 자체를 제한할 보안상 필요가 없음
- ~~Tool 호출 과금 여부~~ → 1차 MVP는 과금하지 않음(무료 제공)으로 확정. 유료화 여부는 사업 전략 차원의 별도 검토 대상이며 본 프로젝트 범위 밖
- ~~연결 관리 화면(§6.2)의 고도화 단계 진행 여부 및 시점~~ → Phase 2(분석형 MCP) 착수 시점에 재검토하기로 확정. 1차 MVP·연결 단계에서는 착수하지 않음

위 표의 항목은 모두 확정된 내용이 아니며, 관련 담당자 확인 후 05_Policy 이하 단계에서 반영합니다.
