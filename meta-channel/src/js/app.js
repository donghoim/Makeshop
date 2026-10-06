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
    const body = `
      <div class="consent">
        <p class="consent__intro">메이크샵 Meta 비즈니스 기능 이용을 위해 아래와 같이 정보가 Meta에 제공되며,<br>메이크샵이 연동 관리를 위해 일부 정보를 수집합니다. 내용을 확인하신 후 동의해 주세요.</p>
        ${consentBox("c1", "개인정보 및 쇼핑몰 정보 제3자 제공 동의(필수)", `제공받는 자: Meta Platforms, Inc. 및 Meta Platforms Ireland Limited (이하 "Meta") (연락처: Meta 개인정보처리방침 내 문의 채널, https://www.facebook.com/privacy/policy)<br>제공 목적: 페이스북·인스타그램 채널 상품 연동, 제품 카탈로그 생성 및 동기화, 광고 성과 측정 및 전환 추적<br>제공 항목: 쇼핑몰 도메인, 상품 정보(상품명·가격·이미지·재고·카테고리), 구매 전환 이벤트 정보(주문번호, 결제금액, 해시 처리된 구매자 식별 정보)<br>보유 및 이용 기간: Meta 개인정보처리방침에 따름<br>국외 이전: 미국(Meta Platforms, Inc.) / 아일랜드(Meta Platforms Ireland Limited), 연동 시 정보통신망을 통해 수시 전송`, false)}
        ${consentBox("c2", "개인정보 수집·이용 동의 (메이크샵)", `수집 항목: Facebook 계정 연동 토큰, 비즈니스 관리자 ID, Facebook 페이지 ID, Instagram 계정 ID, 광고 계정 ID 및 계정 상태, 픽셀 ID, 제품 카탈로그 ID, 광고 성과 데이터(노출수, 클릭수, 전환수, 지출액 등)<br>수집 목적: Meta 비즈니스 연동 상태 관리, 상품 피드 동기화, 광고 성과 정보 제공<br>보유 및 이용 기간: 연동 해제 또는 회원 탈퇴 시까지 (단, 관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보존)`, true)}
        <div class="consent__notice">
          <h4>유의사항</h4>
          <ul>
            <li>연동 과정에서 Facebook 로그인 및 Meta 측 권한 승인 절차가 진행되며, Meta가 처리하는 정보에는 Meta 이용약관 및 개인정보처리방침이 적용됩니다.</li>
            <li>Meta 권한 승인 단계에서 일부 권한을 허용하지 않을 경우, 도메인 인증 상태 확인, 카탈로그 동기화, 광고 성과 조회 등 일부 기능이 정상 동작하지 않을 수 있습니다.</li>
            <li>전환 추적 정보에는 쇼핑몰 이용자(구매자)의 개인정보가 포함될 수 있습니다. 운영자께서는 자체 개인정보처리방침에 Meta에 대한 제3자 제공 및 국외 이전 사항을 반영하고, 이용자의 동의를 확보하실 책임이 있습니다.</li>
            <li>연동 해제 시 메이크샵에서 Meta로의 정보 제공은 중단되나, 이미 Meta에 전달된 정보의 삭제는 Meta 정책에 따릅니다.</li>
            <li>동의를 거부할 권리가 있으며, 거부 시 Meta 비즈니스 연동 기능(상품 피드, 광고 관리 등)을 이용할 수 없습니다. 쇼핑몰 운영 등 기본 서비스 이용에는 제한이 없습니다.</li>
          </ul>
        </div>
        <label class="chk"><input type="checkbox" id="agree1" /><span><em>(필수)</em>위 제3자 제공 및 국외 이전에 동의합니다.</span></label>
        <label class="chk"><input type="checkbox" id="agree2" /><span><em>(필수)</em>위 개인정보 수집 및 이용에 동의합니다.</span></label>
      </div>`;
    const m = UI.modal({ title: "페이스북 채널 개인정보 수집 및 이용 동의", size: "md", body, footer: '<button class="btn btn--dark btn--lg" id="consent-ok" type="button">확인</button>' });
    m.el.querySelectorAll(".consent-box__toggle input").forEach((t) =>
      t.addEventListener("change", () => t.closest(".consent-box").classList.toggle("is-open", t.checked))
    );
    m.el.querySelector("#consent-ok").addEventListener("click", async () => {
      if (!(m.el.querySelector("#agree1").checked && m.el.querySelector("#agree2").checked)) {
        await UI.alert("필수 동의 항목에 모두 동의해 주세요.");
        return;
      }
      m.close(true);
      openWizard(true);
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
      onCancel: () => {
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
      appEl.appendChild(ChannelList());
      window.scrollTo(0, 0);
      return;
    }
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
        <h4>연결 관리</h4>
        <label>Instagram 연결 ${sel("ig", s.ig, [[true, "연결됨"], [false, "미연결(위저드 스킵)"]])}</label>
        <label>자산 조회 결과 ${sel("assetError", s.assetError, [["none", "정상"], ["page", "페이지 조회 실패(확인불가)"], ["pixel", "픽셀 조회 실패(확인불가)"]])}</label>
        <label>도메인 인증 ${sel("domainVerified", s.domainVerified, [[false, "미인증(안내 노출)"], [true, "인증 완료(안내 미노출)"]])}</label>
        <label>연결 해제 결과 ${sel("unlinkResult", s.unlinkResult, [["success", "성공"], ["network", "실패 - 통신·서버 오류"], ["auth", "실패 - 인증·권한 오류"]])}</label>
        <h4>상품 피드</h4>
        <div class="drawer__btns"><button type="button" class="btn btn--line btn--sm" data-act="sync">Meta 심사 결과 동기화 (검토중→결과)</button><button type="button" class="btn btn--line btn--sm" data-act="commerce">Commerce 계정 변경 시뮬레이션</button></div>
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
        render();
        UI.toast("시나리오 값이 변경되었습니다.", "info");
      })
    );
    drawerEl.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => {
        const a = b.dataset.act;
        if (a === "reset-new") { Store.reset("new"); go("home"); }
        if (a === "reset-conn") { Store.reset("connected"); go("home"); }
        if (a === "sync") {
          if (!Store.s.connected) return UI.toast("연동 완료 상태에서만 사용할 수 있습니다.", "warn");
          const n = Store.syncMeta();
          UI.toast(n ? `검토중 상품 ${n}건의 Meta 처리 결과가 반영되었습니다.` : "검토중 상태의 상품이 없습니다.", "info");
          render();
        }
        if (a === "commerce") {
          if (!Store.s.connected) return UI.toast("연동 완료 상태에서만 사용할 수 있습니다.", "warn");
          Store.changeCommerce();
          UI.toast("Commerce 계정이 변경되어 기존 상품 피드 상태가 초기화(미전송)되었습니다.", "info");
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
