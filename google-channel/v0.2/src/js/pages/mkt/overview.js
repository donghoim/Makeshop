/* ==========================================================================
   SCR-MKT-001 · 통합 현황 (메뉴 진입 시 기본 탭, POL-003)
   - 채널 연결 현황 카드(Meta·Google·TikTok) + 채널별 운영 현황 표(Meta·Google)
   - 외부 API를 호출하지 않고 메이크샵에 저장된 연결 상태·상품 상태로 표시한다 (POL-021)
   - 운영 현황 표: 계정·상품 피드·광고 연결 상태 3종 + 채널 등록 상품 수 (POL-019)
   ========================================================================== */
const MktOverview = (function () {
  const CHANNELS = [
    { key: "meta", name: "Meta", features: "상품 피드 · 광고 관리 · Shops 관리", icon: () => UI.icon.meta.replace('width="56" height="35"', 'width="40" height="25"'), home: "#/meta/home", connect: "#/meta/connect" },
    { key: "google", name: "Google", features: "상품 피드 · 구글애즈", icon: () => UI.icon.google.replace('width="44" height="44"', 'width="30" height="30"'), home: "#/google/home", connect: "#/google/connect" },
  ];
  const LABEL = { none: "미연결", connected: "연결됨", reauth: "재인증 필요" };
  /** 저장된 연결 상태 — Meta는 FBE 한 번에 연결되어 세 값이 같다(POL-014), Google은 서비스별(POL-015) */
  function states(key) {
    if (key === "meta") {
      const v = Store.s.connected ? "connected" : "none";
      return { account: v, feed: v, ads: v };
    }
    return { account: GStore.s.account, feed: GStore.mcState(), ads: GStore.adsState() };
  }
  /** 채널 등록 상품 수 — 상품 피드 미연결이면 '-' (POL-018, POL-020) */
  function registered(key) {
    if (key === "meta") return Store.s.connected ? Store.s.products.filter((p) => Store.META_STATES.includes(Store.status(p))).length : null;
    return GStore.s.mc === "none" ? null : GStore.registeredCount();
  }
  function pill(v) {
    return v === "connected" ? GCommon.pill("연결됨") : v === "reauth" ? GCommon.pill("재인증 필요", "red") : GCommon.pill("미연결", "gray");
  }

  function render(root) {
    // 1. 채널 연결 현황 (카드 배지는 계정 연결 상태)
    const cards = document.createElement("section");
    cards.className = "card sec";
    cards.innerHTML = `<div class="sec__head"><h3>채널 연결 현황</h3></div><div class="sec__body"><div class="chcards">${CHANNELS.map((c) => {
      const st = states(c.key).account;
      const on = st !== "none";
      return `<div class="chcard"><div class="chcard__top"><span class="chcard__ic">${c.icon()}</span><div><b>${c.name}</b><p class="muted small">${c.features}</p></div></div>
        <div class="chcard__foot">${pill(st)}<button type="button" class="btn ${on ? "btn--line" : "btn--primary"} btn--sm" data-go="${on ? c.home : c.connect}">${on ? "관리하기" : "연동하기"}</button></div></div>`;
    }).join("")}
      <div class="chcard is-ready"><div class="chcard__top"><span class="chcard__ic">${UI.icon.tiktok.replace('width="44" height="44"', 'width="30" height="30"')}</span><div><b>TikTok</b><p class="muted small">준비 중</p></div></div><div class="chcard__foot">${GCommon.pill("준비 중", "gray")}</div></div>
    </div></div>`;
    root.appendChild(cards);

    // 2. 채널별 운영 현황
    const tbl = document.createElement("section");
    tbl.className = "card sec";
    tbl.innerHTML = `<div class="sec__head"><h3>채널별 운영 현황</h3></div><div class="sec__body sec__body--flush"><div class="table-wrap"><table class="table table--compact">
      <thead><tr><th class="th-left">채널</th><th>계정 연결 상태</th><th>상품 피드 연결 상태</th><th>광고 연결 상태</th><th>채널 등록 상품 수 ${UI.qmark("mktReg")}</th><th>관리</th></tr></thead>
      <tbody>${CHANNELS.map((c) => {
        const s = states(c.key);
        const reg = registered(c.key);
        const on = s.account !== "none";
        return `<tr data-ch="${c.key}"><td class="td-left"><span class="chname">${c.icon()}${c.name}</span></td><td class="v-account">${pill(s.account)}</td><td class="v-feed">${pill(s.feed)}</td><td class="v-ads">${pill(s.ads)}</td><td class="v-reg">${reg == null ? "-" : UI.fmt(reg)}</td>
          <td class="v-btn"><button type="button" class="btn ${on ? "btn--line" : "btn--primary"} btn--sm" data-go="${on ? c.home : c.connect}">${on ? "바로가기" : "연동하기"}</button></td></tr>`;
      }).join("")}</tbody></table></div>
      <p class="note sec__note">${UI.icon.info}<span>각 채널 화면에서 확인한 연결 상태와 상품 상태를 보여줍니다. 계정·상품 피드·광고 연결은 채널마다 Meta(비즈니스·카탈로그·광고 계정), Google(Google 계정·Merchant Center·Google Ads) 기준입니다.</span></p></div>`;
    root.appendChild(tbl);
    root.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => App.nav(b.dataset.go)));
  }
  return { render };
})();
