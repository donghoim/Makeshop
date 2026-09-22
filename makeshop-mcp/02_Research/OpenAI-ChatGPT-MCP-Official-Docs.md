# OpenAI/ChatGPT MCP 서버 구축 공식 문서 조사

> 본 프로젝트는 1차적으로 **ChatGPT(OpenAI) 연동만** 진행하는 것으로 범위를 한정했으므로, 본 문서는 OpenAI가 공식으로 제공하는 MCP(Model Context Protocol) 관련 문서만 조사한 결과입니다. Claude(Anthropic)·기타 MCP Client 관련 문서는 포함하지 않았습니다.
>
> 조사일: 2026-09-22 / 출처: `developers.openai.com`, `help.openai.com` (OpenAI 공식 개발자 문서)

---

## 1. 문서 체계 개요

OpenAI는 ChatGPT/Codex에 외부 서비스를 연동하는 확장 체계를 **"Plugins"** 라는 이름으로 제공하며, 그 구성요소로 **MCP 서버**, **Skills**, **(선택) UI**를 둡니다.

| 구성요소 | 역할 |
|---|---|
| MCP 서버 | 외부 시스템·데이터소스에 연결해 "실시간 데이터와 통제된 Tool"을 플러그인에 제공 |
| Skills | MCP Tool을 조합한 "반복 가능한 워크플로우" |
| UI(선택) | 플러그인이 ChatGPT 내에서 반환할 수 있는 시각적 인터페이스(위젯) |

공식 가이드는 아래 순서로 구성되어 있습니다.

1. **Plan** — 사용 사례를 정의하고 이를 구체적인 MCP Tool로 변환
2. **Build** — Quickstart → MCP 서버 개발 → Skills/UI 추가 → 인증 구현
3. **Deploy** — ChatGPT에서 테스트 → 검증 오류 해결 → 공개 디렉토리 제출

문서는 developers.openai.com 아래 `/plugins/*`(Plugins 프레임워크 문서)와 `/api/docs/*`(Responses API를 통한 MCP 연동 문서) 두 갈래로 나뉘며, 전자는 **ChatGPT 앱(자연어 대화형 Tool 호출) 연동**, 후자는 **API 코드에서 MCP 서버를 Tool로 등록해 호출**하는 시나리오를 다룹니다. 본 프로젝트(사용자가 ChatGPT에서 자연어로 메이크샵 데이터를 조회)는 전자(`/plugins/*`)가 1차 대상이며, 후자(`/api/docs/mcp`, `/api/docs/guides/tools-connectors-mcp`)는 메이크샵 자체 서비스가 OpenAI API를 백엔드에서 호출하는 시나리오 등에 참고용으로 조사했습니다.

---

## 2. MCP 서버 구축 가이드

출처: [Build an MCP server – Plugins | OpenAI Developers](https://developers.openai.com/plugins/build/mcp-server), [MCP server – Plugins | OpenAI Developers](https://developers.openai.com/plugins/concepts/mcp-server)

### 2.1 개념

- MCP 서버는 "라이브 데이터를 읽거나, 액션을 수행하거나, 다른 서비스와 통합해야 할 때" 플러그인에 포함하는 구성요소입니다.
- MCP 서버가 노출하는 4가지 요소

| 요소 | 설명 |
|---|---|
| Tools | 모델이 구조화된 입력으로 호출할 수 있는 함수. 이름·설명·입력 스키마·(선택)출력 스키마로 구성 |
| Resources | 클라이언트가 접근 가능한 데이터/콘텐츠 |
| Prompts | 일관된 상호작용을 위한 재사용 가능한 템플릿 |
| Instructions | 서버 전체에 적용되는 사용 가이드 |

- Tool 호출 흐름: ① Client가 서버로부터 사용 가능한 Tool 목록을 조회 → ② 모델이 적절한 Tool을 선택하고 입력 스키마에 맞는 인자를 채움 → ③ 서버가 값을 검증·실행하고 결과를 반환 → ④ 모델이 결과를 바탕으로 대화를 이어감
- 응답은 "커스텀 UI 없이도 이해 가능한" 간결한 텍스트 또는 구조화된 콘텐츠여야 하며, UI를 지원하는 Client를 위해 선택적으로 UI 리소스를 함께 반환할 수 있습니다.

### 2.2 SDK

| SDK | 패키지 | 설치 |
|---|---|---|
| TypeScript | `@modelcontextprotocol/sdk` | `npm install @modelcontextprotocol/sdk zod` |
| Python | `mcp` | `pip install mcp` |

### 2.3 서버/Tool 정의 (TypeScript 예시)

```ts
const server = new McpServer({
  name: "acme-projects",
  version: "1.0.0",
});

server.registerTool("tool_name", {
  title: "Human-readable title",
  description: "When and why to use this tool",
  inputSchema: { /* Zod schema */ },
  outputSchema: { /* Zod schema */ },
  annotations: {
    readOnlyHint: boolean,
    destructiveHint: boolean,
    openWorldHint: boolean,
  },
}, async (parameters) => {
  // 인가(authorization) 및 실제 처리 로직
  return {
    structuredContent: { /* 데이터 */ },
    content: [{ type: "text", text: "..." }],
  };
});
```

- Tool마다 **행동 지향적 이름**, **언제/왜 사용하는지 설명**, **명시적 입출력 스키마**, **정확한 안전성 annotation**(`readOnlyHint`/`destructiveHint`/`openWorldHint`), **인가를 강제하는 핸들러**가 필요합니다.
- 서버 초기화 시 지침(instructions)을 추가할 수 있으며, 핵심 내용은 **처음 512자 이내**에 담아야 합니다.

### 2.4 Transport

- `/mcp` 같은 HTTP 엔드포인트로 MCP의 **Streamable HTTP** transport를 노출해야 ChatGPT·Codex와 연동됩니다.

### 2.5 테스트/배포

1. 로컬 테스트: **MCP Inspector**로 초기화·Tool 목록·스키마·인가 로직을 검증
2. 운영 배포: 지연시간·가용성·인증 요건을 만족하는 안정적인 공개 HTTPS 엔드포인트로 배포
3. 업데이트 시에도 이미 공개된 Tool 이름·스키마와의 하위호환성 유지 필요

### 2.6 검색/문서 조회형 Tool 계약 (Deep Research / Company Knowledge 연동 시)

출처: [Building MCP servers for plugins and API integrations | OpenAI API](https://developers.openai.com/api/docs/mcp)

ChatGPT의 **Deep Research / 회사 지식(company knowledge) 검색** 기능과 호환되려면, 위 2.3의 범용 Tool 등록 방식과 별개로 아래 2개의 **읽기 전용 Tool을 정해진 이름·스키마로** 구현해야 합니다. (본 프로젝트의 `get_orders` 등 범용 조회 Tool과는 다른 별도의 계약이며, 필요 시에만 추가 적용)

| Tool | 입력 | 출력 |
|---|---|---|
| `search` | 검색어 문자열 1개 | `results` 배열, 각 항목은 `id`/`title`/`url` |
| `fetch` | 문서 고유 식별자 문자열 | `id`/`title`/`text`/`url`/(선택)`metadata` |

- 두 Tool 모두 `structuredContent`(객체)와 `content`(그 JSON 문자열을 담은 텍스트) 형태를 함께 반환해야 합니다.
- `url`이 비어있지 않은 문자열일 때만 ChatGPT가 인용(citation) 메타데이터를 생성합니다.

---

## 3. 인증(OAuth 2.1) 연동 가이드

출처: [Authentication – Plugins | OpenAI Developers](https://developers.openai.com/plugins/build/auth)

### 3.1 인증 방식 선택 기준

- **읽기 전용·비민감 데이터**만 다루면 무인증(anonymous read-only)도 가능합니다.
- **회원별 데이터를 노출하거나 쓰기 작업을 수행**하면 반드시 사용자 인증(OAuth 2.1)을 구현해야 합니다. 본 프로젝트는 쇼핑몰 운영자별 주문/회원/매출 데이터를 다루므로 **OAuth 2.1 필수** 대상입니다.
- ChatGPT는 자기 자신(Client)을 인증하기 위해 **OpenAI 관리 mTLS**를 사용하고, **사용자 인증**에는 별도로 **OAuth 2.1**을 사용합니다. 즉 mTLS(ChatGPT 신원 확인)와 OAuth(사용자 신원 확인)는 서로 다른 계층입니다.

### 3.2 등장인물 (MCP Authorization 규격 기준)

| 역할 | 본 프로젝트 매핑 |
|---|---|
| Resource Server | 메이크샵 MCP Server (Tool을 노출하고 access token을 검증) |
| Authorization Server | 메이크샵의 ID Provider (신규 구축 또는 기존 인증체계 연계) |
| Client | ChatGPT (사용자를 대신해 동작) |

### 3.3 OAuth 2.1 + PKCE 플로우 요약

| 단계 | 내용 |
|---|---|
| ① Protected Resource Metadata | 메이크샵 MCP 서버가 `GET /.well-known/oauth-protected-resource`에 `resource`/`authorization_servers`/`scopes_supported` 등을 공개 |
| ② Authorization Server Metadata | 메이크샵 Authorization Server가 `/.well-known/oauth-authorization-server`(또는 `/.well-known/openid-configuration`)에 `issuer`/`authorization_endpoint`/`token_endpoint`/`code_challenge_methods_supported`(`S256` 필수) 등을 공개 |
| ③ Client 식별 | ChatGPT가 CIMD(Client ID Metadata Document, 권장) 또는 DCR(Dynamic Client Registration) 방식으로 자신을 Client로 식별시킴 |
| ④ 인가 요청 (PKCE) | 사용자가 처음 Tool을 호출할 때 ChatGPT가 `resource` 파라미터 + PKCE(`code_challenge`, `code_challenge_method=S256`)를 포함해 인가 코드 플로우 시작 |
| ⑤ 토큰 교환 | ChatGPT가 인가 코드를 access token으로 교환. 토큰 응답에는 `access_token`/`token_type`/`expires_in`/`scope`/`aud`/`iss` 포함 |
| ⑥ 토큰 첨부/검증 | 이후 모든 MCP 요청에 `Authorization: Bearer <access_token>` 첨부. 메이크샵 MCP 서버는 서명·`iss`·`exp`·`aud`(또는 `resource`)·`scope`를 **직접 검증**해야 함 |

> **핵심 원칙(원문 인용)**: "요청이 MCP 서버에 도달한 순간, 토큰은 신뢰할 수 없는 것으로 간주하고 서명 검증·issuer/audience 일치·만료·재사용 방지·스코프 검증을 서버가 직접 수행해야 한다. 이 책임은 ChatGPT가 아니라 서버(당신)에게 있다."

### 3.4 CIMD vs DCR

| 구분 | CIMD (권장) | DCR |
|---|---|---|
| 방식 | ChatGPT가 HTTPS 메타데이터 문서 URL을 `client_id`로 사용, 서버가 이를 fetch해 검증 | ChatGPT가 MCP 서버 연결마다 `registration_endpoint`를 1회 호출해 `client_id`를 발급받음 |
| 장점 | 모든 연결에서 안정적인 단일 Client 신원, 관리 단순 | 서버가 요구하는 임의의 토큰 엔드포인트 인증 방식(예: `client_secret_post`) 지원 가능 |
| 단점 | - | 연결마다 등록 Client가 늘어나 관리 부담, 연결 활성 기간 동안 자격증명 유효성 유지 필요 |
| ChatGPT 지원 토큰 인증 방식 | `none`(공개 클라이언트, PKCE만) 또는 `private_key_jwt`(서명된 클라이언트 어설션) | 서버가 `registration_endpoint`에서 지원하는 방식에 따름 |

### 3.5 Tool 단위 인가 요구사항 선언

```ts
server.registerTool(
  "create_doc",
  {
    title: "Create Document",
    description: "Make a new doc in your account.",
    inputSchema: { title: z.string() },
    outputSchema: {},
    securitySchemes: [
      { type: "oauth2", scopes: ["docs.write"] }
    ],
  },
  async ({ title }) => { /* ... */ }
);
```

- `securitySchemes`는 **서버 단위가 아니라 Tool 단위**로 선언하는 것이 권장됩니다(추후 Tool별 권한 변경이 쉬움).
- `noauth`(무인증 허용) / `oauth2`(필요 scope 명시) 두 가지 스킴을 Tool마다 선언할 수 있습니다.
- 인증 UI가 뜨려면 ① Protected Resource Metadata 공개, ② Tool별 `securitySchemes` 선언, ③ 토큰 검증 실패 시 `_meta["mcp/www_authenticate"]` 에러 반환 — 3가지가 모두 갖춰져야 합니다.

### 3.6 다중 계정 지원 — Profile Tool

- 사용자가 여러 계정(예: 여러 쇼핑몰)을 연결할 수 있게 하려면, `_meta["openai/profile"]: true`로 선언된 **Profile Tool**(`get_profile`)을 제공해야 합니다.
- 반환하는 `id`는 opaque(불투명)해야 하며, 토큰 갱신·재연결·스코프 변경에도 **불변**이어야 하고, 이메일/표시이름 등 변경 가능한 값으로 만들면 안 됩니다.

### 3.7 권장 사항

- 자체 구현보다 **검증된 Identity Provider(예: Auth0)** 사용을 권장합니다. Auth0는 Metadata Discovery, CIMD 등록, API 보안, 토큰 교환을 MCP에 맞춰 지원합니다.
- 개발 단계에서는 단기 토큰을 쓰는 개발용 테넌트로 시작 → 신뢰할 수 있는 테스터 대상 제한 공개 → MCP Inspector의 Auth 설정으로 OAuth 단계별 디버깅 → 정식 공개 순으로 진행할 것을 권장합니다.

---

## 4. Responses API를 통한 MCP 연동 (메이크샵이 OpenAI API를 직접 호출하는 경우 참고)

출처: [MCP servers | OpenAI API](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)

이 방식은 "ChatGPT 앱 안에서 사용자가 메이크샵 MCP 서버를 연결"하는 본 프로젝트의 주 시나리오와는 다르며, **메이크샵이 자체 백엔드/어드민에서 OpenAI API(Responses API)를 호출하면서 MCP 서버를 Tool로 등록**하는 경우에 해당합니다. 향후 메이크샵 어드민 내 AI 기능(예: 어드민 내장 AI 어시스턴트)을 자체 구축할 때 참고할 수 있어 별도 조사했습니다.

- Tool 정의에 `type: "mcp"`, `server_label`, `server_description`, `server_url`, `require_approval`(`"never"`/`"always"`/필터링 객체), `allowed_tools`(호출 허용 Tool 이름 제한), `authorization`(OAuth access token, API가 저장하지 않음) 등을 지정합니다.
- 민감한 호출 전에는 기본적으로 `mcp_approval_request`가 생성되며, `mcp_approval_response`(`approve: true/false`)로 응답합니다.
- 예시(Python):

```python
from openai import OpenAI

client = OpenAI()
resp = client.responses.create(
    model="<현재 사용 중인 모델명>",
    tools=[{
        "type": "mcp",
        "server_label": "makeshop",
        "server_url": "https://mcp.makeshop.example.com/mcp",
        "require_approval": "never"
    }],
    input="이번 주 신규 회원 몇 명이야?"
)
print(resp.output_text)
```

> 모델명은 원문 예시를 인용하지 않고 자리표시자로 표기했습니다. 실제 적용 시점의 최신 모델 ID는 OpenAI API 공식 문서에서 확인이 필요합니다. [확인 필요]

---

## 5. ChatGPT Developer Mode / Connectors

출처: [ChatGPT Developer mode | OpenAI Developers](https://developers.openai.com/api/docs/guides/developer-mode)

- Developer Mode는 "모든 Tool에 대해 읽기·쓰기를 포함한 완전한 MCP Client 지원"을 제공하는 기능으로, Pro/Plus/Business/Enterprise/Education 플랜에서 웹으로 이용 가능합니다.
- 활성화 경로: **설정 → Security and login → Developer mode** 토글.
- Developer Mode에서 사용자가 커스텀 MCP 서버(SSE 또는 Streamable HTTP)를 앱으로 등록하면, 개별 Tool을 켜고 끌 수 있고 "새로고침"으로 최신 Tool 설명/서버 지침을 다시 가져올 수 있습니다.
- **쓰기 작업은 기본적으로 사용자 확인이 필요**하며, `readOnlyHint` annotation이 있는 Tool은 읽기 전용으로 인식됩니다.
- 공식 경고: "프롬프트 인젝션 등의 위험", 모델이 쓰기 작업에서 실수해 데이터를 훼손할 가능성, 악의적인 MCP가 정보를 탈취하려는 시도 등을 이용자가 직접 주의해야 합니다.

---

## 6. 보안·개인정보 가이드

출처: [Security & Privacy – Plugins | OpenAI Developers](https://developers.openai.com/plugins/guides/security-privacy)

| 항목 | 내용 |
|---|---|
| 데이터 최소화 | 현재 프롬프트에 필요한 데이터만 포함, 시크릿/토큰을 컴포넌트 props에 담지 않음 |
| 보관 정책 | 데이터 보관 기간을 결정·공개하고, 사용자 삭제 요청을 이행해야 함 |
| PII 로그 | 로그 기록 전 PII를 redact. 디버깅용 상관관계 ID는 저장하되, 원본 프롬프트 텍스트는 필요한 경우가 아니면 저장하지 않음 |
| 쓰기 작업 안전 | 서버 측에서 모델이 제공한 입력값도 반드시 재검증, 되돌릴 수 없는 작업은 사람의 확인을 요구, 호스트(ChatGPT)의 확인 UI를 활용 |
| 핵심 원칙 | 권한/스코프에 최소 권한 원칙 적용, 계정 연동·쓰기 권한에는 명시적 사용자 동의 필요, "프롬프트 인젝션과 악성 입력이 서버에 도달할 것"을 전제로 설계 |
| 리뷰 | 출시 전 보안 검토(특히 규제 대상 데이터), 비정상 트래픽·인증 실패 모니터링, 의존성 패치 관리 |

메이크샵 프로젝트 관점에서는 주문/회원 데이터에 개인정보(이름, 연락처, 주소 등)가 포함되므로, **Tool 응답에 노출하는 필드 자체를 최소화(예: 회원 통계는 집계값만, 개별 회원 조회는 별도 스코프로 분리)** 하는 설계가 이 가이드와 정합성이 높습니다. [제안]

---

## 7. 공개 디렉토리 제출/배포 프로세스 (향후 참고)

출처: [Submit plugins | OpenAI Developers](https://developers.openai.com/plugins/deploy/submission)

- 제출 전 OpenAI Platform에서 "Apps Management" 쓰기 권한 및 개발자(개인/사업자) 신원 인증이 필요합니다.
- 제출 체크리스트(요약): 리스팅 정보(이름/설명/로고/카테고리/URL), 공개 HTTPS MCP 서버, Tool annotation(`readOnlyHint`/`openWorldHint`/`destructiveHint`), 실사용 워크플로우를 보여주는 Starter Prompt, **성공 케이스 5개·실패(음성) 케이스 3개** 테스트, 국가/지역 선택, 릴리즈 노트.
- 제출된 내용에는 "불필요한 개인정보, 인증 시크릿, 디버그 페이로드, 내부 식별자, 미공개 사용자 관련 필드"가 Tool 응답에 없어야 합니다.
- 승인 후에도 OpenAI가 주기적으로 MCP Tool 목록을 재조회하며, 삭제된 Tool은 자동 반영되고 변경된 Tool 정의는 자동 검증 통과 후 반영됩니다.
- 본 프로젝트가 향후 OpenAI **공식 Plugins 디렉토리에 등재**되는 것까지 목표로 할지는 [확인 필요] 사항입니다 — 등재 없이도 개별 운영자가 Developer Mode에서 커스텀 MCP 서버로 직접 연결하는 것은 가능합니다.

---

## 8. 메이크샵 프로젝트 적용 시 시사점 [제안]

| 조사 내용 | 05_Policy 이하 단계에 반영할 시사점 |
|---|---|
| Tool 단위 `securitySchemes`/scope 선언 | `01_Requirements`에서 정의한 `orders.read`/`members.read`/`products.read`/`analytics.read` 스코프를 Tool 등록 시 그대로 매핑 가능 |
| OAuth 2.1 + PKCE, Resource Server 책임 원칙 | 메이크샵 MCP 서버가 access token 검증을 직접 수행해야 하며, 기존 메이크샵 로그인/Open API 인증체계와 별도로 Authorization Server(또는 그 대행) 구성이 필요 — 05_Policy 인증 정책에 반영 필요 |
| CIMD 권장 | 신규 Identity Provider 구축 시 CIMD 지원 여부를 요건에 포함할 것을 제안 |
| Profile Tool(다중 계정) | 운영자가 여러 쇼핑몰(도메인)을 운영하는 경우를 고려해 프로필/쇼핑몰 단위 식별자 설계 필요 — Open Issue로 반영 |
| 읽기 전용 확인(readOnlyHint) | 1차 MVP(조회형)는 모든 Tool에 `readOnlyHint: true`를 명시해 Developer Mode에서 "확인 없이 즉시 실행" 가능하도록 설계 가능 |
| 쓰기 작업 사용자 확인 | 2단계(실행형) 진입 시 `destructiveHint`/사용자 확인 UI 설계가 필수 — 기존 요구사항 문서의 "조회→즉시실행, 변경→확인후실행" 원칙과 정합 |
| PII 최소 노출 원칙 | 회원 조회 Tool의 응답 필드 설계 시 개인정보 최소화 원칙을 06_Data-API 단계에서 반영 |

---

## 9. 참고 문서 목록

| 문서 | URL |
|---|---|
| Plugins 개요 | https://developers.openai.com/plugins |
| Apps SDK 개요 | https://developers.openai.com/apps-sdk |
| MCP 서버 구축 가이드 | https://developers.openai.com/plugins/build/mcp-server |
| MCP 서버 개념 문서 | https://developers.openai.com/plugins/concepts/mcp-server |
| 인증(OAuth) 가이드 | https://developers.openai.com/plugins/build/auth |
| 보안·개인정보 가이드 | https://developers.openai.com/plugins/guides/security-privacy |
| 제출/배포 프로세스 | https://developers.openai.com/plugins/deploy/submission |
| MCP 서버 구축(Responses API/Deep Research 관점) | https://developers.openai.com/api/docs/mcp |
| Responses API의 MCP Tool 연동 | https://developers.openai.com/api/docs/guides/tools-connectors-mcp |
| ChatGPT Developer Mode | https://developers.openai.com/api/docs/guides/developer-mode |
| Apps SDK Reference | https://developers.openai.com/apps-sdk/reference |
| Apps SDK 예제 저장소 (GitHub) | https://github.com/openai/openai-apps-sdk-examples |

모든 링크는 2026-09-22 기준 OpenAI 공식 도메인(`developers.openai.com`, `github.com/openai`)에서 정상 응답을 확인한 문서입니다.

## Open Issues (본 문서 관련)

| 번호 | 항목 | 구분 | 확인 필요 대상 |
|---|---|---|---|
| 1 | 메이크샵 MCP 서버를 OpenAI 공식 Plugins 디렉토리에 등재할지, 개별 운영자의 Developer Mode 커스텀 연결로만 제공할지 | [확인 필요] | 정책 |
| 2 | 메이크샵의 Authorization Server를 신규 구축할지, 기존 Identity Provider(Auth0 등)를 도입할지 | [확인 필요] | 개발 |
| 3 | Responses API 기반 연동(4장)을 이번 프로젝트 범위에 포함할지, 별도 프로젝트로 분리할지 | [확인 필요] | 정책 |
