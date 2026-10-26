/* ==========================================================================
   App — 마케팅 > 마케팅 채널 관리 셸 / 라우팅 / Meta 탭(FBE) / 시나리오 패널
   - 1단 탭: 통합 현황 | 통합 상품 피드 | Meta | Google | TikTok (POL-002)
   - 탭·하위 탭 위치는 URL(hash)에 남긴다. 잘못된 값이면 통합 현황 (POL-004)
   ========================================================================== */
const App = (function () {
  const appEl = document.getElementById("app");
  const lnbEl = document.getElementById("lnb-menu");
  const CH_TABS = [
    { key: "overview", label: "통합 현황", href: "#/mkt/overview" },
    { key: "feed", label: "통합 상품 피드", href: "#/mkt/feed" },
    { key: "meta", label: "Meta", href: "#/meta/home" },
    { key: "google", label: "Google", href: "#/google/home" },
    { key: "tiktok", label: "TikTok", href: "#/tiktok" },
  ];
  const META_TABS = [
    { key: "home", label: "홈" },
    { key: "connect", label: "연결 관리" },
    { key: "feed", label: "상품 피드" },
    { key: "ads", label: "광고 관리" },
    { key: "shops", label: "Shops 관리" },
  ];
  const MetaPages = { home: HomePage, connect: ConnectPage, feed: FeedPage, ads: AdsPage, shops: ShopsPage };

  // 화면정의서(HTML)에 내장될 때는 location.hash 대신 SPEC_MODE.hash로 라우팅한다
  const curHash = () => (window.SPEC_MODE ? window.SPEC_MODE.hash : location.hash);
  function parseHash() {
    const h = curHash().replace(/^#/, "") || "/mkt/overview";
    const [path, qs] = h.split("?");
    const params = {};
    (qs || "").split("&").filter(Boolean).forEach((kv) => {
      const [k, v] = kv.split("=");
      params[k] = decodeURIComponent(v || "");
    });
    return { parts: path.split("/").filter(Boolean), params };
  }
  function nav(hash) {
    if (window.SPEC_MODE) { window.SPEC_MODE.hash = hash; render(); return; }
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  /** Meta 페이지 호환: App.go(tab) = Meta 하위 탭 이동 */
  function go(tab, params) {
    const q = params ? "?" + Object.keys(params).map((k) => k + "=" + encodeURIComponent(params[k])).join("&") : "";
    nav("#/meta/" + tab + q);
  }

  /* ---------------- 공통 마크업 ---------------- */
  function pageHead(crumbs) {
    return `<div class="page-head"><h1>마케팅 채널 관리<span class="chip-manual">매뉴얼</span></h1><div class="crumbs">${crumbs.map((c) => `<span>${c}</span>`).join("")}</div></div>`;
  }
  function emptyState({ title, desc, btn, note, onClick, fbIcon, logo, btnIcon }) {
    const el = document.createElement("div");
    el.className = "empty-hero";
    el.innerHTML = `
      <div class="empty-hero__logo">${logo || UI.icon.meta.replace('width="56" height="35"', 'width="104" height="65"')}</div>
      <h2>${title}</h2>
      <p>${desc}</p>
      <button class="btn btn--primary btn--xl" type="button">${fbIcon ? '<span class="fb-ic">' + UI.icon.fb + "</span>" : btnIcon || UI.icon.gear}<span>${btn}</span></button>
      ${note ? `<div class="empty-hero__note">${UI.icon.info}<span>${note}</span></div>` : ""}`;
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
  function section(title, actionsHtml, bodyHtml, opts) {
    const el = document.createElement("section");
    el.className = "card sec" + (opts && opts.cls ? " " + opts.cls : "");
    el.innerHTML = `
      <div class="sec__head"><h3>${title}</h3><div class="sec__actions">${actionsHtml || ""}${opts && opts.noToggle ? "" : `<button type="button" class="sec__toggle" aria-label="접기/펼치기" aria-expanded="true">${UI.icon.chevUp}</button>`}</div></div>
      <div class="sec__body">${bodyHtml || ""}</div>`;
    const tg = el.querySelector(".sec__toggle");
    if (tg) tg.addEventListener("click", () => {
      const c = el.classList.toggle("is-collapsed");
      tg.setAttribute("aria-expanded", String(!c));
    });
    return el;
  }

  /* ---------------- Meta FBE 연동 (Meta 프로토타입 v2.1과 동일) ---------------- */
  function startFbe() {
    const body = `
      <div class="consent">
        <p class="consent__intro">메이크샵 Meta 비즈니스 기능 이용을 위해 아래와 같이 정보가 Meta에 제공되며,<br>메이크샵이 연동 관리를 위해 일부 정보를 수집합니다. 내용을 확인하신 후 동의해 주세요.</p>
        ${consentBox("c1", "개인정보 및 쇼핑몰 정보 제3자 제공 동의(필수)", `제공받는 자: Meta Platforms, Inc. 및 Meta Platforms Ireland Limited<br>제공 목적: 페이스북·인스타그램 채널 상품 연동, 제품 카탈로그 생성 및 동기화, 광고 성과 측정 및 전환 추적<br>제공 항목: 쇼핑몰 도메인, 상품 정보(상품명·가격·이미지·재고·카테고리), 구매 전환 이벤트 정보<br>보유 및 이용 기간: Meta 개인정보처리방침에 따름`, false)}
        ${consentBox("c2", "개인정보 수집·이용 동의 (메이크샵)", `수집 항목: Facebook 계정 연동 토큰, 비즈니스 관리자 ID, Facebook 페이지 ID, Instagram 계정 ID, 광고 계정 ID, 픽셀 ID, 제품 카탈로그 ID, 광고 성과 데이터<br>수집 목적: Meta 비즈니스 연동 상태 관리, 상품 피드 동기화, 광고 성과 정보 제공<br>보유 및 이용 기간: 연동 해제 또는 회원 탈퇴 시까지`, true)}
        <label class="chk"><input type="checkbox" id="agree1" /><span><em>(필수)</em>위 제3자 제공 및 국외 이전에 동의합니다.</span></label>
        <label class="chk"><input type="checkbox" id="agree2" /><span><em>(필수)</em>위 개인정보 수집 및 이용에 동의합니다.</span></label>
      </div>`;
    const m = UI.modal({ title: "페이스북 채널 개인정보 수집 및 이용 동의", size: "md", body, footer: '<button class="btn btn--dark btn--lg" id="consent-ok" type="button">확인</button>' });
    m.el.querySelectorAll(".consent-box__toggle input").forEach((t) => t.addEventListener("change", () => t.closest(".consent-box").classList.toggle("is-open", t.checked)));
    m.el.querySelector("#consent-ok").addEventListener("click", async () => {
      if (!(m.el.querySelector("#agree1").checked && m.el.querySelector("#agree2").checked)) return UI.alert("필수 동의 항목에 모두 동의해 주세요.");
      m.close(true);
      openWizard(true);
    });
  }
  function consentBox(id, title, text, open) {
    return `<div class="consent-box ${open ? "is-open" : ""}">
      <div class="consent-box__head"><span>${title}</span><label class="consent-box__toggle switch switch--sm"><input type="checkbox" ${open ? "checked" : ""} aria-label="펼쳐보기"/><i></i><b>펼쳐보기</b></label></div>
      <div class="consent-box__text" id="${id}">${text}</div></div>`;
  }
  function openWizard(initial) {
    window.MOCK.account.instagramConnected = initial ? true : Store.s.ig;
    FbeOAuth.open({
      onComplete: (sel) => {
        if (initial) {
          Store.connect(sel);
          go("connect");
          UI.toast("Meta 비즈니스 연동이 완료되었습니다.", "success");
          setTimeout(() => ConnectPage.openCategoryMatch(true), 200);
        } else {
          Store.reconfigure(sel);
          render();
          UI.toast("비즈니스 자산 연동 정보가 갱신되었습니다.", "success");
        }
      },
      onCancel: () => UI.toast(initial ? "Meta 연동이 완료되지 않았습니다. 연동 정보는 저장되지 않으며 연동 가이드 화면을 유지합니다." : "재설정을 취소하여 기존 연결 정보를 유지합니다.", "warn"),
    });
  }
  function gotoConnectAndStart() {
    go("connect");
    setTimeout(startFbe, 150);
  }

  /* ---------------- 렌더 ---------------- */
  function paintLnb() {
    // 메뉴 권한이 없으면 메뉴를 숨기지 않고 비활성화(클릭 불가)로 표시 (POL-007)
    lnbEl.innerHTML = GStore.s.noPerm
      ? '<li>마케팅 홈</li><li>마케팅 캠페인</li><li class="is-disabled" aria-disabled="true" title="메뉴 권한이 없습니다.">마케팅 채널 관리</li>'
      : '<li>마케팅 홈</li><li>마케팅 캠페인</li><li class="is-active"><a href="#/mkt/overview">마케팅 채널 관리</a><span class="star">☆</span></li>';
  }
  function render() {
    UI.closeInfo();
    UI.closeAllDropdowns();
    paintLnb();
    let { parts, params } = parseHash();
    appEl.innerHTML = "";

    // 메뉴 권한 없음: LNB 메뉴 비활성화. URL 직접 접근은 메이크샵 관리자 공통 권한 처리(목업에서는 안내만 표시) (POL-007)
    if (GStore.s.noPerm) {
      appEl.insertAdjacentHTML("beforeend", `<section class="card noperm"><h2>마케팅 채널 관리 메뉴 권한이 없는 운영자</h2><p>LNB의 마케팅 채널 관리 메뉴가 비활성화되어 들어올 수 없습니다.<br>URL로 직접 접근하는 경우는 메이크샵 관리자 공통 권한 처리를 따릅니다. (목업 안내 화면)</p></section>`);
      return;
    }
    // 삭제된 기존 메뉴 URL → 새 화면으로 이동 (POL-010)
    if (parts[0] === "legacy") {
      const to = parts[1] === "google-feed" ? "#/google/feed" : "#/meta/home";
      UI.toast(`삭제된 기존 메뉴 URL입니다. 마케팅 채널 관리 ${parts[1] === "google-feed" ? "Google > 상품피드" : "Meta > 홈"}으로 이동합니다.`, "info");
      location.replace(to);
      return;
    }
    let chKey = parts[0] === "mkt" ? (parts[1] === "feed" ? "feed" : parts[1] === "overview" ? "overview" : null) : ["meta", "google", "tiktok"].includes(parts[0]) ? parts[0] : null;
    if (!chKey) { chKey = "overview"; parts = ["mkt", "overview"]; }
    const ch = CH_TABS.find((t) => t.key === chKey);

    let sub = null;
    if (chKey === "meta") sub = META_TABS.find((t) => t.key === parts[1]) || META_TABS[0];
    if (chKey === "google") sub = GooglePages.TABS.find((t) => t.key === parts[1]) || GooglePages.TABS[0];
    const crumbs = ["마케팅", "마케팅 채널 관리", ch.label].concat(sub ? [sub.label] : []);
    appEl.insertAdjacentHTML("beforeend", pageHead(crumbs));
    appEl.insertAdjacentHTML(
      "beforeend",
      `<nav class="ctabs" aria-label="마케팅 채널 관리 탭">${CH_TABS.map((t) => `<a href="${t.href}" class="ctab ${t.key === chKey ? "is-active" : ""}">${t.label}</a>`).join("")}</nav>`
    );
    const body = document.createElement("div");
    body.className = "ctab-body";
    appEl.appendChild(body);

    if (chKey === "overview") MktOverview.render(body);
    else if (chKey === "feed") MktFeed.render(body, params);
    else if (chKey === "tiktok") MktTiktok.render(body);
    else if (chKey === "meta") {
      const wrap = channelWrap(UI.icon.meta, "Meta", META_TABS.map((t) => ({ href: "#/meta/" + t.key, label: t.label, on: t.key === sub.key })));
      body.appendChild(wrap);
      MetaPages[sub.key].render(wrap.querySelector(".meta-main"), params);
    } else if (chKey === "google") {
      const wrap = channelWrap(UI.icon.google, "Google", GooglePages.TABS.map((t) => ({ href: "#/google/" + t.key, label: t.label, on: t.key === sub.key })));
      body.appendChild(wrap);
      GooglePages.render(sub.key, wrap.querySelector(".meta-main"), params);
    }
    INFO.bind(appEl);
  }
  function channelWrap(logo, name, items) {
    const wrap = document.createElement("div");
    wrap.className = "meta-wrap";
    wrap.innerHTML = `<nav class="subnav card" aria-label="${name} 메뉴"><div class="subnav__logo">${logo}</div><ul>${items.map((t) => `<li><a href="${t.href}" class="${t.on ? "is-active" : ""}">${t.label}</a></li>`).join("")}</ul></nav><div class="meta-main"></div>`;
    return wrap;
  }
  let lastHash = "";
  window.addEventListener("hashchange", () => {
    const base = location.hash.split("?")[0];
    render();
    if (base !== lastHash) window.scrollTo(0, 0);
    lastHash = base;
  });

  /* ---------------- 시나리오 패널 (Drawer) ---------------- */
  const drawerEl = document.getElementById("scn-drawer");
  function paintDrawer() {
    const g = GStore.s;
    const sel = (name, val, opts) => `<select data-k="${name}">${opts.map((o) => `<option value="${o[0]}" ${String(val) === String(o[0]) ? "selected" : ""}>${o[1]}</option>`).join("")}</select>`;
    drawerEl.innerHTML = `
      <div class="drawer__head"><h3>프로토타입 시나리오 패널</h3><button type="button" class="drawer__close" aria-label="닫기">×</button></div>
      <div class="drawer__body">
        <p class="drawer__hint">QA·리뷰용 상태 전환 도구입니다. 실제 서비스 화면에는 존재하지 않습니다.</p>
        <h4>전체 프리셋</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="all-on">Meta·Google 모두 연동(운영 중)</button><button type="button" class="btn btn--line btn--sm" data-act="all-off">모두 미연동(최초 진입)</button></div>
        <h4>Meta</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="meta-on">Meta 연동 완료</button><button type="button" class="btn btn--line btn--sm" data-act="meta-off">Meta 미연동</button><button type="button" class="btn btn--line btn--sm" data-act="meta-queue">Meta 전송 큐 처리</button><button type="button" class="btn btn--line btn--sm" data-act="meta-sync">Meta 심사 결과 동기화</button></div>
        <h4>Google 연결</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="g-full">전체 연결 완료</button><button type="button" class="btn btn--line btn--sm" data-act="g-account">Google 계정만 연결</button><button type="button" class="btn btn--line btn--sm" data-act="g-none">Google 미연결</button></div>
        <label>Google 계정 ${sel("account", g.account, [["none", "미연결"], ["connected", "연결됨"], ["reauth", "재인증 필요(인증 만료)"]])}</label>
        <label>Merchant Center ${sel("mc", g.mc, [["none", "미연결"], ["connected", "연결됨"], ["reauth", "재인증 필요(권한 오류)"]])}</label>
        <label>Merchant Center 계정 정지 ${sel("mcSuspended", g.mcSuspended, [[false, "정상"], [true, "계정 정지됨"]])}</label>
        <label>Google Ads ${sel("ads", g.ads, [["none", "미연결"], ["connected", "연결됨"], ["reauth", "재인증 필요(AuthorizationError)"]])}</label>
        <label>Google Ads의 MC 연결 단계 ${sel("mcLink", g.mcLink, [["none", "Google Ads만 연결"], ["detected", "MC 연결 감지(메이크샵 미연동)"], ["linked", "MC 연동 완료"]])}</label>
        <h4>Google 상품 피드</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="g-queue">전송 큐 지금 처리 (반영대기→검토중)</button><button type="button" class="btn btn--line btn--sm" data-act="g-sync">Google 심사 결과 동기화 (검토중→결과)</button></div>
        <label>전송 큐 자동 처리 ${sel("queueAuto", g.queueAuto !== false, [[true, "사용 (반영 5초 후 자동 전송)"], [false, "일시정지 (반영대기 유지)"]])}</label>
        <h4>권한·기존 메뉴</h4>
        <label>마케팅 채널 관리 메뉴 권한 ${sel("noPerm", g.noPerm, [[false, "있음"], [true, "없음(메뉴 비활성화)"]])}</label>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="legacy-google">기존 구글 상품 피드 URL 접속</button><button type="button" class="btn btn--line btn--sm" data-act="legacy-meta">기존 Meta 메뉴 URL 접속</button></div>
        <h4>데이터</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="clear">저장 데이터 전체 초기화</button></div>
      </div>`;
    drawerEl.querySelector(".drawer__close").addEventListener("click", () => UI.drawer(drawerEl, false));
    drawerEl.querySelectorAll("select[data-k]").forEach((x) =>
      x.addEventListener("change", () => {
        const v = x.value === "true" ? true : x.value === "false" ? false : x.value;
        const k = x.dataset.k;
        if (k === "failMeta") g.apiFail.meta = v;
        else if (k === "failGoogle") g.apiFail.google = v;
        else if (k === "mc" && v === "connected" && !g.mcAccount) GStore.connectMc(window.GMOCK.merchantCandidates[0]);
        else if (k === "ads" && v === "connected" && !g.adsAccount) GStore.connectAds(window.GMOCK.adsAccounts[0]);
        else g[k] = v;
        if (k === "mc" && v === "none") GStore.disconnectMc();
        if (k === "ads" && v === "none") GStore.disconnectAds();
        GStore.save();
        if (k === "queueAuto" && v) GStore.scheduleQueue();
        render();
        paintDrawer();
        UI.toast("시나리오 값이 변경되었습니다.", "info");
      })
    );
    drawerEl.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => {
        const a = b.dataset.act;
        if (a === "all-on") { Store.reset("connected"); GStore.reset("full"); nav("#/mkt/overview"); }
        if (a === "all-off") { Store.reset("new"); GStore.reset("none"); nav("#/mkt/overview"); }
        if (a === "meta-on") { Store.reset("connected"); render(); }
        if (a === "meta-off") { Store.disconnect(); render(); }
        if (a === "meta-queue") { const n = Store.processQueue(); UI.toast(n ? `Meta 반영대기 ${n}건 전송 → 검토중` : "Meta 반영대기 상품이 없습니다.", "info"); render(); }
        if (a === "meta-sync") { const n = Store.syncMeta(); UI.toast(n ? `Meta 검토중 ${n}건 결과 반영` : "Meta 검토중 상품이 없습니다.", "info"); render(); }
        if (a === "g-full") { GStore.reset("full"); render(); }
        if (a === "g-account") { GStore.reset("account"); render(); }
        if (a === "g-none") { GStore.reset("none"); render(); }
        if (a === "g-queue") {
          if (GStore.queueBlocked()) UI.toast("재인증이 필요해 전송 큐가 멈춰 있습니다(POL-059).", "warn");
          else { const n = GStore.processQueue(); UI.toast(n ? `반영대기 ${n}건이 Merchant Center로 전송되어 검토중으로 바뀌었습니다.` : "반영대기 상품이 없습니다.", "info"); }
          render();
        }
        if (a === "g-sync") { const n = GStore.syncGoogle(); UI.toast(n ? `검토중 ${n}건의 Google 판정 결과가 반영되었습니다.` : "검토중 상품이 없습니다.", "info"); render(); }
        if (a === "legacy-google") { UI.drawer(drawerEl, false); location.hash = "#/legacy/google-feed"; }
        if (a === "legacy-meta") { UI.drawer(drawerEl, false); location.hash = "#/legacy/meta"; }
        if (a === "clear") {
          try { localStorage.clear(); } catch (e) {}
          Store.reset("connected");
          GStore.reset("full");
          nav("#/mkt/overview");
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

  return { go, nav, render, startFbe, openWizard, gotoConnectAndStart, emptyState, banner, section };
})();
