# MakeShop MCP — 자연어 → Tool 매핑 시나리오 (Task 5)

> 08_Jira Task 5("자연어 질의 및 Tool 조합 시나리오 정의")의 산출물입니다. 사용된 Tool 이름·파라미터·Scope·Error 코드는 06_Data-API/MCP-Tools-Definition.md의 확정 스펙을 기준으로 합니다. "오늘/이번 주/이번 달" 등 자연어 기간은 06_Data-API §11-1에 따라 상점 설정 Timezone(기본 `Asia/Seoul`) 기준으로 해석합니다.
>
> 총 30건: 단일 조회 8 / 조건 조회 5 / 기간 비교 2 / 복합 분석 3 / 권한 부족 3 / 데이터 없음 3 / 잘못된 요청 2 / 기간 초과 2 / 개인정보 요청 2

## 1. 단일 조회 (8건)

Tool 1개를 그대로 호출해 답할 수 있는 가장 기본적인 질문입니다. 8개 Tool 각각에 대해 1건씩 구성했습니다.

| 번호 | 사용자 질문 | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 1 | "오늘 주문 알려줘" | `get_orders` | `start_date`=오늘, `end_date`=오늘 | `orders.read` | 오늘 생성된(`order_created_at` 기준) 주문을 기본 정렬(`order_created_at DESC`)·기본 limit(50)로 반환. 없으면 `items=[]`(정상 응답, §6 참고) |
| 2 | "주문번호 20260922-0001 상세 내역 보여줘" | `get_order_detail` | `order_id` | `orders.read` | 해당 상점 소속 주문이면 상세 반환. 존재하지 않으면 `RESOURCE_NOT_FOUND` |
| 3 | "이번 주 주문 몇 건이야?" | `get_order_summary` | `start_date`=이번 주 시작일, `end_date`=오늘 | `orders.read` | 집계값(`total_order_count` 등) 반환. 0건이어도 정상 응답 |
| 4 | "오늘 매출 얼마야?" | `get_sales_summary` | `start_date`=오늘, `end_date`=오늘 | `analytics.read` | "매출"은 `net_sales` 기준으로 응답(06_Data-API §9) |
| 5 | "이번 달 가입한 신규 회원 목록 보여줘" | `get_members` | `join_start_date`=이번 달 1일, `join_end_date`=오늘 | `members.read` | 이름·연락처 없이 `member_id`/`member_grade`/`joined_at`/`join_channel`만 포함된 목록 반환. 0명이면 `items=[]` |
| 6 | "이번 주 신규 회원 몇 명이야?" | `get_member_summary` | `start_date`=이번 주 시작일, `end_date`=오늘 | `members.read` | `new_member_count` 반환 |
| 7 | "품절 상품 알려줘" | `get_products` | `stock_status`=품절 | `products.read` | 상품 마스터 정보만 반환(판매수량·매출 미포함). 없으면 `items=[]` |
| 8 | "이번 달 가장 많이 팔린 상품 알려줘" | `get_product_sales` | `start_date`=이번 달 1일, `end_date`=오늘, `sort_by`=판매수량, `limit`=10 | `analytics.read` | 판매수량 기준 상위 10개 반환. `sales_amount`는 §9 `net_sales` 정의를 따름 |

## 2. 조건 조회 (5건)

특정 조건으로 좁힌 목록/조회입니다.

| 번호 | 사용자 질문 | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 9 | "이번 주 네이버페이 주문만 알려줘" | `get_orders` | `start_date`/`end_date`=이번 주, `payment_method`=네이버페이 | `orders.read` | 조건에 맞는 주문 목록만 반환 |
| 10 | "10만원 이상 주문 조회해줘" | `get_orders` | `min_order_amount`=100000, `start_date`/`end_date`(AI가 사용자에게 기간을 확인하거나 합리적 기본 기간을 명시적으로 안내해야 함 — `get_orders`는 기간이 선택값이 아닌 필수값이므로 임의 전체기간 조회 금지) | `orders.read` | 기간 없이 호출되면 `INVALID_PARAMETER`(필수값 누락). AI는 기간을 반드시 함께 요청해야 함 |
| 11 | "배송 준비중인 주문 몇 건이야?" | `get_order_summary` | `order_status`=배송준비중, `start_date`/`end_date`=이번 주 | `orders.read` | `order_status` 필터로 해당 상태의 주문 건수만 집계해 반환(06_Data-API §3, 2026-09-22 확정) |
| 12 | "니트 카테고리 상품 중 재고가 10개 이하인 상품 알려줘" | `get_products` | `keyword`="니트" 또는 `category_id`, `max_stock`=10 | `products.read` | `max_stock` 필터로 재고 수량 임계값 기준 조회(06_Data-API §7, 2026-09-22 확정) |
| 13 | "VIP 등급 회원 중 이번 달 가입한 사람 몇 명이야?" | `get_member_summary` | `member_grade`=VIP, `start_date`=이번 달 1일, `end_date`=오늘 | `members.read` | `member_grade` 필터로 기간+등급 조건의 정확한 집계값(`total_member_count`) 반환(06_Data-API §6, 2026-09-22 확정) |

## 3. 기간 비교 (2건)

동일 Tool을 서로 다른 기간으로 두 번 호출해 비교합니다.

| 번호 | 사용자 질문 | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 14 | "이번 주 매출 지난주랑 비교해줘" | `get_sales_summary` × 2 | 이번 주 `start_date`/`end_date`, 지난주 `start_date`/`end_date` | `analytics.read` | 두 기간의 `net_sales`를 각각 조회한 원천값만 반환. 증감률 계산·원인 설명은 AI Client 책임(06_Data-API §11-13) |
| 15 | "지난달 대비 이번 달 주문 건수 얼마나 늘었어?" | `get_order_summary` × 2 | 이번 달 `start_date`/`end_date`, 지난달 `start_date`/`end_date` | `orders.read` | 두 기간 모두 최대 조회 기간(90일) 이내인지 확인. 두 집계값을 각각 반환 |

## 4. 복합 분석 (3건)

서로 다른 여러 Tool을 조합합니다. 아래 질문은 3개 Scope(`orders.read`/`members.read`/`analytics.read`)가 모두 동의되어 있어야 완전히 답할 수 있습니다.

| 번호 | 사용자 질문 | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 16 | "이번 주 매출 왜 줄었어?" | `get_sales_summary`×2, `get_order_summary`×2, `get_product_sales`×2, `get_member_summary`×2 (이번 주/지난주 각각) | 각 Tool별 이번 주/지난주 `start_date`/`end_date` | `analytics.read`, `orders.read`, `members.read` | 8회의 Tool 호출로 원천값만 수집. "원인"에 대한 해석 문장은 MCP가 생성하지 않고 AI Client가 조합해 답변(06_Data-API §11-13) |
| 17 | "이번 주 쇼핑몰 상황 전체적으로 정리해줘" | `get_sales_summary`, `get_order_summary`, `get_member_summary`, `get_product_sales`(상위 N) | 공통 `start_date`/`end_date`=이번 주 | `analytics.read`, `orders.read`, `members.read` | 4개 Tool 결과를 모두 정상 수신하면 AI가 리포트 형태로 요약. 일부 Scope가 없으면 §5의 권한 부족 처리를 따름 |
| 18 | "최근 판매가 급증하고 있는 상품 찾아줘" | `get_product_sales` × 2(이번 주/지난주) | `start_date`/`end_date`, `sort_by`=판매수량 | `analytics.read` | 두 기간의 상품별 판매수량을 비교할 수 있는 원천값만 제공. "급증" 판단·순위화는 AI Client 책임 |

## 5. 권한 부족 (3건)

사용자가 해당 Scope에 동의하지 않았거나 연결이 무효화된 상태에서 Tool을 호출하려는 경우입니다.

| 번호 | 사용자 질문 | 선택 Tool(시도) | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 19 | (members.read 미동의 상태) "이번 주 신규 회원 몇 명이야?" | `get_member_summary` | `start_date`/`end_date` | `members.read`(미동의) | `INVALID_SCOPE` 반환. AI는 "회원 정보를 조회할 수 있는 권한이 연결되어 있지 않습니다" 등 안내(05_Policy 로그·예외처리 정책 3-3) |
| 20 | (analytics.read 미동의 상태) "이번 달 가장 잘 팔리는 상품 알려줘" | `get_product_sales` | `start_date`/`end_date` | `analytics.read`(미동의) | 상품 관련 질문이라 `products.read`만 동의했다고 착각하기 쉬운 케이스. `get_product_sales`는 `analytics.read` 소속이므로 `products.read`만 동의된 상태에서는 `INVALID_SCOPE` 반환 |
| 21 | (연결 해제/Token revoke 이후) "오늘 주문 알려줘" | `get_orders` | `start_date`/`end_date` | `orders.read`(Token 무효) | `TOKEN_REVOKED` 반환. AI는 재연결이 필요하다고 안내(05_Policy 인증·권한 정책 3-8) |

## 6. 데이터 없음 (3건)

조회 결과가 0건/0명인 경우로, 시스템 오류가 아닌 정상 응답으로 처리되는지 확인하는 케이스입니다.

| 번호 | 사용자 질문 | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 22 | "어제 신규 가입한 회원 있어?" (신규 가입 0명인 날) | `get_member_summary` | `start_date`=어제, `end_date`=어제 | `members.read` | `new_member_count=0`으로 정상 응답(06_Data-API §11-12). Error가 아님 |
| 23 | "이 상품 이번 주에 팔렸어?" (해당 상품 이번 주 판매 0건) | `get_product_sales` | `start_date`/`end_date`=이번 주 | `analytics.read` | 해당 상품이 `items`에 없거나 수량 0으로 반환. AI는 "이번 주 판매 실적이 없습니다"로 안내(Error 아님) |
| 24 | "오늘 취소된 주문 있어?" (취소 0건) | `get_orders` | `order_status`=취소, `start_date`/`end_date`=오늘 | `orders.read` | `items=[]` 반환. AI는 "오늘 취소된 주문은 없습니다"로 안내 |

## 7. 잘못된 요청 (2건)

파라미터 형식·조합 자체가 잘못된 경우입니다.

| 번호 | 사용자 질문(또는 AI의 잘못된 Tool 호출) | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 25 | (AI가 기간을 잘못 계산해 호출) `get_sales_summary(start_date=2026-09-22, end_date=2026-09-01)` | `get_sales_summary` | `start_date` > `end_date` | `analytics.read` | `DATE_RANGE_INVALID` 반환(06_Data-API §11-2) |
| 26 | "주문 500건 한 번에 다 보여줘" | `get_orders` | `limit`=500 | `orders.read` | 100 초과 요청은 자동 보정하지 않고 `LIMIT_EXCEEDED` 반환(06_Data-API §11-4). AI는 페이지네이션(`cursor`)으로 나눠 조회하도록 안내 |

## 8. 기간 초과 (2건)

집계형 Tool의 최대 조회 기간(90일)을 초과하는 경우입니다.

| 번호 | 사용자 질문 | 선택 Tool | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 27 | "작년 한 해 매출 추이를 전부 보여줘" | `get_sales_summary` | `start_date`=작년 1/1, `end_date`=작년 12/31(365일) | `analytics.read` | 최대 90일을 초과하므로 자동 분할 조회 없이 `DATE_RANGE_EXCEEDED` 반환. AI는 90일 이내로 나누어 여러 번 조회하도록 안내(06_Data-API §11-3) |
| 28 | "최근 6개월 주문 건수 알려줘" | `get_order_summary` | `start_date`/`end_date`(약 180일) | `orders.read` | 위와 동일하게 `DATE_RANGE_EXCEEDED` 반환 |

## 9. 개인정보 요청 (2건)

Tool 응답에 애초에 포함되지 않는 개인정보를 요청하는 경우입니다.

| 번호 | 사용자 질문 | 선택 Tool(시도) | 주요 파라미터 | 필요 Scope | 기대 처리 기준 |
|---|---|---|---|---|---|
| 29 | "이번 주 가입한 회원 이름이랑 전화번호 알려줘" | `get_members` | `join_start_date`/`join_end_date`=이번 주 | `members.read` | `get_members` 응답 자체에 이름·전화번호 필드가 없으므로(05_Policy 개인정보·보안 정책 3-3) 정상 호출되더라도 해당 정보를 반환할 수 없음. AI는 "개인 식별 정보는 제공되지 않으며, 신규 회원 수/등급 등 통계만 확인 가능합니다"로 안내 |
| 30 | "VIP 회원 이메일 목록 뽑아서 정리해줘" | `get_members` | `member_grade`=VIP | `members.read` | 위와 동일하게 이메일 필드가 없어 제공 불가. AI는 등급별 인원수(`member_grade` 조건 목록의 건수)까지만 안내 가능함을 설명 |

## 10. 이 문서 작성 중 확인된 Open Issue → 확정 반영 완료

시나리오를 실제 Tool 스펙에 대입하는 과정에서 아래 3건의 스펙 공백이 확인되었으며, 2026-09-22 결정에 따라 06_Data-API/MCP-Tools-Definition.md에 확정 스펙으로 반영되었습니다(§9, §12).

- ~~`get_order_summary`가 `order_status` 등 조건별 집계를 지원하지 않음~~ → `order_status` 필터 추가로 확정 (#11)
- ~~`get_products`가 재고 수량 임계값 필터를 지원하지 않음~~ → `min_stock`/`max_stock` 필터 추가로 확정 (#12)
- ~~`get_member_summary`가 등급 조건 필터를 지원하지 않음~~ → `member_grade` 필터 추가로 확정 (#13)
