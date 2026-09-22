# MakeShop MCP — Tool 정의 (1차 MVP 8종)

> MCP는 REST API가 아니라 Tool 호출 프로토콜이므로, 아래 표의 `Endpoint`는 실제 URL 경로가 아니라 MCP Tool 이름을, `Method`는 HTTP Method가 아니라 MCP Tool의 **읽기/쓰기 안전성 annotation**(`readOnlyHint` 등)을 의미합니다. 1차 MVP는 8개 Tool 모두 조회 전용이므로 `readOnlyHint: true`, `destructiveHint: false`로 고정합니다.
>
> 모든 Tool은 요청 상점·요청자의 인증·Scope 동의 여부를 먼저 검증한 뒤 동작합니다. 인증/권한 검증 자체의 상세 기준은 05_Policy의 인증·권한 정책을, 응답 필드에서 제외되는 개인정보·민감정보 기준은 05_Policy의 개인정보·보안 정책을, 호출 실패 시 공통 처리 기준은 05_Policy의 로그·예외처리 정책을 따릅니다.
>
> 2026-09-22 "MakeShop MCP Tool 세부 정책 결정안" 반영: Timezone, 기간 기준, 매출 정의, Tool 간 책임 분리, 기본/최대 조회기간, limit, Pagination, 정렬, 검색어, Timeout, Retry, Error 코드, NO_DATA 처리, AI 분석 책임 범위를 `[확정]`했습니다.
>
> 2026-09-22 개발/보안 리뷰 결과 반영("전체 상태: 수정 후 승인"): 매출 산식·Pagination·Timeout(수정)·Rate Limit(수정) 등 대부분 항목이 `[확정]`으로 전환되었습니다. 상세 리뷰 결과는 `09_Meeting/2026-09-22_개발-보안-리뷰요청.md` §8을 참고하십시오. 수정된 3건 중 이 문서에 해당하는 것은 ① Timeout을 전 Tool 10초로 통일, ② Rate Limit 적용 단위를 상점+Client(`shop_id`+`client_id`) 기준으로 변경입니다.

## 1. get_orders — 주문 목록 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_orders` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `orders.read` |
| 목적 | 개별 주문 목록을 조건에 따라 조회합니다. 조건별 주문 목록, 특정 결제수단·상태·금액 조건 조회, 주문 상세 탐색용 Tool입니다. 반환값은 주문 단위 Raw/Detail 데이터 중심입니다. 기간 또는 조건 기준 **집계값**이 필요한 질문("몇 건이야?")은 `get_order_summary`가 담당합니다(§9-1) |
| Request | `start_date`(string, 필수, YYYY-MM-DD, 포함 기준), `end_date`(string, 필수, YYYY-MM-DD, 포함 기준), `order_status`(string, 선택), `payment_method`(string, 선택), `min_order_amount`(number, 선택), `max_order_amount`(number, 선택), `keyword`(string, 선택 — 주문번호 등 허용된 필드만 부분일치 검색, §11-7), `sort_by`/`sort_order`(string, 선택 — 미지정 시 §11-6 기본 정렬 적용), `limit`(number, 선택, 기본 50 / 최대 100), `cursor`(string, 선택 — 다음 페이지 조회용, §11-5) |
| Response | `items`(주문 배열 — 각 항목 `order_id`, `order_created_at`, `order_status`, `payment_method`, `order_amount`, `paid_amount` 등), `next_cursor`, `has_more` |
| Validation | `start_date` ≤ `end_date`(아니면 `DATE_RANGE_INVALID`), 조회 기간이 최대 조회기간(§11-3)을 초과하면 `DATE_RANGE_EXCEEDED`, `limit`이 100을 초과하면 자동 보정하지 않고 `LIMIT_EXCEEDED` |
| Error | 공통 Error(§10-1) + `DATE_RANGE_INVALID`, `DATE_RANGE_EXCEEDED`, `LIMIT_EXCEEDED`, `INVALID_PARAMETER` |
| Retry | 대상 아님(사용자/요청 오류). 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

## 2. get_order_detail — 주문 상세 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_order_detail` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `orders.read` |
| Request | `order_id`(string, 필수) |
| Response | `order_id`, `order_created_at`, `order_status`, `payment_method`, `order_amount`, `paid_amount`, `cancel_amount`, `refund_amount`, 주문 상품 목록 |
| Validation | `order_id`가 조회 대상 상점 소속 주문인지 확인(타 상점 주문 조회 차단) |
| Error | 공통 Error(§10-1) + `RESOURCE_NOT_FOUND`(요청한 `order_id`가 해당 상점에 존재하지 않음) |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

## 3. get_order_summary — 기간별 주문 현황 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_order_summary` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `orders.read` |
| 목적 | 기간 또는 조건 기준 주문 **현황을 집계**하여 반환합니다. 개별 주문 목록을 대량 반환하지 않고 집계값 중심으로 제공합니다. "이번 주 주문 몇 건이야?" 같은 질문에 사용하며, 개별 주문 리스트가 필요하면 `get_orders`를 사용합니다(§9-1) |
| Request | `start_date`(string, 선택 — 미입력 시 최근 7일, §11-3), `end_date`(string, 선택), `order_status`(string, 선택 — 특정 상태의 주문만 집계. 예: "배송준비중 주문 몇 건이야?" → `order_status`=배송준비중) |
| Response | `total_order_count`(전체 주문건수 — `order_status` 지정 시 해당 상태 건수), `paid_order_count`(결제완료건수), `canceled_order_count`(취소건수), `order_amount`(주문금액), `paid_amount`(실결제금액) — 이 금액 필드들은 주문 단위 집계이며, 매출 지표의 정식 정의(`gross_sales`/`net_sales` 등)는 `get_sales_summary`(§9)가 담당합니다 |
| Validation | `start_date` ≤ `end_date`(아니면 `DATE_RANGE_INVALID`), 조회 기간이 최대 90일(§11-3)을 초과하면 `DATE_RANGE_EXCEEDED` |
| Error | 공통 Error(§10-1) + `DATE_RANGE_INVALID`, `DATE_RANGE_EXCEEDED` |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

## 4. get_sales_summary — 기간별 매출 현황 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_sales_summary` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `analytics.read` |
| Request | `start_date`(string, 선택 — 미입력 시 최근 7일, §11-3), `end_date`(string, 선택) |
| Response | `gross_sales`(총 상품주문금액), `discount_amount`(할인 총액), `canceled_amount`(취소금액), `refunded_amount`(환불완료금액), `net_sales`(순매출 — MCP에서 "매출"을 단독으로 지칭할 때 기본으로 사용하는 값), `order_count`(주문건수), `average_order_value`(객단가), `gross_payment_amount`(선택 반환 — 배송비 등을 포함한 결제총액. 기본 매출 지표인 `gross_sales`/`net_sales`에는 배송비를 포함하지 않음) |
| Validation | `start_date` ≤ `end_date`(아니면 `DATE_RANGE_INVALID`), 조회 기간이 최대 90일(§11-3)을 초과하면 `DATE_RANGE_EXCEEDED` |
| Error | 공통 Error(§10-1) + `DATE_RANGE_INVALID`, `DATE_RANGE_EXCEEDED` |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

각 매출 관련 필드의 정의는 §9를 따릅니다.

## 5. get_members — 회원 데이터 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_members` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `members.read` |
| Request | `join_start_date`(string, 선택), `join_end_date`(string, 선택), `member_grade`(string, 선택), `join_channel`(string, 선택), `keyword`(string, 선택 — 회원ID 등 허용된 필드만 부분일치 검색, 개인정보 기반 검색은 제공하지 않음, §11-7), `sort_by`/`sort_order`(string, 선택 — 미지정 시 §11-6 기본 정렬 적용), `limit`(number, 선택, 기본 50 / 최대 100), `cursor`(string, 선택) |
| Response | `items`(회원 목록 배열 — 각 항목 `member_id`(내부 식별용, 검색 대상), `member_grade`, `joined_at`, `join_channel`. 이름·전화번호·이메일·주소 등 개별 식별정보는 05_Policy 개인정보·보안 정책에 따라 응답 필드에 포함하지 않음), `next_cursor`, `has_more` |
| Validation | `limit`이 100을 초과하면 `LIMIT_EXCEEDED`. 조회 조건이 개별 회원을 특정할 수 있는 수준으로 좁혀지더라도 이름 등 식별정보는 반환하지 않음 |
| Error | 공통 Error(§10-1) + `LIMIT_EXCEEDED`, `INVALID_PARAMETER` |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

> `member_id`는 로그인 ID·이메일이 아니라 MCP가 회원마다 별도로 발급하는 불투명(opaque) 내부 식별자입니다(예: `mem_8f3a2c1d`). 이 값만으로는 실제 회원을 역으로 식별할 수 없어 개인정보 최소화 원칙과 상충하지 않는 것으로 확정했습니다(05_Policy 개인정보·보안 정책 3-3, 3-5).

## 6. get_member_summary — 회원 통계 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_member_summary` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `members.read` |
| Request | `start_date`(string, 선택 — 미입력 시 최근 7일, §11-3), `end_date`(string, 선택), `member_grade`(string, 선택 — 특정 등급의 회원만 집계. 예: "이번 달 VIP 신규 가입자 몇 명이야?" → `member_grade`=VIP) |
| Response | `total_member_count`(전체 회원수 — `member_grade` 지정 시 해당 등급 기준), `new_member_count`(신규 회원수), `withdrawn_member_count`(탈퇴 회원수) |
| Validation | `start_date` ≤ `end_date`(아니면 `DATE_RANGE_INVALID`), 조회 기간이 최대 90일(§11-3)을 초과하면 `DATE_RANGE_EXCEEDED` |
| Error | 공통 Error(§10-1) + `DATE_RANGE_INVALID`, `DATE_RANGE_EXCEEDED` |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

## 7. get_products — 상품 정보 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_products` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `products.read` |
| 목적 | 상품 마스터 정보 조회 |
| Request | `keyword`(string, 선택 — 상품명/상품번호 대상 부분일치 검색, §11-7), `category_id`(string, 선택), `product_status`(string, 선택 — 판매중/품절/판매중지 등), `stock_status`(string, 선택), `min_stock`(number, 선택 — 재고 수량 하한, 이상), `max_stock`(number, 선택 — 재고 수량 상한, 이하. 예: "재고 10개 이하 상품" → `max_stock`=10), `sort_by`/`sort_order`(string, 선택 — 미지정 시 §11-6 기본 정렬 적용), `limit`(number, 선택, 기본 50 / 최대 100), `cursor`(string, 선택) |
| Response | `items`(상품 배열 — 각 항목 `product_id`, `product_name`, `product_status`, `price`, `stock`, `category_id`, 옵션 정보 등 상품 **마스터 정보만** 포함. 판매수량·매출액 등 실적 데이터는 포함하지 않음(`get_product_sales` 담당, §9-2)), `next_cursor`, `has_more` |
| Validation | `limit`이 100을 초과하면 `LIMIT_EXCEEDED`. `min_stock` > `max_stock`이면 `INVALID_PARAMETER` |
| Error | 공통 Error(§10-1) + `LIMIT_EXCEEDED`, `INVALID_PARAMETER` |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

## 8. get_product_sales — 상품별 판매 실적 조회

| 항목 | 내용 |
|---|---|
| Endpoint(Tool 이름) | `get_product_sales` |
| Method(안전성) | `readOnlyHint: true` |
| 소속 Scope | `analytics.read` — 조회하는 핵심 값이 상품 마스터 정보가 아니라 기간별 판매실적(분석 데이터)이므로 `products.read`가 아닌 `analytics.read`에 속함(§9-2) |
| 목적 | 상품별 판매실적 조회 |
| Request | `start_date`(string, 선택 — 미입력 시 최근 7일, §11-3), `end_date`(string, 선택), `sort_by`(string, 선택 — 미지정 시 §11-6 기본 정렬 적용), `sort_order`(string, 선택), `limit`(number, 선택, 기본 50 / 최대 100), `cursor`(string, 선택) |
| Response | `items`(상품 배열 — 각 항목 `product_id`, `product_name`(식별용 부가 정보), `sales_quantity`(판매수량), `order_count`(주문건수), `sales_amount`(매출액 — §9의 `net_sales` 정의를 따름), `rank`(순위)), `next_cursor`, `has_more` |
| Validation | `start_date` ≤ `end_date`(아니면 `DATE_RANGE_INVALID`), 조회 기간이 최대 90일(§11-3)을 초과하면 `DATE_RANGE_EXCEEDED`, `limit`이 100을 초과하면 `LIMIT_EXCEEDED` |
| Error | 공통 Error(§10-1) + `DATE_RANGE_INVALID`, `DATE_RANGE_EXCEEDED`, `LIMIT_EXCEEDED` |
| Retry | 대상 아님. 일시적 네트워크 오류·5xx·`UPSTREAM_TIMEOUT`에 한해 서버 내부에서 최대 1회 자동 재시도(§11-10) |
| Timeout | 10초(§11-9, MVP 전 Tool 통일) |

## 9. 매출 정의 [확정 — 개발 리뷰 완료]

MCP 전반에서 "매출"이라는 용어의 혼선을 방지하기 위해, 관련 금액 필드를 아래와 같이 구분해 정의합니다. 개발/보안 리뷰에서 아래 산식 그대로 승인되었으며, 실제 구현 시에는 메이크샵 관리자 통계 화면과 동일한 산식을 사용하는 것이 전제입니다(내부 통계 기준이 우선).

| 필드 | 산식 |
|---|---|
| `gross_sales` | 상품 판매가 × 주문수량을 기준으로 한 **할인 전** 상품 주문금액(배송비 제외) |
| `discount_amount` | 상품할인 + 상품쿠폰 + 주문/장바구니 할인 + 장바구니 쿠폰 + 프로모션 할인의 합계(모두 포함) |
| `canceled_amount` | 취소 완료된 상품의 실제 취소 금액(부분취소 포함) |
| `refunded_amount` | 반품/환불 완료된 상품의 실제 환불 금액(부분환불 포함) |
| `net_sales` | `gross_sales` − `discount_amount` − `canceled_amount` − `refunded_amount` |

MCP에서 "매출"이라는 단어를 단독으로 사용하는 응답은 기본적으로 `net_sales` 기준으로 제공합니다.

**배송비**: 상품 매출(`gross_sales`, `net_sales`)에는 포함하지 않으며, 별도 `shipping_amount` 필드로 반환합니다.

**포인트·적립금·예치금**: 할인이 아니라 **결제수단**으로 취급하며, `net_sales`에서 차감하지 않습니다. 결제수단 Breakdown이 필요하면 별도 필드로 반환할 수 있습니다. 예를 들어 10만 원 상품을 포인트 3만 원 + 카드 7만 원으로 결제했더라도, 매출은 10만 원(포인트 결제분 포함)으로 인식하며 7만 원으로 축소해서 보지 않습니다.

**부분취소·부분환불**: 실제 처리 완료된 금액만 차감합니다.

**기간 기준과 소급 반영**: 주문 관련 건수는 `order_created_at` 기준입니다. 매출은 결제완료 주문을 대상으로 하되, **조회 시점의 취소/환불 상태를 반영**합니다. 즉 9월 1일 주문이 9월 10일에 취소되었다면, 이후 9월 1일이 포함된 기간의 매출을 다시 조회했을 때 그 취소 금액이 반영된 값으로 나옵니다(소급 반영). `get_orders`/`get_order_summary`/`get_sales_summary`는 항상 조회 시점 기준 최신 상태를 반환하는 라이브 조회 Tool이므로, 과거 기간의 `net_sales`는 조회 시점에 따라 달라질 수 있습니다. 단순 주문건수 집계(`get_order_summary`)와 매출 집계(`get_sales_summary`)의 처리 기준은 분리하며, 주문 생성 후 취소된 주문도 `get_orders`에서는 조건에 따라 조회할 수 있습니다.

**서버 집계 원칙**: `get_order_summary`/`get_sales_summary`/`get_member_summary`/`get_product_sales` 등 집계형 Tool은 항상 서버에서 이미 집계된 결과를 반환합니다. AI가 `get_orders` 같은 목록형 Tool로 대량의 Raw 데이터(예: 주문 1,000건)를 직접 받아 합산하도록 설계하지 않습니다.

### 9-1. get_orders와 get_order_summary의 책임 분리 [확정]

| 질문 예시 | 사용 Tool |
|---|---|
| "이번 주 주문 리스트 보여줘" | `get_orders` |
| "이번 주 주문 몇 건이야?" | `get_order_summary` |

`get_orders`는 개별 주문 단위의 Raw/Detail 데이터를 조건에 따라 조회하는 Tool이고, `get_order_summary`는 기간·조건 기준 집계값(건수, 금액)을 반환하는 Tool입니다. 개별 주문 목록을 대량으로 반환하지 않는 것이 `get_order_summary`의 기본 원칙입니다.

### 9-2. get_products와 get_product_sales의 책임 분리 [확정]

| Tool | Scope | 목적 | 반환 예시 |
|---|---|---|---|
| `get_products` | `products.read` | 상품 마스터 정보 조회 | 상품번호, 상품명, 판매상태, 판매가, 재고, 카테고리, 옵션 |
| `get_product_sales` | `analytics.read` | 상품별 판매실적 조회 | 상품번호, 상품명, 판매수량, 주문건수, 매출액, 순위 |

상품명 등 기본 정보가 `get_product_sales` 응답에 포함되더라도, Tool의 본질은 판매실적 분석이므로 `analytics.read`를 적용합니다.

## 10. 공통 Error 및 Response 형식

### 10-1. 공통 Error 코드

아래 Error는 8개 Tool에 공통으로 적용되며, 각 Tool 절의 Error 행에서는 이 공통 목록에 더해 그 Tool에 특화된 Error만 추가로 표기합니다.

| Error 코드 | 의미 |
|---|---|
| `AUTH_REQUIRED` | 인증(Token)이 제공되지 않음 |
| `TOKEN_EXPIRED` | Access Token이 만료됨(Refresh Token으로 갱신 가능) |
| `INVALID_TOKEN` | Token이 유효하지 않음(서명 오류 등) |
| `TOKEN_REVOKED` | 연결 해제 등으로 Token이 revoke(무효화)됨 — `INVALID_TOKEN`의 한 종류로, 재연결이 필요한 경우를 구분하기 위해 별도 코드로 둠 |
| `PERMISSION_DENIED` | 요청 주체가 해당 상점 데이터에 접근할 권한이 없음 |
| `INVALID_SCOPE` | 호출하려는 Tool이 속한 Scope에 사용자가 동의하지 않음(미동의 또는 철회) |
| `SHOP_NOT_FOUND` | 요청 대상 상점을 특정할 수 없거나, Token에 귀속된 상점과 요청 상점이 일치하지 않음 |
| `RATE_LIMITED` | Rate Limit을 초과함(§11-11) |
| `UPSTREAM_TIMEOUT` | 메이크샵 API/내부 데이터 서비스 호출이 시간 내 응답하지 않음 |
| `INTERNAL_ERROR` | 그 외 메이크샵 API/내부 데이터 서비스 호출 실패 |

Tool마다 추가로 쓰이는 Error는 다음과 같습니다.

| Error 코드 | 의미 |
|---|---|
| `INVALID_PARAMETER` | 요청 파라미터 형식·조합이 올바르지 않음 |
| `DATE_RANGE_INVALID` | `start_date`가 `end_date`보다 늦는 등 날짜 조건 자체가 잘못됨 |
| `DATE_RANGE_EXCEEDED` | 조회 기간이 최대 조회 기간(§11-3)을 초과함 |
| `LIMIT_EXCEEDED` | `limit`이 최대값(§11-4)을 초과함 |
| `RESOURCE_NOT_FOUND` | 요청한 리소스(예: `order_id`)가 해당 상점에 존재하지 않음 |

`NO_DATA`는 Error 코드로 사용하지 않습니다(§11-12).

### 10-2. Error Response 형식

모든 Error 응답은 최소 아래 값을 포함합니다.

| 필드 | 설명 |
|---|---|
| `code` | 위 Error 코드 |
| `message` | 사람이 읽을 수 있는 오류 설명 |
| `retryable` | 이 오류가 재시도 가능한 종류인지 여부(§11-10) |
| `request_id` | 요청을 추적하기 위한 고유 ID |

## 11. 공통 정책

### 11-1. 기준 Timezone [확정]

모든 날짜/시간 조회의 기준이 되는 Timezone 규칙입니다.

| 항목 | 내용 |
|---|---|
| 기준 | 상점 설정 Timezone을 우선 적용합니다 |
| 기본값 | 별도 상점 Timezone 설정이 없는 경우 `Asia/Seoul`을 적용합니다 |
| 자연어 기간 해석 | "이번 주", "오늘", "어제", "이번 달" 등 AI가 해석하는 자연어 기간도 동일한 Timezone 기준으로 계산합니다 |
| datetime 형식 | Response 내 datetime 값은 가능하면 ISO 8601 형식으로 반환합니다(예: `2026-09-22T15:30:00+09:00`) |
| Timezone 표기 | Timezone 정보가 필요한 경우 offset 또는 timezone 식별값을 함께 반환할 수 있습니다 |

### 11-2. 기간 조건 기본 원칙 [확정]

| 항목 | 내용 |
|---|---|
| 파라미터 | Tool별 기간 조건은 `start_date`, `end_date` 또는 이에 준하는 명시적 기간값을 사용합니다 |
| 포함 기준 | 시작일과 종료일은 포함 기준으로 조회합니다 |
| 역전 오류 | `start_date > end_date`인 경우 `DATE_RANGE_INVALID`를 반환합니다 |
| 전체기간 조회 금지 | 기간을 입력하지 않았다고 해서 임의의 전체기간을 조회하지 않습니다. 기간이 필요한 Tool에서 값이 누락된 경우 Tool별로 정의된 기본값(§11-3)을 적용하거나, 기본값이 없는 Tool은 필수값으로 취급합니다 |

주문 조회 기준일: `get_orders`, `get_order_summary`의 기본 기간 기준은 **주문 생성일(`order_created_at`)**로 통일합니다. 예를 들어 "이번 주 주문 몇 건이야?"는 이번 주에 생성된 주문 기준으로 조회합니다. 결제일·배송완료일·취소일·환불일 기준 조회는 추후 별도 파라미터로 확장할 수 있으나, 1차 MVP에서는 기준일을 복수로 제공하지 않고 주문 생성일 기준으로 고정합니다.

### 11-3. 기본/최대 조회 기간 [확정]

집계형 Tool의 조회 기간을 과도한 데이터 요청 방지를 위해 제한합니다.

| 항목 | 값 |
|---|---|
| 대상 Tool | `get_order_summary`, `get_sales_summary`, `get_member_summary`, `get_product_sales` |
| 기본값(기간 미입력 시) | 최근 7일 |
| 최대 조회 기간 | 1회당 90일 |
| 초과 시 처리 | 자동 분할 조회하지 않고 `DATE_RANGE_EXCEEDED`를 반환합니다 |

정확한 최대 기간은 성능 검토 후 변경될 수 있으나, MVP 기본안은 90일입니다. `get_orders`는 이 대상에 포함되지 않으며, `start_date`/`end_date`를 필수값으로 유지합니다(§1).

### 11-4. 목록형 Tool limit [확정]

| 항목 | 값 |
|---|---|
| 대상 Tool | `get_orders`, `get_members`, `get_products`, `get_product_sales` |
| 기본값 | `limit = 50` |
| 최대값 | `limit = 100` |
| 초과 요청 처리 | 100을 초과하는 `limit` 요청은 자동으로 100으로 보정하지 않고 `LIMIT_EXCEEDED`를 반환합니다 |

MCP는 대량 데이터 전체 추출 용도로 사용하지 않는 것을 전제로 합니다.

### 11-5. Pagination [확정]

목록형 Tool(§11-4 대상과 동일)은 Cursor 기반 Pagination을 기본 방식으로 사용합니다.

| 항목 | 내용 |
|---|---|
| Response 구조 | `items`, `next_cursor`, `has_more` |
| 첫 호출 | cursor를 전달하지 않습니다 |
| 다음 페이지 | 추가 데이터가 있으면 `next_cursor`를 반환하며, 이후 동일 조건 + `next_cursor`로 다음 데이터를 조회합니다 |
| 방식 선택 이유 | Offset/Page 기반 방식보다, 데이터 변경 중 중복·누락 가능성이 적은 Cursor 방식을 우선합니다 |
| 내부 구현 | 기존 메이크샵 API 구조상 Cursor 방식 적용이 어려운 경우에도, 내부 구현은 Page 방식을 쓰더라도 MCP 인터페이스에서는 반드시 Cursor 형태로 추상화합니다(개발/보안 리뷰 D-3에서 Cursor 방식으로 확정) |

### 11-6. 정렬 정책 [확정]

Tool별 기본 정렬은 다음과 같습니다. 추후 `sort_by`, `sort_order` 파라미터로 확장할 수 있습니다.

| Tool | 기본 정렬 |
|---|---|
| `get_orders` | `order_created_at DESC` |
| `get_members` | `joined_at DESC` |
| `get_products` | `updated_at DESC` |
| `get_product_sales` | `net_sales DESC` |

### 11-7. 검색어(keyword) 정책 [확정]

keyword 검색을 제공하는 Tool은 부분일치를 기본으로 하며, 검색 대상 필드는 Tool마다 명확하게 제한합니다.

| Tool | 검색 대상 필드 |
|---|---|
| `get_products` | 상품명, 상품번호 (예: `keyword="니트"` → 상품명에 "니트"가 포함된 상품 조회) |
| `get_members` | 회원ID 등 허용된 필드만 |
| `get_orders` | 주문번호 등 허용된 필드만 |

개인정보 기반 검색(이름·연락처 등)은 기본적으로 제공하지 않습니다.

### 11-8. 개인정보 반환 원칙 [확정]

Raw 데이터를 반환하는 Tool이라도 필요한 최소 정보만 반환합니다. MVP 기본 정책은 다음과 같습니다.

| 항목 | 제공 여부 |
|---|---|
| 이름 | 마스킹 또는 미제공 |
| 전화번호 | 미제공 |
| 이메일 | 미제공 |
| 주소 | 미제공 |
| 계좌정보 | 미제공 |
| 결제인증정보 | 미제공 |

AI가 분석에 필요로 하지 않는 개인정보는 Response에 포함하지 않습니다. 05_Policy 개인정보·보안 정책의 개인정보 제공 최소화 원칙(전 항목 미제공)과 정합성을 유지하며, 1차 MVP에서는 "마스킹" 옵션을 적용하지 않고 미제공으로 통일합니다.

### 11-9. Timeout [확정 — 개발 리뷰 완료]

| 구분 | 기본값 |
|---|---|
| 전 Tool 공통(`get_orders`, `get_order_detail`, `get_order_summary`, `get_sales_summary`, `get_members`, `get_member_summary`, `get_products`, `get_product_sales`) | 10초 |

Timeout 발생 시 `UPSTREAM_TIMEOUT` Error를 반환합니다. 최초 제안은 일반 조회 Tool 10초/집계·분석형 Tool 15초로 구분했으나, 개발/보안 리뷰 결과 **MVP는 10초로 통일**하는 것으로 수정 확정되었습니다(09_Meeting/2026-09-22_개발-보안-리뷰요청.md D-6).

### 11-10. Retry [확정]

| 구분 | 내용 |
|---|---|
| 기본 원칙 | 모든 실패에 대해 재시도하지 않습니다 |
| 자동 Retry 허용 대상 | 일시적 네트워크 오류, 502, 503, 504, 내부 서비스 일시적 Timeout(`UPSTREAM_TIMEOUT`) |
| Retry 불가 대상 | 인증 실패, 권한 부족, Validation Error, 데이터 없음, 범위 초과, 잘못된 파라미터 |
| Retry 횟수 | 최대 1회 |
| 처리 위치 | 서버 내부에서 처리하며, 사용자에게 중복 결과가 발생하지 않도록 합니다 |

### 11-11. Rate Limit [확정 — 개발/보안 리뷰 완료]

MCP는 대량 데이터 추출 또는 반복 호출 용도로 사용하지 않습니다.

| 항목 | 내용 |
|---|---|
| 적용 단위(Rate Limit Key) | **상점 + AI Client 단위**로 적용합니다(`shop_id` + `client_id`) |
| 분당 요청 상한 | 60회 |
| 시간당 요청 상한 | 1,000회 |
| 집계 기준 | Tool 종류와 무관하게 `shop_id` + `client_id` 조합 단위로 합산합니다(1차 MVP 기준, Tool별 세분화는 하지 않음) |
| 초과 시 | 분당·시간당 상한 중 하나라도 초과하면 `RATE_LIMITED`를 반환하며, Response에 `retry_after`(재시도 가능 시점까지 남은 초)를 포함합니다 |

최초 제안은 상점 단위로 합산하는 방식이었으나, 개발/보안 리뷰 결과 **상점 + AI Client 단위**로 수정 확정되었습니다(09_Meeting/2026-09-22_개발-보안-리뷰요청.md SEC-8). 이렇게 하면 동일 입점사가 향후 ChatGPT와 다른 MCP Client를 동시에 사용하더라도, 한 Client의 호출이 다른 Client의 호출 한도를 소진하지 않습니다. 분당 60회/시간당 1,000회 수치 자체는 원안대로 승인되었습니다.

### 11-12. NO_DATA 처리 [확정]

조회 결과가 없는 경우(예: 주문 0건, 신규회원 0명, 상품 판매실적 없음) 시스템 오류로 처리하지 않고 정상 응답으로 처리합니다. 예를 들어 `items = []` 또는 `total_orders = 0`처럼 빈 값/0 값으로 반환합니다. 따라서 `NO_DATA`는 Error 코드로 사용하지 않으며, 정상 빈 응답으로 처리하는 것을 기본 원칙으로 합니다.

### 11-13. AI 분석 책임 범위 [확정]

메이크샵 MCP는 데이터와 명확한 집계 결과를 반환하는 역할을 담당하며, "매출 감소의 주요 원인은 신규회원 감소입니다" 같은 자연어 해석 문장을 MCP Server가 직접 생성하지 않습니다. 이런 해석은 ChatGPT 등 AI Client가 여러 Tool 결과를 조합해 수행합니다.

| 구분 | 책임 |
|---|---|
| 메이크샵 MCP | 정확한 데이터 조회, 집계, 기간 비교에 필요한 원천값 제공, 데이터 정의(§9) 일관성 유지 |
| AI Client | 자연어 질문 해석, 적절한 Tool 선택, 복수 Tool 조합, 비교, 원인 분석, 자연어 답변 생성 |

### 11-14. 데이터 정확성 및 Tool annotation 원칙

- 모든 Tool의 응답값은 메이크샵 API/DB 원본 값을 그대로 반영하며, AI가 추정·가공하기 쉬운 형태로 가공하지 않습니다(01_Requirements 비기능요구사항 — 데이터 정확성).
- 모든 Tool은 `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`로 annotation을 선언하는 것을 제안합니다. `openWorldHint`(서버가 메이크샵 외부의 개방된 데이터까지 조회하는지 여부)는 항상 `false`입니다(메이크샵 데이터로 한정).
- Scope 정의·Tool-Scope 매핑의 원본 기준은 05_Policy 인증·권한 정책이며, 본 문서는 그 기준을 Tool 스펙 형태로 구체화한 것입니다.

### 11-15. MCP Server 아키텍처 원칙 [확정 — 개발 리뷰 완료]

개발 리뷰(M-1~M-4)에서 확정된, Tool 구현의 전제가 되는 서버 아키텍처 원칙입니다.

| 항목 | 내용 |
|---|---|
| 서버 구성 | 별도 MCP Server를 구축합니다. AI Client(ChatGPT 등)는 메이크샵 내부 API를 직접 호출하지 않고, 반드시 MCP Server를 거칩니다: `AI Client → MCP Server → OAuth/Scope/상점 검증 → 메이크샵 내부 API → 데이터` |
| 기존 API 활용 | 기존 메이크샵 API를 우선 재사용합니다. Tool이 요구하는 형태(예: 집계값)를 기존 API가 제공하지 못하면 MCP 전용 Aggregation API를 신규로 추가합니다 |
| 상점 Context 결정 방식 | 상점 컨텍스트는 항상 **Token에 귀속된 `shop_id`**를 서버가 강제로 사용합니다. AI Client가 파라미터로 `shop_id`를 임의 지정하는 구조는 허용하지 않습니다 |
| Scope 검증 위치 | MCP Server가 Tool 실행 전에 1차로 Scope를 검증하고, 메이크샵 내부 API 호출 시점에 상점 접근 권한을 다시 검증하는 이중 검증 구조를 적용합니다 |

### 11-16. 로그 저장 [확정 — 개발 리뷰 완료]

Tool 호출 로그는 중앙 Audit Log 시스템에 저장합니다(M-5). Token 원문과 이름·전화번호 등 직접 식별 개인정보는 로그에 저장하지 않습니다. 로그 기록 항목 자체의 상세 기준은 05_Policy 로그·예외처리 정책을 따릅니다.

## 12. Open Issues

2026-09-22 개발/보안 리뷰 결과("전체 상태: 수정 후 승인") 반영. 남은 항목은 구현 세부사항 수준으로, 기획 차원에서 추가로 결정할 부분은 없습니다.

### 개발 검토 필요

| 번호 | 항목 | 확인 필요 대상 |
|---|---|---|
| 1 | Response 필드명(영문 snake_case 등)의 최종 확정 | 개발 |
| 2 | §9 매출 산식의 실제 구현 시 메이크샵 관리자 통계 화면과 수치가 정확히 일치하는지 구현 단계에서 최종 검증(산식 자체는 리뷰에서 승인됨) | 개발 |

다음 항목은 논의를 거쳐 [확정]되었으므로 더 이상 Open Issue가 아닙니다.

- ~~날짜 파라미터의 기준 Timezone~~ → 상점 설정 Timezone 우선, 기본값 `Asia/Seoul`로 확정(§11-1)
- ~~주문/매출 관련 Tool의 날짜 기준(주문일 vs 결제일)~~ → 주문 생성일(`order_created_at`) 기준으로 확정(§11-2)
- ~~`get_orders`와 `get_order_summary`의 책임 분리 기준~~ → 목록/조건 조회는 `get_orders`, 집계 조회는 `get_order_summary`로 확정(§9-1)
- ~~`get_products`와 `get_product_sales`의 책임 분리~~ → 마스터 정보는 `get_products`(`products.read`), 판매실적은 `get_product_sales`(`analytics.read`)로 확정(§9-2)
- ~~기본 조회 기간~~ → 집계형 Tool 4종은 미입력 시 최근 7일로 확정(§11-3)
- ~~최대 조회 기간~~ → 1회당 90일(초과 시 `DATE_RANGE_EXCEEDED`)로 확정(§11-3)
- ~~목록형 Tool의 기본/최대 limit~~ → 기본 50 / 최대 100(초과 시 자동 보정 없이 `LIMIT_EXCEEDED`)으로 확정(§11-4)
- ~~Pagination 방식~~ → Cursor 기반(`items`/`next_cursor`/`has_more`)으로 확정(§11-5)
- ~~Tool별 기본 정렬~~ → §11-6 표와 같이 확정
- ~~각 Tool의 Timeout 기준값~~ → 최초 일반 조회 10초/집계·분석형 15초로 제안했으나, 개발/보안 리뷰 결과 **전 Tool 10초로 통일**하는 것으로 수정 확정(§11-9)
- ~~Retry 기준~~ → 일시적 네트워크 오류·5xx·UPSTREAM_TIMEOUT만 서버 내부 최대 1회 자동 재시도, 그 외 재시도 안 함으로 확정(§11-10)
- ~~NO_DATA 처리 방식~~ → Error 코드로 사용하지 않고 정상 빈 응답으로 처리하는 것으로 확정(§11-12)
- ~~`get_order_summary`의 조건별(상태별) 집계 파라미터 부재~~ → `order_status` 필터를 추가해 상태별 주문 건수 집계를 직접 지원하는 것으로 확정(§3)
- ~~`get_products`의 재고 수량 임계값 필터 부재~~ → `min_stock`/`max_stock` 필터를 추가해 재고 수량 기반 조회를 지원하는 것으로 확정(§7)
- ~~`get_member_summary`의 등급 조건 필터 부재~~ → `member_grade` 필터를 추가해 기간+등급 조건 기반 회원 집계를 지원하는 것으로 확정(§6)
- ~~매출 산식(`gross_sales`/`net_sales` 등)~~ → 개발/보안 리뷰에서 §9와 같이 확정(구현 시 관리자 통계와 동일 산식 사용 전제)
- ~~배송비 포함 여부~~ → 상품 매출에 미포함, 별도 `shipping_amount` 필드로 반환하는 것으로 확정(§9)
- ~~포인트·적립금·예치금의 매출 반영 방식~~ → 결제수단으로 취급, `net_sales`에서 차감하지 않는 것으로 확정(§9)
- ~~부분취소·부분환불의 내부 집계 기준~~ → 실제 처리 완료된 금액만 차감으로 확정(§9)
- ~~취소/환불의 기간 반영 기준~~ → 조회 시점의 취소/환불 상태를 소급 반영하는 것으로 확정(§9)
- ~~Rate Limit 수치~~ → 분당 60회/시간당 1,000회는 원안대로 승인. 적용 단위는 상점 단위에서 **상점+Client(`shop_id`+`client_id`) 단위**로 수정 확정(§11-11)
- ~~기존 메이크샵 API가 Cursor Pagination을 지원하지 않는 경우의 내부 구현 방식~~ → 내부 구현이 Page 방식이어도 MCP 인터페이스는 반드시 Cursor로 확정(§11-5)
- ~~`member_id`(회원ID) keyword 검색 반환이 개인정보 최소화 원칙과 상충하지 않는지~~ → `member_id`는 불투명 내부 식별자이므로 상충하지 않는 것으로 확정(§5, 05_Policy 개인정보·보안 정책 3-3)
- ~~MCP Server를 신규로 자체 구축할지, 기존 메이크샵 Open API를 MCP 프로토콜로 래핑하는 형태로 할지~~ → 별도 MCP Server를 신규 구축하는 것으로 확정. 기존 API는 우선 재사용하되 부족한 경우 MCP 전용 Aggregation API를 추가(§11-15)
- ~~상점 Context를 Tool 파라미터로 받을지, Token 기준으로 강제할지~~ → Token에 귀속된 `shop_id`를 서버가 강제 사용, Client가 임의 지정하는 구조는 허용하지 않는 것으로 확정(§11-15)
- ~~Tool별 Scope 검증 위치~~ → MCP Server(Tool 실행 전)와 메이크샵 내부 API 양쪽에서 이중 검증하는 것으로 확정(§11-15)
- ~~호출 로그 저장 위치~~ → 중앙 Audit Log 시스템에 저장, Token 원문·직접식별 개인정보는 미저장으로 확정(§11-16)
