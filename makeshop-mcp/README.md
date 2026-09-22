# 메이크샵 MCP Server

## 배경

현재 메이크샵 쇼핑몰 운영자는 주문·회원·상품·매출 데이터를 확인하려면 반드시 메이크샵 관리자 화면에 직접 접속해 해당 메뉴를 찾아 들어가야 합니다. ChatGPT, Claude 같은 AI 서비스에게 자연어로 "이번 주 신규 회원 몇 명이야?"라고 물어도, AI가 메이크샵 데이터에 접근할 수 있는 표준화된 인터페이스가 없어 답변할 수 없습니다.

Meta는 이미 광고 데이터를 MCP(Model Context Protocol)로 노출하여 AI가 광고 계정 데이터를 자연어로 조회·분석할 수 있게 하는 구조를 제공하고 있으며[가정 — Meta MCP 실제 공개 여부/범위는 별도 확인 필요], 메이크샵도 동일한 개념을 커머스 도메인에 적용할 수 있다는 아이디어에서 본 프로젝트가 출발했습니다.

## 목적

"MakeShop을 AI가 사용할 수 있는 Commerce Platform으로 만드는 것"을 목표로, 메이크샵이 자체 MCP Server를 제공하고 주문/회원/상품/통계 API를 Tool로 노출하여, ChatGPT·Claude 같은 MCP Client에서 자연어만으로 쇼핑몰 데이터를 조회·분석할 수 있도록 합니다.

```
ChatGPT / Claude 등 AI  →  메이크샵 MCP Server  →  메이크샵 API / DB / 통계 시스템
```

MCP 자체가 데이터를 만드는 것이 아니라, 메이크샵이 이미 가진 데이터를 AI가 사용할 수 있는 형태로 도구화(Tool化)하는 것이 핵심입니다.

## 단계별 로드맵 [제안]

| 단계 | 명칭 | 설명 | 비고 |
|---|---|---|---|
| 1단계 | 조회형 MCP | 주문/매출/회원/상품 단순 조회 | 구현 난이도 낮음, 1차 MVP 대상 |
| 2단계 | 분석형 MCP | 여러 Tool을 조합해 AI가 원인 분석까지 제공 | 1단계 완료 후 |
| 3단계 | 실행형 MCP | 조회를 넘어 관리자 작업(판매중지, 할인, 쿠폰 발급 등) 실행 | 조회/즉시실행과 변경/확인후실행 분리 필요 |

## 진행 상태

| 항목 | 내용 |
|---|---|
| 상태 | 기획 완료, 개발 착수 지원 단계 — 개발/보안 리뷰 완료("전체 상태: 수정 후 승인") 및 개발 킥오프 문서 작성 완료. 남은 9건은 개발 착수를 막지 않는 Non-Blocking 항목 |
| 최종 업데이트 | 2026-09-22 |

## 담당자

| 역할 | 담당자 |
|---|---|
| PM/PO | 임동호 |
| 서비스 기획 | 임동호 |
| 디자인 |  |
| 개발 (FE) |  |
| 개발 (BE) |  |
| QA |  |

## 일정

| 마일스톤 | 일정 | 비고 |
|---|---|---|
| 기획 완료 | [확인 필요] |  |
| 디자인 완료 | [확인 필요] |  |
| 개발 완료 | [확인 필요] |  |
| QA 완료 | [확인 필요] |  |
| 배포 | [확인 필요] |  |

## 관련 Jira

- [확인 필요] 관련 Jira 프로젝트/이슈 링크를 작성합니다.

## 관련 Figma

- [확인 필요] 관련 Figma 링크를 작성합니다.

## 주요 결정사항

| 일자 | 결정 내용 | 결정자 |
|---|---|---|
| 2026-09-22 | 프로젝트 목표를 "MakeShop을 AI가 사용할 수 있는 Commerce Platform으로 만드는 것"으로 설정. 1단계(조회형)→2단계(분석형)→3단계(실행형) 순으로 단계적 확장하는 방향을 제안(안) 수준으로 정리 | 임동호 |
| 2026-09-22 | 02_Research 범위를 ChatGPT(OpenAI) 공식 문서로 한정. Claude 등 타 MCP Client 연동 리서치는 진행하지 않음 | 임동호 |
| 2026-09-22 | "MakeShop MCP 연동 서비스 기획안"[제안]을 반영해 서비스 정의·1차 MVP 범위·Tool 8종·Scope 4종(orders.read/products.read/members.read/analytics.read)을 구체화. 01_Requirements 갱신, 05_Policy 3종(인증·권한 / 개인정보·보안 / 로그·예외처리), 06_Data-API(Tool 정의) 신규 작성. `get_product_sales_rank`는 `get_product_sales`로 명칭 정리. MVP에서는 메이크샵 관리자 내 별도 AI 질의 화면을 만들지 않기로 해 03/04_Wireframe·Screen-Spec은 아직 생성하지 않음 | 임동호 |
| 2026-09-22 | MCP 연결 단위를 **상점**으로 확정(연결 1건 = 상점 1개, 계정 단위 아님). MCP 연결 주체는 메이크샵 본사/슈퍼어드민이 아니라 개별 입점사 운영자임을 명확화. `get_product_sales`의 Scope를 `products.read`에서 `analytics.read`로 확정(상품 마스터 정보 vs 판매실적 데이터 경계). 근거는 09_Meeting/2026-09-22_다음단계-논의.md 참고 | 임동호 |
| 2026-09-22 | OAuth 인증 아키텍처 결정안 반영: 기존 메이크샵 로그인 체계 재사용(MCP 전용 계정 없음), OAuth 2.x Authorization Code + PKCE 구조(메이크샵이 Authorization Server 역할), 인증/연결 Flow(로그인→상점선택→Scope동의→Token발급), Access/Refresh Token 사용, 연결 해제 시 해당 상점 건만 revoke, Scope 추가 시 재동의·철회 시 즉시 차단을 확정. Token 만료시간·부운영자 허용 범위 등은 계속 [확인 필요]. 근거는 09_Meeting/2026-09-22_OAuth-인증-아키텍처-결정.md 참고 | 임동호 |
| 2026-09-22 | MCP Tool 세부 정책 결정안 반영: 기준 Timezone(상점설정 우선, 기본 Asia/Seoul), 주문 조회 기준일(주문생성일), 매출 정의(gross_sales/net_sales 등 5개 필드), get_orders-get_order_summary 및 get_products-get_product_sales 책임 분리, 기본/최대 조회기간(7일/90일), limit(50/100), Cursor Pagination, 기본 정렬, 검색어 정책, Timeout(10·15초), Retry 기준, 공통 Error 코드 체계, NO_DATA를 정상 응답으로 처리, AI 분석 책임 범위(MCP는 데이터·집계만 제공)를 확정. 매출 정확한 산식·배송비/포인트 반영·Rate Limit 수치 등은 계속 [확인 필요]. 근거는 09_Meeting/2026-09-22_Tool-세부정책-결정.md 참고 | 임동호 |
| 2026-09-22 | Task 5(자연어→Tool 매핑 시나리오) 완료: 단일조회/조건조회/기간비교/복합분석/권한부족/데이터없음/잘못된요청/기간초과/개인정보요청 9개 유형 총 30건을 01_Requirements/AI-Tool-매핑-시나리오.md에 정리. 작성 과정에서 get_order_summary·get_products·get_member_summary의 조건 필터 공백 3건을 발견 | 임동호 |
| 2026-09-22 | 위 3건을 확정 스펙으로 반영: `get_order_summary`에 `order_status` 필터, `get_products`에 `min_stock`/`max_stock` 필터, `get_member_summary`에 `member_grade` 필터 추가. 관련 Open Issue 모두 종결 | 임동호 |
| 2026-09-22 | Task 8(QA 시나리오) 완료: 07_QA/QA-시나리오.md에 인증/연결·상점단위연결·Scope권한·단일Tool호출·조건조회·기간비교·복합Tool호출·데이터정합성·NO_DATA·ValidationError·기간초과·Token만료·권한부족·Timeout/Retry·개인정보제한·연결해제/revoke 16개 영역, 정상/예외/Boundary/Permission/Regression 5개 유형 총 59건 작성 | 임동호 |
| 2026-09-22 | Task 9 Open Issue 4건 제안 확정: ① Token 만료시간(Access 1시간/Refresh Idle 90일·절대 1년, Rotation+재사용탐지), ② Rate Limit(상점 단위 분당 60회/시간당 1,000회), ③ 매출 산식(gross_sales~net_sales 5개 필드 산식, 취소·환불 소급 반영·결제수단 무관 원칙), ④ 관리자 권한 범위(1차 MVP는 대표 관리자만 허용)를 서비스 기획이 업계 표준 관행 근거로 `[제안]` — 개발/보안 검증 전까지 확정본 아님. 근거는 09_Meeting/2026-09-22_Task9-OpenIssue-최종정책-제안.md 참고 | 임동호 |
| 2026-09-22 | Task 3(개인정보 세부 기준) 완료: 05_Policy/02_개인정보-보안-정책.md §3-5에 8개 Tool 전수의 개인정보 필드 제공 범위 표 추가. 이름 계열 필드는 마스킹 없이 전부 미제공으로 최종 확정, `member_id`는 로그인ID/이메일이 아닌 불투명 내부 식별자로 설계해 관련 Open Issue 해소 | 임동호 |
| 2026-09-22 | 개발/보안 리뷰 공유 준비: `09_Meeting/2026-09-22_개발-보안-리뷰요청.md` 신규 작성(리뷰목적/서비스구조/확정정책요약/개발·통계·보안 확인사항/제안상태 항목/결과기록표 43건 포함). 전체 Open Issue를 개발 검토 필요 / 개발·보안 검토 필요 / 보안·법무 검토 필요 3분류로 재정리하며, 기획 차원에서 결정 가능한 6건(상점당 연결허용개수=무제한, Tool 과금=1차 무료, 연결관리화면 착수시점=Phase 2, Scope 미동의 안내문구, 예외 안내 다국어=미지원, Tool 응답 필드 검수절차=기획+개발 공동)을 확정 처리. 08_Jira에 "[기획] MCP 개발/보안 리뷰 진행" Task 추가. 10_Prototype은 현재 단계에서 생성하지 않기로 확정(UI는 외부 MCP Client가 담당, 인증/API 아키텍처 검증이 우선) | 임동호 |
| 2026-09-22 | **개발/보안 리뷰 완료 — 전체 상태: 수정 후 승인.** A(인증)/T(Token)/M(MCP Server)/D(Data-API)/S(매출·통계)/SEC(보안) 43개 확인 항목 중 40건은 원안대로 승인, 3건만 수정: ① Refresh Token Idle 90일/절대 1년 → **Idle 30일/절대 180일**, ② Rate Limit 적용 단위 상점 → **상점+MCP Client(`shop_id`+`client_id`)**, ③ Timeout 일반10초/집계15초 → **MVP 10초 통일**. MCP Server 신규 구축(GPT가 내부 API 직접 호출 금지), Token 귀속키(`user_id`+`shop_id`+`client_id`+`scopes`), 매출 산식 세부(할인 5종 항목, 포인트=결제수단 취급, 취소/환불 소급 반영), 개인정보 처리 동의 절차(MCP 최초 연결 시 제공) 등을 확정 반영. 05_Policy 3종·06_Data-API·07_QA에 전면 반영하고 해당 Open Issue를 모두 종결. 근거는 09_Meeting/2026-09-22_개발-보안-리뷰요청.md §8 참고 | 임동호 |
| 2026-09-22 | 개발 착수 지원: `09_Meeting/2026-09-22_개발-킥오프.md` 신규 작성(개발목표/구현범위/Out-of-Scope/핵심아키텍처/개발선행조건/구현우선순위/Tool 8종 개발순서/인증·데이터 의존성/보안필수사항/QA연계방식/PM확인필요항목/DoD/Non-Blocking Open Issue). 08_Jira는 기획 Task 완료 상태를 유지하고 별도 개발 Task 없이 "개발팀 전달용 참고사항" 섹션만 추가. 남은 미결정사항 9건은 개발 착수를 막지 않는 Non-Blocking으로 재확인 | 임동호 |

## 미결정 사항

2026-09-22 개발/보안 리뷰 완료("전체 상태: 수정 후 승인")로 대부분의 Open Issue가 종결되었습니다. 남은 9건은 **개발 착수를 막지 않는 Non-Blocking 항목**으로, 구현을 진행하면서 병행 확인합니다(상세는 `09_Meeting/2026-09-22_개발-킥오프.md` §14 참고). 상세 리뷰 결과 기록은 `09_Meeting/2026-09-22_개발-보안-리뷰요청.md` §8을 참고합니다.

### 개발 검토 필요

| 항목 | 비고 |
|---|---|
| 한 상점에 대표 관리자가 여러 명인 경우 여러 MCP 연결을 어떻게 구분·관리할지 | 05_Policy 인증·권한 정책 §10 |
| Response 필드명(영문 snake_case 등)의 최종 확정 | 06_Data-API §12 |
| 결제수단명(제공)과 결제수단 원문 정보(미제공)의 필드 단위 경계 | 05_Policy 개인정보·보안 정책 §10 |
| 매출 산식이 실제 구현 시 메이크샵 관리자 통계 화면과 수치가 정확히 일치하는지 최종 검증(산식 자체는 리뷰 승인 완료) | 06_Data-API §12 |

### 개발/보안 검토 필요

| 항목 | 비고 |
|---|---|
| Scope 변경 시 기존 Token 재사용/재발급 여부 | 05_Policy 인증·권한 정책 §10 |

### 보안/법무 검토 필요

| 항목 | 비고 |
|---|---|
| 운영자 본인의 개별 회원 개인정보 열람 예외 허용 여부 | 05_Policy 개인정보·보안 정책 §10 |
| 극소수 인원 재식별 가능성 처리 기준 | 05_Policy 개인정보·보안 정책 §10 |
| 로그 보관 기간 | 05_Policy 로그·예외처리 정책 §10 |
| 개인정보 처리 동의 문구의 정확한 문안 | 05_Policy 개인정보·보안 정책 §10 |

## 산출물 목록

| 폴더 | 산출물 |
|---|---|
| 01_Requirements | Requirements-Definition.md (3차 갱신), AI-Tool-매핑-시나리오.md (자연어→Tool 매핑 30건, 신규) |
| 02_Research | OpenAI-ChatGPT-MCP-Official-Docs.md (MCP 서버 구축/인증/보안/배포 공식 문서 조사) |
| 03_Wireframe | (해당 없음 — MVP 범위에 메이크샵 관리자 내 별도 화면 없음) |
| 04_Screen-Spec | (해당 없음 — 상동) |
| 05_Policy | 01_인증-권한-정책.md(개발/보안 리뷰 반영 — Token 만료값 수정, MCP Server 아키텍처·Token 귀속키·Scope 이중검증 확정), 02_개인정보-보안-정책.md(Tool별 개인정보 필드 표 §3-5, 개인정보 처리 동의 §3-6 신설), 03_로그-예외처리-정책.md(중앙 Audit Log 저장 확정) |
| 06_Data-API | MCP-Tools-Definition.md (개발/보안 리뷰 반영 — Timeout 10초 통일, Rate Limit shop+client 기준, 매출 산식 세부 확정, MCP Server 아키텍처 원칙 §11-15~16 신설) |
| 07_QA | QA-시나리오.md (17개 영역, 65건 — 리뷰 결과 반영해 Timeout 수정 및 Rate Limit·부운영자거부·revoke트리거 케이스 추가) |
| 08_Jira | Epic-MakeShop-MCP-기획.md (Epic 1건 + 하위 기획 Task 10건 전체 완료. 개발 Task는 미생성, "개발팀 전달용 참고사항" 섹션으로 대체) |
| 09_Meeting | 2026-09-22_다음단계-논의.md, 2026-09-22_OAuth-인증-아키텍처-결정.md, 2026-09-22_Tool-세부정책-결정.md, 2026-09-22_Task9-OpenIssue-최종정책-제안.md, 2026-09-22_개발-보안-리뷰요청.md, 2026-09-22_개발-킥오프.md(신규 — 개발 착수 지원 문서) |
| 10_Prototype | (해당 없음 — 실제 UI는 외부 MCP Client가 제공하고 메이크샵 관리자 내 AI 질의 화면은 Out-of-Scope라 UI Prototype보다 인증/API 아키텍처 검증이 우선. 연결 관리 화면 도입이 결정되면 그때 Wireframe/Screen-Spec/Prototype을 검토) |
| 11_Reference |  |
| assets |  |
