# 메이크샵 Web IDE — 개별디자인 Prototype

메이크샵 "개별디자인" 편집 화면을 VS Code 스타일 Web IDE UX로 개편한 프론트엔드 프로토타입입니다.
백엔드/DB 연동 없이 Mock 데이터로만 동작합니다.

## 실행 방법

```
node server.js
```

브라우저에서 http://localhost:5173 접속 (기본 포트를 바꾸려면 `node server.js 4000` 처럼 인자로 전달).

ES Module(import/export)과 fetch 기반 리소스 로딩을 쓰기 때문에 `index.html`을 `file://`로 직접 열면 동작하지 않습니다. 반드시 위 로컬 서버(또는 `npx serve .` 등 임의의 정적 서버)로 열어주세요.

## 기술 스택 및 CLAUDE.md 기준 대비 조정 사항

원 요청에는 React / TypeScript / Monaco Editor / Tailwind CSS 조합이 명시되어 있었으나, 이 워크스페이스의 Prototype 규칙(`HTML/CSS/JS만 사용, 백엔드/빌드 도구 없이 CDN 또는 인라인 방식`)에 맞추기 위해 아래와 같이 번들러 없는 구성으로 조정했습니다.

| 항목 | 조정 내용 |
|---|---|
| React | esm.sh CDN에서 React 18 / ReactDOM 18을 네이티브 ES Module로 로드 (`src/js/lib.js`) |
| JSX | 빌드 없이 JSX 유사 문법을 쓰기 위해 `htm` 라이브러리 사용(태그드 템플릿 리터럴, 별도 컴파일 불필요) |
| TypeScript | **미사용.** 브라우저에서 트랜스파일 없이 동작해야 해서 순수 JS로 작성했습니다. 대신 컴포넌트/상태 단위를 명확히 분리해 추후 `.tsx` 전환이 쉬운 구조로 작성했습니다. |
| Monaco Editor | jsdelivr CDN의 AMD 로더(`vs/loader.js`)로 로드 |
| Tailwind | 미사용. 260px Explorer / 40px Tab / 28px Status Bar 등 IDE 특유의 정밀한 레이아웃이 많아 커스텀 CSS(`src/css/styles.css`)로 직접 작성했습니다. |
| 컴포넌트 분리 | 번들러 없이도 네이티브 ES Module(`import`/`export`)로 파일을 완전히 분리했습니다. `src/components/*.js` 참고. |

실제 서비스로 이어갈 때는 Vite + React + TypeScript + Monaco(`@monaco-editor/react`) 조합으로 그대로 포팅 가능하도록, 컴포넌트/스토어/유틸 경계를 서비스 코드와 동일하게 나눠뒀습니다.

## 폴더 구조

```
10_Prototype
├── index.html
├── server.js              # 의존성 없는 로컬 정적 서버
├── src
│   ├── css/styles.css
│   ├── js
│   │   ├── app.js          # 엔트리 포인트
│   │   ├── lib.js          # React/htm CDN 재수출
│   │   ├── store.js        # 전역 상태(useReducer + Context) — Mock File System, 열린 탭, Dirty State 등
│   │   ├── monacoLoader.js # Monaco 로더 + makeshop-html 커스텀 언어/자동완성 등록
│   │   └── pathUtils.js    # 경로/트리 유틸리티
│   ├── components/         # Explorer, EditorTabs, MonacoEditorPane, PreviewPanel, QuickOpen 등
│   └── data/mockFileSystem.js  # SYSTEM/WORKSPACE Mock 트리 + 파일 내용 + 메이크샵 태그 목록
```

## 구현된 기능 (요청 16번 항목 기준)

- Explorer 폴더 펼치기/접기, SYSTEM(읽기 전용) / WORKSPACE(편집 가능) 구분
- WORKSPACE 새 폴더/새 파일 생성, 이름 변경, 삭제, 우클릭 Context Menu(경로 복사 포함)
- 파일 클릭 시 Editor Tab 오픈, 멀티탭, 탭 전환/닫기
- 코드 수정 시 Dirty State(●) 표시, 탭/트리 동시 반영
- Ctrl+S(또는 Cmd+S) 저장, 저장 시 Toast 노출
- 저장하지 않은 탭을 닫으려 할 때 확인 모달(저장 후 닫기 / 저장하지 않고 닫기 / 취소)
- Breadcrumb, Status Bar(Ln/Col, 언어, 인코딩, 저장 상태) 실시간 갱신
- Ctrl+P(Cmd+P) Quick Open — 파일명 검색 후 즉시 오픈
- 미리보기(Mock) 패널
- `<!--/import ` 입력 시 WORKSPACE 경로 자동완성(중첩 폴더까지 연쇄 제안)
- `<!--/cate` 등 메이크샵 전용 태그 자동완성 + 전용 Syntax Highlighting(`makeshop-html` 커스텀 Monaco 언어)
- 반응형 레이아웃(900px 이하에서 Explorer가 오버레이 Drawer로 전환)
- (에디터 툴바) 미리보기 / 저장 버튼을 상단 GNB가 아닌 Breadcrumb 옆 별도 영역으로 분리
- (상단 GNB) 페이지주소 버튼 — SYSTEM 운영 페이지 전체를 Mock URL 목록으로 보여주는 모달. 클릭 시 해당 페이지를 에디터에서 바로 열 수 있고, 개별 URL 복사 가능
- (상단 GNB) 가상태그 버튼 — 현재 활성 탭 파일에서 실제로 적용 가능한 가상태그만 추려 보여주는 모달(파일 카테고리별 매핑은 `src/data/mockFileSystem.js`의 `getApplicableTags`). 파일이 열려있지 않으면 비활성화
- (상단 GNB) 디자인 매뉴얼 버튼 — 전용 매뉴얼 링크가 아직 없어 메이크샵 홈페이지(`https://www.makeshop.co.kr/`)로 새 탭 연결

## 제외 범위 (요청 17번 항목과 동일)

실제 서버 연동, 파일 DB 저장, Git, Terminal, Debugger, Extension Marketplace, 실제 Deploy, 사용자 권한 관리, Version History, 실시간 협업은 포함하지 않았습니다.
