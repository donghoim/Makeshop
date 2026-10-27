/* ==========================================================================
   App — 라우팅 / Meta 비즈니스 공통 레이아웃 / FBE 연동 플로우 / 시나리오 패널
   ========================================================================== */
const App = (function () {
  const appEl = document.getElementById("app");
  const TABS = [
    { key: "home", label: "홈" },
    { key: "connect", label: "연결 관리" },
    { key: "feed", label: "상품 피드" },
    { key: "ads", label: "광고 관리" },
    { key: "shops", label: "Shops 관리" },
  ];
  const Pages = { home: HomePage, connect: ConnectPage, feed: FeedPage, ads: AdsPage, shops: ShopsPage };

  function parseHash() {
    const h = location.hash.replace(/^#/, "") || "/meta/home";
    const [path, qs] = h.split("?");
    const params = {};
    (qs || "").split("&").filter(Boolean).forEach((kv) => {
      const [k, v] = kv.split("=");
      params[k] = decodeURIComponent(v || "");
    });
    return { parts: path.split("/").filter(Boolean), params };
  }
  function go(tab, params) {
    const q = params ? "?" + Object.keys(params).map((k) => k + "=" + encodeURIComponent(params[k])).join("&") : "";
    const next = "#/meta/" + tab + q;
    if (location.hash === next) render();
    else location.hash = next;
  }

  /* ---------------- 공통 마크업 ---------------- */
  function pageHead(title, crumbs) {
    return `<div class="page-head"><h1>${title}<span class="chip-manual">매뉴얼</span></h1><div class="crumbs">${crumbs.map((c) => `<span>${c}</span>`).join("")}</div></div>`;
  }
  function emptyState({ title, desc, btn, note, onClick, fbIcon }) {
    const el = document.createElement("div");
    el.className = "empty-hero";
    el.innerHTML = `
      <div class="empty-hero__logo">${UI.icon.meta.replace('width="56" height="35"', 'width="104" height="65"')}</div>
      <h2>${title}</h2>
      <p>${desc}</p>
      <button class="btn btn--primary btn--xl" type="button">${fbIcon ? '<span class="fb-ic">' + UI.icon.fb + "</span>" : UI.icon.gear}<span>${btn}</span></button>
      <div class="empty-hero__note">${UI.icon.info}<span>${note}</span></div>`;
    el.querySelector("button").addEventListener("click", onClick);
    return el;
  }
  function banner(title, desc) {
    const el = document.createElement("section");
    el.className = "card banner";
    el.innerHTML = `<div><h3 class="banner__title">${title}</h3><p class="banner__desc">${desc}</p></div><button type="button" class="btn btn--dark btn--sm">자세히보기</button>`;
    el.querySelector("button").addEventListener("click", () => UI.toast("가이드/매뉴얼 페이지가 새 탭으로 열립니다. (URL 추후 제공 — 프로토타입 미연결)", "info"));
    return el;
  }
  /** 접기/펼치기 가능한 섹션 카드 */
  function section(title, actionsHtml, bodyHtml, opts) {
    const el = document.createElement("section");
    el.className = "card sec" + (opts && opts.cls ? " " + opts.cls : "");
    el.innerHTML = `
      <div class="sec__head"><h3>${title}</h3><div class="sec__actions">${actionsHtml || ""}<button type="button" class="sec__toggle" aria-label="접기/펼치기" aria-expanded="true">${UI.icon.chevUp}</button></div></div>
      <div class="sec__body">${bodyHtml || ""}</div>`;
    const tg = el.querySelector(".sec__toggle");
    tg.addEventListener("click", () => {
      const c = el.classList.toggle("is-collapsed");
      tg.setAttribute("aria-expanded", String(!c));
    });
    return el;
  }

  /* ---------------- FBE 연동 플로우 ---------------- */
  /** 0단계 개인정보 수집·이용 동의 모달 → 동의 시 Meta Embedded Signup(시뮬레이션) */
  function startFbe() {
    const migration = Store.migrationPending();
    const history = Store.s.consentHistory || [];
    if (!migration && history.some(x => x.version === "2026-10-27")) { openWizard(!Store.s.connected); return; }
    const body = '<p>Meta 비즈니스 연동을 위해 아래 내용을 확인하신 후 동의해 주세요.</p>' + "<details><summary>① 메이크샵 개인정보 수집·이용 동의(필수)</summary><div style=\"white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;padding:12px\">\n메이크샵은 Meta 비즈니스 연동을 위해 아래와 같이 개인정보를 수집·이용합니다.\n\n- 수집·이용 목적: Meta 비즈니스 연동 상태 관리, 상품 피드 전송, 픽셀 설치 및 전환 추적, 연결된 Meta 자산과 광고 성과 정보 표시\n\n| 구분 | 수집 항목 | 이용 목적 | 보유 및 이용 기간 |\n| --- | --- | --- | --- |\n| 저장 | 연동 계정 ID, 연동 토큰 | Meta 연동 상태 확인, 연동 기능 실행 | 연동 해제 시 파기 |\n| 저장 | 제품 카탈로그 ID | 상품을 전송할 카탈로그 지정 | 연동 해제 시 파기 |\n| 저장 | 픽셀 ID, 픽셀 액세스 토큰 | 픽셀 설치, 전환 이벤트 전송 | 픽셀 설정 해제 시 파기 |\n| 저장 | 도메인 인증 코드 | 쇼핑몰 도메인 소유 인증 | 도메인 인증 해제 시 파기 |\n| 조회 | Facebook 계정 정보(이메일 또는 휴대폰번호) | 연결된 계정 표시 | 저장하지 않음(화면 표시 후 즉시 파기) |\n| 조회 | 비즈니스 관리자·Facebook 페이지·Instagram 계정의 ID와 이름 | 연동 자산 상태 표시 | 저장하지 않음(화면 표시 후 즉시 파기) |\n| 조회 | 광고 계정 ID와 계정 상태, 광고 성과(노출수·클릭수·전환수·지출액), 캠페인 목록 | 광고 관리 화면 표시 | 저장하지 않음(화면 표시 후 즉시 파기) |\n\n- 단, 관계 법령에 따라 보존해야 하는 경우 해당 법령에서 정한 기간 동안 보관합니다.\n- 동의를 거부할 권리가 있으며, 거부하시면 Meta 비즈니스 연동 기능을 이용할 수 없습니다.</div></details><details><summary>② 쇼핑몰 정보 제3자 제공 및 국외 이전 동의(필수)</summary><div style=\"white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;padding:12px\">\n메이크샵은 Meta 비즈니스 연동을 위해 아래와 같이 쇼핑몰 정보를 Meta에 제공하며, 이 정보는 국외로 이전됩니다.\n\n| 구분 | 내용 |\n| --- | --- |\n| 제공받는 자 | Meta Platforms, Inc. 및 Meta Platforms Ireland Limited(이하 \"Meta\") |\n| 연락처 | Meta 개인정보처리방침의 문의 채널(https://www.facebook.com/privacy/policy) |\n| 제공 목적 | Facebook·Instagram 상품 노출, 제품 카탈로그 등록 및 동기화, 쇼핑몰 도메인 인증 |\n| 제공 항목 | 쇼핑몰 정보: 쇼핑몰 도메인, 쇼핑몰 아이디(브랜드 정보가 없는 상품은 브랜드 값으로 사용)\n상품 정보: 상품 번호(옵션 상품은 상품번호와 옵션번호 조합), 상품명, 상품 설명, 판매가, 재고 상태(판매 가능·품절), 상품 이미지 URL, 상품 페이지 URL, 브랜드, 상품 분류, 성별·연령대(해당 상품만), 옵션 정보(옵션값, 옵션별 가격·재고 상태) |\n| 이전 국가 | 미국, 아일랜드 |\n| 이전 시기 및 방법 | 연동 시, 상품 등록·수정·삭제 시 정보통신망을 통한 전송(API 호출) |\n| 보유 및 이용 기간 | Meta 이용약관 및 개인정보처리방침에 따릅니다. 연동 해제 시 메이크샵의 제공은 중단됩니다. |\n| 거부 방법 및 효과 | 동의하지 않으시면 체크하지 않고 [취소]를 눌러 주세요. 이 경우 Meta 비즈니스 연동을 이용할 수 없습니다. |</div></details><details><summary>③ 쇼핑몰 이용자 정보 전송 위탁 확인(필수)</summary><div style=\"white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;padding:12px\">\nMeta 비즈니스를 연동하면 쇼핑몰에 Meta 픽셀과 전환 API가 적용되어 쇼핑몰 이용자(회원·비회원 구매자 포함)의 정보가 Meta로 전송됩니다. 이 정보는 상점이 개인정보처리자로서 Meta에 제공하는 정보이며, 메이크샵은 상점의 위탁을 받아 전송을 처리합니다.\n\n| 구분 | 내용 |\n| --- | --- |\n| 제공받는 자 | Meta Platforms, Inc. 및 Meta Platforms Ireland Limited |\n| 연락처 | Meta 개인정보처리방침의 문의 채널(https://www.facebook.com/privacy/policy) |\n| 전송 목적 | 광고를 본 사람과 구매한 사람의 연결(매칭)을 통한 광고 성과 측정, 전환 추적, 광고 최적화 |\n| 위탁받는 자(전송 처리) | (주)커넥트웨이브 |\n| 이전 국가 | 미국, 아일랜드 |\n| 이전 시기 및 방법 | 쇼핑몰 이용자의 행동 이벤트 발생 시마다 정보통신망을 통한 전송(이용자 브라우저의 픽셀 스크립트, 메이크샵 서버의 전환 API) |\n| 보유 및 이용 기간 | Meta 이용약관 및 개인정보처리방침에 따릅니다. 연동 해제 시 메이크샵을 통한 전송은 중단됩니다. |\n| 거부 방법 및 효과 | 확인하지 않으시면 체크하지 않고 [취소]를 눌러 주세요. 이 경우 Meta 비즈니스 연동을 이용할 수 없습니다. |\n\n| 전송 항목 구분 | 항목 | 전송 형태 | 대상 |\n| --- | --- | --- | --- |\n| 행동 정보 | 페이지 조회, 상품 조회, 카테고리 조회, 검색, 장바구니 담기, 관심상품 담기, 주문서 작성, 구매, 회원가입 이벤트와 관련 상품번호·금액 | 원문 | 모든 방문자 |\n| 검색어 | 검색창에 입력한 검색어 | 원문 | 모든 방문자 |\n| 접속 정보 | IP 주소, 브라우저 정보(User-Agent), 방문 페이지 주소, Meta 쿠키(_fbp, _fbc) | 원문 | 모든 방문자 |\n| 방문자 식별값 | 쇼핑몰 아이디와 회원 아이디 조합(비회원은 방문 쿠키) | 암호화(해시) | 모든 방문자 |\n| 회원 아이디 | 회원가입 이벤트 식별값과 이벤트 내용 | 원문 | 가입 회원 |\n| 주문번호 | 구매 이벤트 식별값 | 원문 | 구매자 |\n| 회원 정보 | 이메일, 휴대전화번호, 이름(성·이름), 성별, 생년월일, 거주지(시·도, 우편번호, 국가) | 암호화(해시) | 로그인 회원 |\n| 외부 결제 주문자 정보 | 이름, 전화번호, 주소(시·도), 우편번호, 국가 | 암호화(해시) | 네이버페이·톡체크아웃 구매자(비회원 포함), 외부 결제 전환 추적 '사용' 시 |\n\n운영자 확인 사항:\n\n- 상점은 위 정보를 Meta에 제공하는 개인정보처리자로서, 쇼핑몰 개인정보처리방침에 Meta에 대한 제3자 제공·국외 이전과 행태정보 수집·이용 사항을 반영하고 쇼핑몰 이용자에게 필요한 동의를 받아야 합니다.\n- 상점은 메이크샵이 위 정보를 Meta로 전송하도록 위탁하는 것에 동의합니다.\n- 상점이 필요한 고지·동의를 하지 않아 발생한 문제의 책임은 상점에 있습니다.</div></details><details><summary>유의사항</summary><div style=\"white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;padding:12px\">\n- 연동 과정에서 Facebook 로그인과 Meta 권한 승인 절차가 진행되며, Meta가 처리하는 정보에는 Meta 이용약관과 개인정보처리방침이 적용됩니다.\n- Meta 권한 승인 단계에서 일부 권한을 허용하지 않으면 자산 정보 조회, 상품 피드 전송, 광고 성과 조회 등 일부 기능이 동작하지 않을 수 있습니다.\n- 연동이 완료되면 전송 조건을 충족한 메이크샵 상품이 Meta 카탈로그로 자동 전송됩니다. Meta 카탈로그에 메이크샵 상품과 같은 상품 ID로 직접 등록한 상품이 있으면, 해당 상품의 정보와 상태는 메이크샵 상품 정보로 갱신됩니다. 메이크샵에서 그 상품을 사용안함으로 바꾸거나 삭제하면 Meta 카탈로그에서도 삭제됩니다. 상품 ID가 다른 직접 등록 상품은 변경하거나 삭제하지 않습니다.\n- 연동을 해제하면 메이크샵에서 Meta로의 정보 제공은 중단되지만, 이미 Meta에 전달된 정보의 삭제는 Meta 정책에 따릅니다.\n- 동의를 거부할 권리가 있으며, 거부하시면 Meta 비즈니스 연동 기능(상품 피드, 광고 관리, Shops 관리)을 이용할 수 없습니다. 쇼핑몰 운영 등 다른 메이크샵 서비스 이용에는 제한이 없습니다.</div></details>" +
      '<label class="chk"><input type="checkbox" id="agree-all">아래 내용에 모두 동의합니다.</label>' +
      '<label class="chk"><input type="checkbox" class="required-consent">(필수) 메이크샵 개인정보 수집·이용에 동의합니다.</label>' +
      '<label class="chk"><input type="checkbox" class="required-consent">(필수) 쇼핑몰 정보 제3자 제공 및 국외 이전에 동의합니다.</label>' +
      '<label class="chk"><input type="checkbox" class="required-consent">(필수) 쇼핑몰 이용자 정보의 Meta 전송 위탁 및 운영자 확인 사항을 확인했습니다.</label>';
    const m = UI.modal({ title: "메타 비즈니스 연동 개인정보 수집·이용 및 제공 동의", size: "lg", body,
      footer: '<button class="btn btn--line" id="consent-cancel">취소</button><button class="btn btn--dark" id="consent-ok" disabled>동의하고 시작하기</button>',
      onClose: () => { if (migration || !Store.s.connected) go("connect"); return true; }
    });
    const checks = [...m.el.querySelectorAll('.required-consent')];
    const all = m.el.querySelector('#agree-all'), ok = m.el.querySelector('#consent-ok');
    const sync = () => { all.checked = checks.every(x=>x.checked); ok.disabled = !all.checked; };
    all.addEventListener('change',()=>{checks.forEach(x=>x.checked=all.checked);sync();});
    checks.forEach(x=>x.addEventListener('change',sync));
    m.el.querySelector('#consent-cancel').addEventListener('click',()=>m.close());
    ok.addEventListener('click',()=>{
      if (!checks.every(x=>x.checked)) return;
      Store.s.consentHistory = [...history, {version:"2026-10-27", at:new Date().toISOString(), operator:"prototype-admin", items:[true,true,true]}];
      Store.save(); m.close(true); openWizard(!Store.s.connected);
    });
  }
  function consentBox(id, title, text, open) {
    return `<div class="consent-box ${open ? "is-open" : ""}">
      <div class="consent-box__head"><span>${title}</span><label class="consent-box__toggle switch switch--sm"><input type="checkbox" ${open ? "checked" : ""} aria-label="펼쳐보기"/><i></i><b>펼쳐보기</b></label></div>
      <div class="consent-box__text" id="${id}">${text}</div></div>`;
  }
  /** Meta Embedded Signup 위저드(시뮬레이션). initial=true 최초 연동, false [설정] 재설정 */
  function openWizard(initial) {
    window.MOCK.account.instagramConnected = initial ? true : Store.s.ig;
    FbeOAuth.open({
      onComplete: (sel) => {
        if (initial) {
          if (Store.migrationPending()) Store.completeMigration(sel);
          else Store.connect(sel);
          go("connect");
          UI.toast("Meta 비즈니스 연동이 완료되었습니다.", "success");
          setTimeout(() => ConnectPage.openCategoryMatch(true), 200);
        } else {
          Store.reconfigure(sel);
          render();
          UI.toast("비즈니스 자산 연동 정보가 갱신되었습니다.", "success");
        }
      },
      onCancel: () => {
        if (Store.migrationPending()) { go("connect"); UI.toast("재연동을 완료하지 않았습니다. 기존 연결과 정보는 유지됩니다.", "warn"); return; }
        UI.toast(initial ? "Meta 연동이 완료되지 않았습니다. 연동 정보는 저장되지 않으며 연동 가이드 화면을 유지합니다." : "재설정을 취소하여 기존 연결 정보를 유지합니다.", "warn");
      },
    });
  }
  /** 미연동 탭의 [비즈니스 자산 설정하기] — 연결 관리 탭 이동 직후 FBE(동의 팝업) 자동 노출 */
  function gotoConnectAndStart() {
    go("connect");
    setTimeout(startFbe, 150);
  }

  /* ---------------- 렌더 ---------------- */
  function render() {
    UI.closeInfo();
    UI.closeAllDropdowns();
    const { parts, params } = parseHash();
    appEl.innerHTML = "";
    if (parts[0] === "channel") {
      lastSurface = "channel";
      appEl.appendChild(ChannelList());
      window.scrollTo(0, 0);
      return;
    }
    const entry = lastSurface !== "meta";
    lastSurface = "meta";
    if (entry && Store.migrationPending()) queueMicrotask(() => enterMigration());
    const tab = Pages[parts[1]] ? parts[1] : "home";
    appEl.insertAdjacentHTML("beforeend", pageHead("Meta 비즈니스", ["부가서비스", "부가서비스", "채널", "Meta 비즈니스"]));
    const wrap = document.createElement("div");
    wrap.className = "meta-wrap";
    wrap.innerHTML = `<nav class="subnav card" aria-label="Meta 비즈니스 메뉴"><div class="subnav__logo">${UI.icon.meta}</div><ul>${TABS.map(
      (t) => `<li><a href="#/meta/${t.key}" class="${t.key === tab ? "is-active" : ""}">${t.label}</a></li>`
    ).join("")}</ul></nav><div class="meta-main" id="meta-main"></div>`;
    appEl.appendChild(wrap);
    Pages[tab].render(wrap.querySelector("#meta-main"), params);
    INFO.bind(appEl);
  }
  let lastHash = "";
  let lastSurface = null, entering = false;
  async function enterMigration() {
    if (entering || !Store.migrationPending()) return;
    entering = true;
    const confirmed = await UI.alert("페이스북 연동 기능이 Meta 비즈니스로 업그레이드되었습니다. 약관에 동의한 후 연동을 진행해 주세요.");
    if (confirmed && Store.migrationPending()) {
      lastSurface = "meta";
      go("connect");
      startFbe();
    }
    entering = false;
  }
  window.addEventListener("hashchange", () => {
    const base = location.hash.split("?")[0];
    render();
    if (base !== lastHash) window.scrollTo(0, 0);
    lastHash = base;
  });

  /* ---------------- 3-1 채널 목록 ---------------- */
  function ChannelList() {
    const el = document.createElement("div");
    const cards = [
      ["N", "#03c75a", "네이버 연동 설정", "네이버 서비스 연동 설정 및 네이버 광고 유입 관련 설정을 진행할 수 있습니다."],
      ["N+", "#03c75a", "네이버 쇼핑", "네이버 이용자와 네이버 쇼핑에 입점한 쇼핑몰 및 스마트스토어간의 편리한 연결과 정보를 제공하는 쇼핑 포털 서비스입니다."],
      ["N", "#03c75a", "네이버 앵커", "네이버 메인에 노출되는 고유 영역으로, 다양한 방문자에게 매출 및 브랜드 경쟁력을 극대화하는 광고입니다."],
      ["pay", "#03c75a", "네이버페이 CPS", "네이버페이 혜택광고 영역을 통해 쇼핑몰 배너를 노출하고 링크를 통해 쇼핑몰 방문 또는 결제 시 포인트 리워드를 지급하는 결제 유도형 광고상품입니다."],
      ["D", "#1f2b4d", "다음/제휴마케팅", "쇼핑몰 홍보에 가장 효과적인 키워드 광고 '다음클릭스'와 기타 제휴 마케팅 설정을 관리할 수 있습니다."],
      ["D", "#1f2b4d", "다음 앵커", "카카오의 특화된 영역을 통해 카카오의 수많은 소비자와 만날 수 있는 쇼핑광고이며 매출 및 브랜드 인지도 상승, 구매 전환에 최적화된 광고입니다."],
      ["±", "#f6a04d", "가격비교사이트 등록", "가격 비교 사이트에 쇼핑몰 상품을 등록 시, 필요한 상품 DB 링크 주소를 제공하는 기능입니다."],
      ["k", "#fee500", "카카오 연동 설정", "카카오 채널, 톡 체크아웃과 같은 카카오 비즈니스를 간편하게 연결하고 관리할 수 있습니다."],
      ["G", "#4285f4", "구글 쇼핑 상품 피드", "광고 문구를 작성하거나 키워드를 선택할 필요 없이 상품 피드 기반 자동 완성되는 상품으로 구글 프리미엄 영역에서 진행합니다."],
      ["meta", "#0081fb", "Meta 비즈니스", "Meta 비즈니스 연동을 통해 연결 관리, 상품 피드, 광고 관리, Shops 관리 기능을 이용할 수 있습니다.", true],
      ["V", "#17c3b2", "V파인더", "쇼핑몰 방문자의 행동 데이터를 분석해 맞춤 상품을 추천하는 개인화 마케팅 서비스입니다."],
      ["⌘", "#5cb85c", "네트워크 광고", "다양한 제휴 매체 네트워크에 쇼핑몰 광고를 노출할 수 있는 광고 상품입니다."],
    ];
    el.innerHTML =
      pageHead("채널", ["부가서비스", "부가서비스", "채널"]) +
      `<div class="ch-grid">${cards
        .map(
          (c) => `<a class="ch-card ${c[4] ? "is-new" : "is-dim"}" ${c[4] ? 'href="#/meta/home"' : ""}>
          <span class="ch-ic" style="background:${c[0] === "meta" ? "#fff" : c[1]};color:${c[1] === "#fee500" ? "#222" : "#fff"}">${c[0] === "meta" ? UI.icon.meta.replace('width="56" height="35"', 'width="30" height="19"') : c[0]}</span>
          <strong>${c[2]}${c[4] ? '<em class="new-badge">NEW</em>' : ""}</strong><p>${c[3]}</p></a>`
        )
        .join("")}</div>`;
    el.querySelectorAll(".ch-card.is-dim").forEach((a) => a.addEventListener("click", () => UI.toast("프로토타입 범위 밖의 메뉴입니다. Meta 비즈니스 카드를 선택해 주세요.", "info")));
    return el;
  }

  /* ---------------- 시나리오 패널 (Drawer) ---------------- */
  const drawerEl = document.getElementById("scn-drawer");
  function paintDrawer() {
    const s = Store.s;
    const sel = (name, val, opts) => `<select data-k="${name}">${opts.map((o) => `<option value="${o[0]}" ${String(val) === String(o[0]) ? "selected" : ""}>${o[1]}</option>`).join("")}</select>`;
    drawerEl.innerHTML = `
      <div class="drawer__head"><h3>프로토타입 시나리오 패널</h3><button type="button" class="drawer__close" aria-label="닫기">×</button></div>
      <div class="drawer__body">
        <p class="drawer__hint">QA·리뷰용 상태 전환 도구입니다. 실제 서비스 화면에는 존재하지 않습니다.</p>
        <h4>연동 상태 프리셋</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="reset-new">미연동(최초 진입)</button><button type="button" class="btn btn--line btn--sm" data-act="reset-conn">연동 완료(운영 중)</button></div>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="reset-legacy">기존 상점(재연동 전)</button></div>
        <h4>연결 관리</h4>
        <label>Instagram 연결 ${sel("ig", s.ig, [[true, "연결됨"], [false, "미연결(위저드 스킵)"]])}</label>
        <label>자산 조회 결과 ${sel("assetError", s.assetError, [["none", "정상"], ["page", "페이지 조회 실패(확인불가)"], ["pixel", "픽셀 조회 실패(확인불가)"]])}</label>
        <label>도메인 인증 ${sel("domainVerified", s.domainVerified, [[false, "미인증(안내 노출)"], [true, "인증 완료(안내 미노출)"]])}</label>
        <label>연결 해제 결과 ${sel("unlinkResult", s.unlinkResult, [["success", "성공"], ["network", "실패 - 통신·서버 오류"], ["auth", "실패 - 인증·권한 오류"]])}</label>
        <h4>상품 피드</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="sync">Meta 심사 결과 동기화 (검토중→결과)</button><button type="button" class="btn btn--line btn--sm" data-act="queue">전송 큐 지금 처리 (반영대기→검토중)</button><button type="button" class="btn btn--line btn--sm" data-act="catalog">카탈로그 변경(재설정) 시뮬레이션</button></div>
        <label>전송 큐 자동 처리 ${sel("queueAuto", s.queueAuto !== false, [[true, "사용 (반영 5초 후 자동 전송)"], [false, "일시정지 (반영대기 유지)"]])}</label>
        <h4>광고 관리</h4>
        <label>광고 계정 상태 ${sel("adStatus", s.ads.status, ["활성", "차단", "비활성", "미결제", "펜딩"].map((x) => [x, x]))}</label>
        <label>결제 방식 ${sel("billing", s.ads.billing, [["선불", "선불"], ["후불", "후불"]])}</label>
        <label>주문형 네이버페이+공통 인증키 ${sel("prNaver", s.prereq.naver, [[true, "설정됨"], [false, "미설정"]])}</label>
        <label>카카오 톡 체크아웃 연동 ${sel("prKakao", s.prereq.kakao, [[true, "연동됨"], [false, "미연동"]])}</label>
        <h4>데이터</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="clear">저장 데이터 전체 초기화</button></div>
      </div>`;
    drawerEl.querySelector(".drawer__close").addEventListener("click", () => UI.drawer(drawerEl, false));
    drawerEl.querySelectorAll("select[data-k]").forEach((x) =>
      x.addEventListener("change", () => {
        const v = x.value === "true" ? true : x.value === "false" ? false : x.value;
        const k = x.dataset.k;
        if (k === "adStatus") s.ads.status = v;
        else if (k === "billing") s.ads.billing = v;
        else if (k === "prNaver") { s.prereq.naver = v; if (!v) s.ads.naver = "off"; }
        else if (k === "prKakao") { s.prereq.kakao = v; if (!v) s.ads.kakao = "off"; }
        else s[k] = v;
        Store.save();
        if (k === "queueAuto" && v) Store.scheduleQueue();
        render();
        UI.toast("시나리오 값이 변경되었습니다.", "info");
      })
    );
    drawerEl.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => {
        const a = b.dataset.act;
        if (a === "reset-legacy") { Store.reset("legacy"); location.hash = "#/channel"; render(); UI.drawer(drawerEl, false); }
        if (a === "reset-new") { Store.reset("new"); go("home"); }
        if (a === "reset-conn") { Store.reset("connected"); go("home"); }
        if (a === "sync") {
          if (!Store.s.connected) return UI.toast("연동 완료 상태에서만 사용할 수 있습니다.", "warn");
          const n = Store.syncMeta();
          UI.toast(n ? `검토중 상품 ${n}건의 Meta 처리 결과가 반영되었습니다.` : "검토중 상태의 상품이 없습니다.", "info");
          render();
        }
        if (a === "queue") {
          if (!Store.s.connected) return UI.toast("연동 완료 상태에서만 사용할 수 있습니다.", "warn");
          const n = Store.processQueue();
          UI.toast(n ? `반영대기 상품 ${n}건이 Meta로 전송되어 검토중으로 바뀌었습니다.` : "반영대기 상태의 상품이 없습니다.", "info");
          render();
        }
        if (a === "catalog") {
          if (!Store.s.connected) return UI.toast("연동 완료 상태에서만 사용할 수 있습니다.", "warn");
          Store.changeCatalog();
          UI.toast("카탈로그가 변경되어 기존 상품 피드 상태를 초기화하고 전송 대상 상품을 반영대기로 다시 등록했습니다.", "info");
          render();
        }
        if (a === "clear") {
          try { localStorage.clear(); } catch (e) {}
          Store.reset("new");
          go("home");
        }
        paintDrawer();
      })
    );
  }
  document.getElementById("scn-open").addEventListener("click", () => {
    paintDrawer();
    UI.drawer(drawerEl, true);
  });
  document.getElementById("drawer-dim").addEventListener("click", () => UI.drawer(drawerEl, false));

  setTimeout(() => {
    render();
    lastHash = location.hash.split("?")[0];
  }, 0);

  return { go, render, startFbe, openWizard, gotoConnectAndStart, emptyState, banner, section };
})();
