/* ==========================================================================
   SCR-GOOGLE-HOME-001 · Google 하위 탭 / 홈 / 미연동 안내
   - 하위 탭: 홈 | 연결관리 | 상품피드 | 구글애즈, Google 탭 진입 시 홈 (POL-032)
   - 하위 탭은 항상 진입할 수 있고, 필요한 연동이 없으면 탭 안에 안내와 버튼 (POL-034)
   ========================================================================== */
const GooglePages = (function () {
  const TABS = [
    { key: "home", label: "홈" },
    { key: "connect", label: "연결관리" },
    { key: "feed", label: "상품피드" },
    { key: "ads", label: "구글애즈" },
  ];
  const ILL = {
    connect: '<svg viewBox="0 0 120 120" width="110" height="110"><g fill="none" stroke="#4285F4" stroke-width="14" stroke-linecap="round"><path d="M52 68 30 90a14 14 0 0 1-20-20l22-22"/><path d="M68 52 90 30a14 14 0 0 1 20 20L88 72"/></g><path d="M45 75 75 45" stroke="#34A853" stroke-width="12" stroke-linecap="round"/><circle cx="86" cy="88" r="16" fill="#FBBC05" opacity=".35"/></svg>',
    feed: '<svg viewBox="0 0 120 120" width="110" height="110"><rect x="18" y="22" width="84" height="76" rx="12" fill="#e8f0fe"/><rect x="30" y="36" width="26" height="26" rx="6" fill="#4285F4"/><rect x="64" y="36" width="26" height="26" rx="6" fill="#34A853"/><rect x="30" y="68" width="60" height="8" rx="4" fill="#9ec1fb"/><rect x="30" y="82" width="40" height="8" rx="4" fill="#c6dafc"/></svg>',
    ads: '<svg viewBox="0 0 120 120" width="110" height="110"><path d="M30 92 58 28" stroke="#FBBC05" stroke-width="18" stroke-linecap="round"/><path d="M62 28 90 92" stroke="#4285F4" stroke-width="18" stroke-linecap="round"/><circle cx="30" cy="92" r="11" fill="#34A853"/></svg>',
  };
  const CARDS = [
    { key: "connect", title: "연결관리", desc: "Google 계정을 연결하고 Merchant Center와 Google Ads를 각각 연결하는 공간입니다.<br>Google 계정 연결 후 두 서비스는 따로 연결할 수 있으며, 연결 상태와 계정 정보를 확인할 수 있습니다.", done: () => GStore.s.account !== "none" },
    { key: "feed", title: "상품피드", desc: "메이크샵 상품을 Merchant Center로 보내고 상품별 상태와 전송 결과를 확인하는 공간입니다.<br>카테고리를 매칭한 상품을 자동으로 전송하고, 상품 수정 내용도 자동으로 반영합니다.", done: () => GStore.s.mc !== "none", setup: "#/google/connect?focus=mc" },
    { key: "ads", title: "구글애즈", desc: "Google Ads 광고 측정 상태와 캠페인·상품 광고 성과를 확인하는 공간입니다.<br>광고 운영 상태와 Google이 제안하는 개선 권장사항을 함께 확인할 수 있습니다.", done: () => GStore.s.ads !== "none", setup: "#/google/connect?open=ads" },
  ];

  function home(root) {
    CARDS.forEach((a) => {
      const done = a.done(); // 카드별 연동 여부를 따로 판정 (POL-033)
      const el = document.createElement("section");
      el.className = "card home-card";
      el.innerHTML = `
        <div class="home-card__txt"><h3>${a.title}</h3><p>${a.desc}</p>
          <div class="home-card__btns">${done ? '<button type="button" class="btn btn--gray btn--lg">자세히 보기</button>' : '<button type="button" class="btn btn--primary btn--lg">설정하기</button>'}</div></div>
        <div class="home-card__ill" aria-hidden="true">${ILL[a.key]}</div>`;
      el.querySelector("button").addEventListener("click", () => {
        if (done) App.nav("#/google/" + a.key);
        else if (GStore.s.account === "none") App.nav("#/google/connect");
        else App.nav(a.setup || "#/google/connect");
      });
      root.appendChild(el);
    });
  }

  /** 하위 탭 미연동 안내 — Google 계정 미연결을 먼저 판정 (POL-034) */
  function guard(key, root) {
    const s = GStore.s;
    if (key !== "feed" && key !== "ads") return false;
    const logo = GCommon.gLogoBig();
    if (s.account === "none") {
      root.appendChild(App.emptyState({ logo, title: "Google 계정 연결 후 이용할 수 있습니다.", desc: "연결관리에서 Google 계정을 먼저 연결해 주세요.", btn: "Google 계정 연결하기", btnIcon: '<span class="g-ic">G</span>', onClick: () => App.nav("#/google/connect?open=account") }));
      return true;
    }
    if (key === "feed" && s.mc === "none") {
      root.appendChild(App.emptyState({ logo, title: "Merchant Center 연결 후 상품 피드를 사용할 수 있습니다.", desc: "Merchant Center를 연결하면 카테고리를 매칭한 상품이<br>Google에 자동으로 전송됩니다.", btn: "Merchant Center 연동하기", onClick: () => App.nav("#/google/connect?focus=mc") }));
      return true;
    }
    if (key === "ads" && s.ads === "none") {
      root.appendChild(App.emptyState({ logo, title: "Google Ads 연결 후 광고 성과를 확인할 수 있습니다.", desc: "Merchant Center 연결 여부와 관계없이 Google Ads만 따로 연결할 수 있습니다.", btn: "Google Ads 연결하기", onClick: () => App.nav("#/google/connect?open=ads") }));
      return true;
    }
    return false;
  }

  function render(key, root, params) {
    if (key === "home") return home(root);
    if (guard(key, root)) return;
    if (key === "connect") return GConnect.render(root, params);
    if (key === "feed") return GFeed.render(root, params);
    if (key === "ads") return GAds.render(root, params);
  }
  return { TABS, render };
})();
