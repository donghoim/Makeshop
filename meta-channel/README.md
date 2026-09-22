# 10_Prototype — Meta 채널 연동 개선

## 문서 정보

| 항목 | 내용 |
|---|---|
| 작성일 | 2026-08-11 (v1.3 — Shops 관리 탭 신규 반영) |
| 작성 | 서비스기획 |
| 근거 | `01_Google-Channel/11_Reference/Meta-Channel/exports/메타 채널 연동.pdf`, `11_Reference/3-4. FBE 자산 연동(추정).png`, `03_Wireframe/`(SCR-META-CONN-001·FEED-001·ADS-001·SHOP-001), `04_Screen-Spec/SCR-META-SHOP-001/`, `05_Policy/Shops-관리-정책서.md` |
| 상태 | [확정] 사용자 지시로 05_Policy·04_Screen-Spec 선행 없이 Prototype을 먼저 제작함(CLAUDE.md 기본 순서의 예외). Shops 관리 탭(v1.3)은 반대로 `04_Screen-Spec → 05_Policy → Prototype` 순서를 지켜 반영함 |

> v1.3 변경사항(2026-08-11): 사용자 요청으로 **`Shops 관리` 탭 신규 추가**(연결 관리·상품 피드·광고 관리 뒤 4번째 탭). Facebook/Instagram Shops는 메이크샵이 직접 생성·제어하지 않으므로 조회·안내·외부 이동만 구현했다. `src/js/main.js`에 `renderShopsTab()` 신규 추가, `src/js/data.js`에 `account.catalogName` 필드 추가, `src/css/style.css`에 `.shop-intro`·`.channel-grid`·`.channel-card` 등 신규 클래스 추가. Commerce Manager/Facebook Shop 설정/Instagram Shop 설정/Meta Shops 가이드 4개 외부 이동 버튼은 `05_Policy/Shops-관리-정책서.md` 13장 검증 결과 정확한 URL을 확인하지 못해 실제 이동을 시뮬레이션하지 않고 `todoExternalLink()`로 "확인 필요(TODO)" 토스트만 노출한다(임의 URL 생성 금지 원칙).
>
> v1.1 변경사항(2026-08-03): 사용자가 `11_Reference/`에 추가한 `3-4. FBE 자산 연동(추정).png` 재검토 결과, [Facebook Business Extension 시작하기] 클릭 시 실제로는 **메이크샵 자체 "개인정보 수집·이용 동의" 모달(0단계)**이 먼저 노출된 뒤 FBE 위저드가 시작됨을 확인 — v1.0 Prototype에는 이 단계가 누락되어 있었다. `src/js/main.js`에 `openPrivacyConsentModal()`을 신규 추가하고 최초 연동 시에만(설정 재실행 시 제외) 노출되도록 반영함. 컨펌 모음·툴팁 모음·연결관리 PNG 2종·PDF는 기존 자료와 동일 내용(해시/페이지 동일)임을 확인해 추가 변경 없음.
>
> v1.2 변경사항(2026-08-04): 기존 `openFbeStepsModal()`은 "1/5 — Facebook 계정으로 로그인합니다" 식의 텍스트 진행률 표시로 단순화되어 있었다. 사용자가 실제 Meta OAuth 화면(브라우저 팝업 창 형태, facebook.com 주소창, Facebook 로그인 폼 등)과 최대한 유사하게 재현하도록 요청하여, 신규 파일 `src/js/fbe-oauth.js`(`FbeOAuth` 모듈)로 전면 재작성함. 0단계 동의 모달 완료 직후 열리며, 로그인→OAuth 권한 동의→Shop 시작→비즈니스 포트폴리오 선택→Facebook 페이지 연결→Instagram 연결→카탈로그 선택→광고 계정 선택→Meta 픽셀 선택→커머스 계정 확인→설정 확인(전체 요약)→권한 확인→커머스 계정 설정 완료→완료, 총 14단계를 브라우저 창 크롬(타이틀바·주소창)을 갖춘 별도 오버레이(`.fbwin-overlay`)로 순서대로 노출한다. `src/css/style.css`에 `.fbwin*` 스타일 세트를 추가했다.

> CLAUDE.md의 Prototype 작성 규칙은 원칙적으로 `04_Screen-Spec → 05_Policy → Prototype` 순서를 요구하지만, 이번 케이스는 정책·화면설계 내용이 이미 원본 PDF에 존재하는 기존 기능을 이관하는 상황이라 사용자가 순서를 뒤집어 Prototype을 먼저 만들도록 지시했다. 따라서 이 Prototype이 오히려 04_Screen-Spec·05_Policy 작성 시 참고 자료가 된다.

## 실행 방법

- `index.html`은 브라우저에서 `file://` 로 열어도 대부분 동작하지만, 일부 환경(브라우저 보안 정책)에 따라 `fetch` 계열 API가 막힐 수 있어 **로컬 정적 서버로 여는 것을 권장**한다. 이 프로토타입은 `fetch`를 전혀 사용하지 않고 모든 데이터를 `<script>` 태그(`src/js/data.js`)로 인라인했기 때문에, 대부분의 경우 `index.html`을 더블클릭해서 바로 열어도 정상 동작한다.
- 별도 서버가 필요한 경우 폴더 내에서 `npx serve .` 또는 `python -m http.server` 실행 후 안내되는 주소로 접속한다.

## 기술 범위

- HTML / CSS / JavaScript(Vanilla)만 사용, Bootstrap·Tailwind 등 외부 프레임워크 미사용(오프라인에서도 항상 동일하게 렌더링되도록 CDN 의존 제거).
- Backend·DB 연동 없음. 모든 데이터는 `src/js/data.js`의 `window.MOCK` 객체(Mock JSON에 해당, `src/data/*.json`은 동일 스키마 참고용 사본).
- 모든 상태는 브라우저 메모리에만 존재하며, 새로고침 시 초기화된다(영속성 없음 — Prototype 범위이므로 의도된 동작).

## 구현 범위

| 화면 | 구현 내용 |
|---|---|
| 연결 관리 탭 | 미연동 Empty State, **개인정보 수집·이용 동의 모달(0단계, 체크박스 2건 모두 동의해야 진행)**, **Meta 인증 팝업 시뮬레이션(1~14단계, 실 브라우저 창 형태로 로그인부터 완료까지 재현)**, 연동완료 후 자산 정보/상품피드·광고관리 요약, 카테고리 매칭 자동 팝업, 연결 해제(컨펌→처리) |
| 상품 피드 탭 | 미연동 Empty State, 등록 현황 바, 상태별 필터 탭(전체/활동중/검토중/미승인/노출제한/사용안함), 검색, 페이지 크기 변경, 페이지네이션, 상세/선택 수정(개별·일괄) 모달(사용여부·GPC·성별·연령대) |
| 광고 관리 탭 | 미연동 Empty State, 광고 계정 정보, 조회기간별 캠페인 성과 요약, 캠페인 목록, 목록 항목(컬럼) 설정 모달(추가/제외/순서 변경), 전환 추적 설정(선행 조건 미충족 시 비활성 처리) |
| Shops 관리 탭 (v1.3 신규) | 미연동 Empty State, Shops 소개 배너, 연결된 Shop 정보(Commerce Account/Catalog), 판매 채널(Facebook Shop/Instagram Shop) 카드, Instagram 미연결 시 카드 단위 안내(화면 전체 차단 없음), 안내 사항. 외부 이동 4종은 URL 미확인으로 "확인 필요(TODO)" 토스트만 노출(실제 이동 시뮬레이션 없음) |
| 공통 | 모달, 커스텀 검색형 드롭다운(카테고리 선택), 토스트, 탭, 페이지네이션, 유효성 검증(미매칭 닫기 확인, 선택 0건 경고 등) |

## 알려진 한계 (Prototype 특성상 의도된 단순화)

- 상태는 새로고침 시 초기화됨(서버/DB 없음).
- 캠페인 목록에 없는 파생 지표(CPM·CPC·전환율 등)는 노출수/클릭수/비용 등 기존 필드로부터 근사 계산한 값이며, 실제 Meta Marketing API 값이 아니다.
- Meta 인증 팝업(Embedded Signup)은 `11_Reference/3-4. FBE 자산 연동(추정).png` 실 화면 캡처를 최대한 유사하게 재현한 시뮬레이션이며, 원본은 Meta가 소유·변경하는 화면이라 실제 서비스에서는 Meta 측 UI 개편에 따라 문구·순서·단계 수가 달라질 수 있다(`01_Requirements/Requirements-Definition.md` v1.2, 4장 Out-of-Scope 참조). 로그인 단계는 이메일+비밀번호 입력 경로 1가지로만 단순화했다(실제로는 브라우저 저장 프로필 선택 경로도 있음).
- 11단계(설정 확인) 요약 항목 클릭으로 이전 단계로 되돌아가는 실제 Meta 동작은 이 프로토타입에서 구현하지 않았다(요약 표시만 제공).
- 도메인 인증, 결제 수단 관리 등 외부(Meta) 화면 이동은 실제 이동 없이 토스트로 시뮬레이션 처리한다.
- Shops 관리 탭의 외부 이동 4종(Commerce Manager/Facebook Shop 설정/Instagram Shop 설정/Meta Shops 가이드)은 다른 탭과 달리 "이동합니다" 시뮬레이션조차 하지 않고 "확인 필요(TODO)" 토스트만 노출한다 — 정확한 목적지 URL을 검증하지 못한 상태에서 임의 URL을 만들지 않기 위함(`05_Policy/Shops-관리-정책서.md` 13장).
