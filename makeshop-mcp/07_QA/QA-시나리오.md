# MakeShop MCP — QA 시나리오

01_Requirements/AI-Tool-매핑-시나리오.md(자연어→Tool 매핑 30건)와 05_Policy·06_Data-API의 확정 정책을 기반으로 작성했습니다. 17개 영역(인증/연결, 상점 단위 연결, Scope 권한, 단일 Tool 호출, 조건 조회, 기간 비교, 복합 Tool 호출, 데이터 정합성, NO_DATA, Validation Error, 기간 초과, Token 만료, 권한 부족, Timeout/Retry, 개인정보 제한, 연결 해제/revoke, Rate Limit)로 구성했으며, `구분` 열은 정상/예외/Boundary/Permission/Regression 5개 유형을 사용합니다.

## 1. 인증/연결

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-AUTH-001 | 정상 | 미연결 상태, 유효한 메이크샵 관리자 계정 보유 | ChatGPT에서 MakeShop MCP 연결 시작 → 메이크샵 로그인 → 상점 선택 → Scope 동의 → 완료 | Authorization Code·Access Token·Refresh Token이 발급되고 AI 서비스로 정상 복귀한다. MCP 전용 별도 계정/비밀번호 입력 단계는 없다 | 해당 없음(연결 절차) | — |
| QA-AUTH-002 | 예외 | 미연결 상태 | 메이크샵 로그인 단계에서 잘못된 비밀번호 입력 | 인증 실패로 연결이 진행되지 않고, AI 서비스로 복귀해 재시도를 안내한다 | 해당 없음 | — |
| QA-AUTH-003 | Regression | 같은 브라우저에서 메이크샵 관리자 화면에 이미 로그인된 세션이 유효한 상태 | 해당 세션 상태로 MCP 연결 시작 | 로그인 단계는 기존 세션을 재사용할 수 있으나, Scope 동의 단계는 생략되지 않고 항상 별도로 노출된다(기존 메이크샵 로그인 기능 자체에는 영향 없음) | 해당 없음 | — |

## 2. 상점 단위 연결

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-SHOP-001 | 정상 | 계정이 상점 A, B 2개를 관리 | 연결 시 상점 A 선택 | 연결이 상점 A에만 귀속되며, 이후 모든 조회는 상점 A 데이터로 제한된다 | `get_orders` 등 전체 | 전체 |
| QA-SHOP-002 | 정상 | 계정이 상점 1개만 관리 | MCP 연결 시도 | 상점 선택 단계가 생략되고 해당 상점이 자동 지정된다 | 해당 없음 | — |
| QA-SHOP-003 | Boundary | 상점 A 연결이 이미 완료된 상태에서 상점 B 데이터가 필요 | 기존 연결 내에서 상점을 B로 전환할 수 있는지 확인 | 상점 전환 기능은 존재하지 않으며, 상점 B에 대한 **별도 연결**을 새로 생성해야 한다 | 해당 없음 | — |
| QA-SHOP-004 | 예외 | 상점 A 연결의 Token 보유 | 해당 Token으로 상점 B의 데이터를 조회하도록 요청을 조작 | `SHOP_NOT_FOUND` 반환. Token에 귀속된 상점(A)과 요청 상점(B)이 일치하지 않으면 항상 이 오류를 반환한다 | `get_orders` 등 임의 Tool | 임의 |

## 3. Scope 권한

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-SCOPE-001 | 정상 | 연결 시 4개 Scope 모두 동의 | 8개 Tool을 각각 호출 | 8개 Tool 모두 정상 응답한다 | 전체 8종 | `orders.read`/`products.read`/`members.read`/`analytics.read` |
| QA-SCOPE-002 | Permission | `orders.read`만 동의, 나머지 미동의 | `get_products` 호출 | `INVALID_SCOPE` 반환 | `get_products` | `products.read`(미동의) |
| QA-SCOPE-003 | Permission | `products.read`만 동의, `analytics.read` 미동의 | "이번 달 가장 잘 팔리는 상품 알려줘" → `get_product_sales` 호출 | `INVALID_SCOPE` 반환. 상품 관련 질문이라 `products.read`로 충분하다고 오인하기 쉬운 케이스이므로 반드시 검증 | `get_product_sales` | `analytics.read`(미동의) |
| QA-SCOPE-004 | Regression | 4개 Scope 중 `members.read`만 철회 | 철회 직후 `get_orders` 호출 | `members.read` 철회가 `orders.read` 계열 Tool에는 영향을 주지 않고 정상 응답한다 | `get_orders` | `orders.read`(정상) |

## 4. 단일 Tool 호출

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-SINGLE-001 | 정상 | `orders.read` 동의 | "오늘 주문 알려줘" | 오늘 생성된(`order_created_at` 기준) 주문 목록을 기본 정렬·기본 limit(50)으로 반환 | `get_orders` | `orders.read` |
| QA-SINGLE-002 | 정상 | `orders.read` 동의, 유효한 `order_id` 존재 | "주문번호 OOO 상세 내역 보여줘" | 주문 상세(주문 상품 목록 포함) 반환 | `get_order_detail` | `orders.read` |
| QA-SINGLE-003 | 정상 | `orders.read` 동의 | "이번 주 주문 몇 건이야?" | 집계값(`total_order_count` 등) 반환 | `get_order_summary` | `orders.read` |
| QA-SINGLE-004 | 정상 | `analytics.read` 동의 | "오늘 매출 얼마야?" | `net_sales` 기준 매출 반환 | `get_sales_summary` | `analytics.read` |
| QA-SINGLE-005 | 정상 | `members.read` 동의 | "이번 달 가입한 신규 회원 목록 보여줘" | 이름·연락처 없이 `member_id`/`member_grade`/`joined_at`/`join_channel`만 포함된 목록 반환 | `get_members` | `members.read` |
| QA-SINGLE-006 | 정상 | `members.read` 동의 | "이번 주 신규 회원 몇 명이야?" | `new_member_count` 반환 | `get_member_summary` | `members.read` |
| QA-SINGLE-007 | 정상 | `products.read` 동의 | "품절 상품 알려줘" | 상품 마스터 정보만 반환(판매수량·매출 미포함) | `get_products` | `products.read` |
| QA-SINGLE-008 | 정상 | `analytics.read` 동의 | "이번 달 가장 많이 팔린 상품 알려줘" | 판매수량 기준 상위 상품 목록 반환 | `get_product_sales` | `analytics.read` |

## 5. 조건 조회

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-COND-001 | 정상 | `orders.read` 동의 | "이번 주 네이버페이 주문만 알려줘" (`payment_method`=네이버페이) | 조건에 맞는 주문만 반환 | `get_orders` | `orders.read` |
| QA-COND-002 | 예외 | `orders.read` 동의 | "10만원 이상 주문 조회해줘" — `start_date`/`end_date` 없이 `min_order_amount`만 지정해 호출 | `get_orders`는 기간이 필수값이므로 `INVALID_PARAMETER` 반환. AI는 기간을 함께 요청해야 함 | `get_orders` | `orders.read` |
| QA-COND-003 | 정상 | `products.read` 동의 | "재고가 10개 이하인 상품 알려줘" (`max_stock`=10) | 재고 수량 10개 이하 상품만 반환 | `get_products` | `products.read` |
| QA-COND-004 | 정상 | `members.read` 동의 | "VIP 등급 회원 중 이번 달 가입한 사람 몇 명이야?" (`member_grade`=VIP) | 기간+등급 조건에 맞는 `total_member_count` 반환 | `get_member_summary` | `members.read` |
| QA-COND-005 | 정상 | `orders.read` 동의 | "배송 준비중인 주문 몇 건이야?" (`order_status`=배송준비중) | 해당 상태의 주문 건수만 집계해 반환 | `get_order_summary` | `orders.read` |

## 6. 기간 비교

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-COMPARE-001 | 정상 | `analytics.read` 동의 | "이번 주 매출 지난주랑 비교해줘" | `get_sales_summary`를 이번 주/지난주 각각 호출해 두 기간의 `net_sales` 등 원천값을 반환. 증감률 계산은 AI Client 책임 | `get_sales_summary` ×2 | `analytics.read` |
| QA-COMPARE-002 | 정상 | `orders.read` 동의 | "지난달 대비 이번 달 주문 건수 얼마나 늘었어?" | `get_order_summary`를 이번 달/지난달 각각 호출. 두 기간 모두 최대 조회 기간(90일) 이내인지 확인 | `get_order_summary` ×2 | `orders.read` |

## 7. 복합 Tool 호출

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-COMBO-001 | 정상 | `orders.read`/`members.read`/`analytics.read` 모두 동의 | "이번 주 매출 왜 줄었어?" | `get_sales_summary`/`get_order_summary`/`get_product_sales`/`get_member_summary`를 이번 주·지난주 각각 호출(총 8회). MCP는 원천값만 반환하고, "왜 줄었는지" 해석 문장은 생성하지 않는다 | `get_sales_summary`, `get_order_summary`, `get_product_sales`, `get_member_summary` | `analytics.read`, `orders.read`, `members.read` |
| QA-COMBO-002 | 정상 | 위와 동일 | "이번 주 쇼핑몰 상황 전체적으로 정리해줘" | 4개 Tool을 각 1회 호출해 결과를 모두 정상 수신 | `get_sales_summary`, `get_order_summary`, `get_member_summary`, `get_product_sales` | `analytics.read`, `orders.read`, `members.read` |
| QA-COMBO-003 | 정상 | `analytics.read` 동의 | "최근 판매가 급증하고 있는 상품 찾아줘" | `get_product_sales`를 이번 주/지난주 각각 호출해 비교 가능한 원천값 반환 | `get_product_sales` ×2 | `analytics.read` |

## 8. 데이터 정합성

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-DATA-001 | 정상 | `analytics.read` 동의, 동일 기간에 취소/환불/할인이 존재 | `get_sales_summary` 호출 | `gross_sales`/`discount_amount`/`canceled_amount`/`refunded_amount`/`net_sales` 필드가 모두 존재하며, `net_sales`가 정의(결제완료금액 - 취소/환불 반영 금액)에 부합하는지 확인 | `get_sales_summary` | `analytics.read` |
| QA-DATA-002 | Regression | `orders.read` 동의, 동일 기간 데이터 | 같은 기간에 대해 `get_orders`를 페이지네이션 끝까지 순회한 총 건수와 `get_order_summary`의 `total_order_count`를 비교 | 두 값이 일치한다(같은 원본 데이터를 다른 방식으로 집계했을 뿐 결과가 달라지지 않아야 함) | `get_orders`, `get_order_summary` | `orders.read` |
| QA-DATA-003 | 정상 | `analytics.read` 동의 | `get_product_sales` 호출 | `sales_amount` 필드가 §9 `net_sales` 정의를 따르는지 확인(임의로 다른 산식을 쓰지 않음) | `get_product_sales` | `analytics.read` |

## 9. NO_DATA

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-NODATA-001 | 정상 | `members.read` 동의, 신규 가입 0명인 날짜 | "어제 신규 가입한 회원 있어?" | `new_member_count=0`으로 정상 응답(Error 아님) | `get_member_summary` | `members.read` |
| QA-NODATA-002 | 정상 | `analytics.read` 동의, 특정 상품 이번 주 판매 0건 | "이 상품 이번 주에 팔렸어?" | 해당 상품이 `items`에 없거나 수량 0으로 반환(Error 아님) | `get_product_sales` | `analytics.read` |
| QA-NODATA-003 | 정상 | `orders.read` 동의, 취소 주문 0건인 날짜 | "오늘 취소된 주문 있어?" | `items=[]` 반환(Error 아님) | `get_orders` | `orders.read` |

## 10. Validation Error

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-VALID-001 | 예외 | `analytics.read` 동의 | `get_sales_summary(start_date=2026-09-22, end_date=2026-09-01)` 호출(기간 역전) | `DATE_RANGE_INVALID` 반환 | `get_sales_summary` | `analytics.read` |
| QA-VALID-002 | 예외 | `orders.read` 동의 | `get_order_detail`을 `order_id` 없이 호출 | `INVALID_PARAMETER` 반환 | `get_order_detail` | `orders.read` |
| QA-VALID-003 | Boundary | `orders.read` 동의 | `get_orders(limit=100)` 호출(최대값과 동일) | 정상 처리되어 최대 100건 반환 | `get_orders` | `orders.read` |
| QA-VALID-004 | Boundary | `orders.read` 동의 | `get_orders(limit=101)` 호출(최대값 초과) | 자동 보정 없이 `LIMIT_EXCEEDED` 반환 | `get_orders` | `orders.read` |
| QA-VALID-005 | 예외 | `products.read` 동의 | `get_products(min_stock=50, max_stock=10)` 호출(하한이 상한보다 큼) | `INVALID_PARAMETER` 반환 | `get_products` | `products.read` |

## 11. 기간 초과

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-RANGE-001 | Boundary | `analytics.read` 동의 | 정확히 90일 기간으로 `get_sales_summary` 호출 | 정상 처리(최대 조회 기간과 동일 — 경계값 허용) | `get_sales_summary` | `analytics.read` |
| QA-RANGE-002 | Boundary | `analytics.read` 동의 | 91일 기간으로 `get_sales_summary` 호출 | `DATE_RANGE_EXCEEDED` 반환(경계값 초과) | `get_sales_summary` | `analytics.read` |
| QA-RANGE-003 | 예외 | `analytics.read` 동의 | "작년 한 해 매출 추이를 전부 보여줘" (365일) | 자동 분할 조회 없이 `DATE_RANGE_EXCEEDED` 반환. AI는 90일 단위로 나누어 여러 번 조회하도록 안내 | `get_sales_summary` | `analytics.read` |

## 12. Token 만료

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-TOKEN-001 | 예외 | Access Token 만료, Refresh Token 유효 | Tool 호출 | `TOKEN_EXPIRED` 반환 후 Refresh Token으로 갱신되어 재호출 시 정상 처리되는지 확인 | 임의 Tool | 임의 |
| QA-TOKEN-002 | 예외 | Access Token, Refresh Token 모두 만료 | Tool 호출 | 갱신 불가로 재인증(재로그인)이 필요하다는 안내 반환 | 임의 Tool | 임의 |
| QA-TOKEN-003 | Boundary | Access Token 만료 수 초 전 | Tool 호출 | 만료 직전이라도 유효기간 내이므로 정상 처리 | 임의 Tool | 임의 |

## 13. 권한 부족

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-PERM-001 | Permission | 미인증 상태(Token 없음) | 임의 Tool 호출 | `AUTH_REQUIRED` 반환. 인증 확인이 Scope 확인보다 항상 먼저 수행되는지 확인(05_Policy 인증·권한 정책 §4 우선순위) | 임의 Tool | — |
| QA-PERM-002 | Permission | 인증은 유효하나 Token에 귀속된 상점 정보가 없는 비정상 상태 | 임의 Tool 호출 | `SHOP_NOT_FOUND`가 `INVALID_SCOPE`보다 먼저 반환되는지 확인 | 임의 Tool | 임의 |
| QA-PERM-003 | Permission | `members.read` 미동의 | "이번 주 신규 회원 몇 명이야?" | `INVALID_SCOPE` 반환과 함께 "회원 정보를 조회할 수 있는 권한이 연결되어 있지 않습니다" 형태의 안내 문구 노출 | `get_member_summary` | `members.read`(미동의) |
| QA-PERM-004 | Permission | 부운영자(직원) 계정으로 로그인 | 해당 계정으로 MCP 연결 시도 | 연결이 진행되지 않고 "MCP 연결은 대표 관리자 계정만 가능합니다" 형태의 안내 반환(05_Policy 인증·권한 정책 3-10) | 해당 없음(연결 절차) | — |

## 14. Timeout / Retry

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-TIMEOUT-001 | Boundary | 일반 조회 Tool(`get_orders` 등) | 응답 지연을 10초 초과로 강제 발생 | `UPSTREAM_TIMEOUT` 반환. 10초 이내 응답 시에는 정상 처리 | `get_orders` | `orders.read` |
| QA-TIMEOUT-002 | Boundary | 집계/분석형 Tool(`get_sales_summary` 등) | 응답 지연을 10초 초과로 강제 발생 | `UPSTREAM_TIMEOUT` 반환. 10초 이내 응답 시에는 정상 처리(개발/보안 리뷰 결과 MVP 전 Tool 10초로 통일, 06_Data-API §11-9) | `get_sales_summary` | `analytics.read` |
| QA-TIMEOUT-003 | 정상 | 일시적 502 오류를 1회 발생하도록 강제 | Tool 호출 | 서버 내부에서 최대 1회 자동 재시도 후 성공하며, 사용자·AI에게 중복 결과가 노출되지 않음 | 임의 Tool | 임의 |
| QA-TIMEOUT-004 | 예외 | `DATE_RANGE_INVALID` 등 Validation 오류 발생 조건 | Tool 호출 | 재시도 대상이 아니므로 자동 재시도 없이 즉시 오류 반환 | 임의 Tool | 임의 |

## 15. 개인정보 제한

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-PII-001 | Permission | `members.read` 동의 | "이번 주 가입한 회원 이름이랑 전화번호 알려줘" | `get_members` 응답 자체에 이름·전화번호·이메일·주소·계좌정보·인증정보 필드가 전혀 포함되지 않음. AI는 제공 불가를 안내 | `get_members` | `members.read` |
| QA-PII-002 | Permission | `orders.read` 동의 | "이 주문 고객 연락처 알려줘" | `get_order_detail` 응답에 주문자 연락처 등 민감정보가 포함되지 않음 | `get_order_detail` | `orders.read` |
| QA-PII-003 | Regression | Tool 응답 필드가 신규 추가/변경된 배포 | 배포 전 응답 필드 검수 | 개인정보 필드가 실수로 응답에 섞여 들어가지 않았는지 확인(05_Policy 개인정보·보안 정책 §6 검수 절차) | 전체 | 전체 |

## 16. 연결 해제 / revoke

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-REVOKE-001 | 정상 | 상점 A 연결이 활성 상태 | 상점 A 연결 해제 | 해당 연결의 Access Token·Refresh Token이 revoke되고, 이후 해당 Token으로 호출하면 `TOKEN_REVOKED` 반환 | 임의 Tool | 임의 |
| QA-REVOKE-002 | Regression | 상점 A, B 모두 연결된 상태 | 상점 A 연결만 해제 | 상점 B 연결의 Token은 영향받지 않고 계속 정상 동작 | 임의 Tool | 임의 |
| QA-REVOKE-003 | 예외 | 이미 revoke된 Token 보유 | 해당 Token으로 재요청 | 재연결 전까지 계속 `TOKEN_REVOKED` 반환(복구되지 않음) | 임의 Tool | 임의 |
| QA-REVOKE-004 | 정상 | 상점 A에 연결된 대표 관리자가 대표 관리자 권한을 상실(예: 권한 이양) | 이후 해당 연결로 Tool 호출 | Token이 즉시 revoke되어 `TOKEN_REVOKED` 반환(05_Policy 인증·권한 정책 3-8) | 임의 Tool | 임의 |
| QA-REVOKE-005 | 정상 | 연결된 계정이 이용정지/탈퇴 처리됨 | 이후 해당 연결로 Tool 호출 | Token이 즉시 revoke되어 `TOKEN_REVOKED` 반환 | 임의 Tool | 임의 |
| QA-REVOKE-006 | 정상 | 보안 관리자가 특정 연결을 강제 해제 | 이후 해당 연결로 Tool 호출 | Token이 즉시 revoke되어 `TOKEN_REVOKED` 반환 | 임의 Tool | 임의 |

## 17. Rate Limit

| QA ID | 구분 | 사전조건 | 테스트 시나리오 | 기대 결과 | 관련 Tool | 관련 Scope |
|---|---|---|---|---|---|---|
| QA-RATE-001 | Boundary | 상점 A + ChatGPT 연결에서 1분 내 60회 호출 | 61번째 호출 | `RATE_LIMITED` 반환, `retry_after` 포함(06_Data-API §11-11) | 임의 Tool | 임의 |
| QA-RATE-002 | Regression | 같은 상점 A를 ChatGPT와 다른 MCP Client 양쪽에서 연결(서로 다른 `client_id`) | ChatGPT 쪽에서 Rate Limit 초과 발생 | 다른 Client(`client_id` 다름)의 호출 한도에는 영향을 주지 않고 정상 처리(Rate Limit Key = `shop_id`+`client_id`) | 임의 Tool | 임의 |

## 2026-09-22 개발/보안 리뷰 반영

개발/보안 리뷰 결과("전체 상태: 수정 후 승인")에 따라 아래를 갱신했습니다.

- QA-TIMEOUT-002: 집계형 Tool 기준을 15초 → **10초**로 수정(전 Tool 통일)
- QA-PERM-004(신규): 부운영자 연결 거부 케이스 추가
- QA-REVOKE-004~006(신규): 대표관리자 권한상실/계정정지·탈퇴/보안관리자 강제해제 트리거 케이스 추가
- §17 Rate Limit(신규 섹션): `shop_id`+`client_id` 기준 Rate Limit 케이스 2건 추가

남은 미결정 항목(로그 보관기간, Scope 변경 시 Token 재발급 여부, 복수 대표관리자 연결 관리 방식 등)은 값이 확정되면 관련 QA를 추가로 보강합니다.
