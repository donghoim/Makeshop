/* ==========================================================================
   SCR 3-2 · Meta 비즈니스 홈
   - 각 영역 버튼은 연동 상태에 따라 [설정하기] 또는 [자세히 보기] 중 1개만 노출
   ========================================================================== */
const HomePage = (function () {
  const ILL = {
    connect: '<svg viewBox="0 0 120 120" width="110" height="110"><g fill="none" stroke="#1877f2" stroke-width="14" stroke-linecap="round"><path d="M52 68 30 90a14 14 0 0 1-20-20l22-22"/><path d="M68 52 90 30a14 14 0 0 1 20 20L88 72"/></g><path d="M45 75 75 45" stroke="#64a9ff" stroke-width="12" stroke-linecap="round"/><circle cx="86" cy="88" r="16" fill="#cfe3ff"/><circle cx="86" cy="88" r="6" fill="#fff"/></svg>',
    feed: '<svg viewBox="0 0 120 120" width="110" height="110"><path d="M14 38h22c14 0 22 44 38 44h24" fill="none" stroke="#1877f2" stroke-width="12" stroke-linecap="round"/><path d="M14 82h22c14 0 22-44 38-44h24" fill="none" stroke="#9ec9ff" stroke-width="12" stroke-linecap="round"/><path d="m92 26 14 12-14 12M92 70l14 12-14 12" fill="none" stroke="#1877f2" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ads: '<svg viewBox="0 0 120 120" width="110" height="110"><path d="M44 46h18l34-20v68L62 74H44z" fill="#1877f2"/><rect x="26" y="46" width="20" height="28" rx="4" fill="#64a9ff"/><path d="M98 52h10M98 68h10" stroke="#1877f2" stroke-width="7" stroke-linecap="round"/><circle cx="40" cy="88" r="16" fill="#cfe3ff"/><circle cx="40" cy="88" r="6" fill="#fff"/></svg>',
    shops: '<svg viewBox="0 0 120 120" width="110" height="110"><rect x="26" y="34" width="70" height="60" rx="10" fill="#1877f2"/><rect x="26" y="20" width="70" height="28" rx="8" fill="#9ec9ff"/><path d="M44 20v18a8 8 0 0 0 16 0V20M62 20v18a8 8 0 0 0 16 0V20" fill="#cfe3ff"/><rect x="64" y="62" width="22" height="9" rx="4.5" fill="#fff"/><circle cx="30" cy="92" r="14" fill="#cfe3ff"/><circle cx="30" cy="92" r="5" fill="#fff"/></svg>',
  };
  const AREAS = [
    {
      key: "connect", title: "연결 관리",
      desc: "Meta 비즈니스 기능 사용을 위해 필요한 계정을 연결하는 공간입니다. 페이스북 FBE(Facebook Business Extension) 로그인을 통해<br>Facebook 페이지, 인스타그램 계정, 광고 계정, 픽셀, 제품 카탈로그, Commerce Manager 등을 한 번에 연동할 수 있습니다.<br>연결 완료 후에는 상품 연동부터 광고 성과 측정 등 Meta 관련 기능을 메이크샵에서 통합 관리할 수 있으며, 현재 연결된 계정 및 권한 상태도 함께 확인할 수 있습니다.",
      done: (s) => s.connected,
    },
    {
      key: "feed", title: "상품 피드",
      desc: "메이크샵 상품을 Meta 제품 카탈로그와 연동하고 관리하는 공간입니다. 쇼핑 채널 및 광고 운영에 필요한 상품 데이터를 Meta로 전달하며,<br>상품 연동 상태·동기화 현황·오류 여부 등을 확인할 수 있습니다.<br>카탈로그 생성 이후 상품의 등록·수정·삭제 등 변경 사항이 자동으로 업데이트되며, 최신 상품 정보가 Meta 채널에 지속적으로 반영됩니다.",
      done: (s) => s.connected && s.categorySaved, // 미설정(카테고리 매칭 전)/미연동 → 설정하기
    },
    {
      key: "ads", title: "광고 관리",
      desc: "Meta 광고 운영 상태와 주요 정보를 확인하는 공간입니다. 연결된 광고 계정 정보부터 광고 상태, 주요 성과 정보를 확인할 수 있으며,<br>Meta 광고 관리자와 연계하여 광고 운영을 이어갈 수 있습니다.<br>단순 계정 연결 상태가 아닌 실제 광고 운영 현황 중심으로 정보를 제공합니다.",
      done: (s) => s.connected,
    },
    {
      key: "shops", title: "Shops 관리",
      desc: "Meta Shops를 이용하면 메이크샵 상품을 Facebook과 Instagram에서 고객에게 노출할 수 있습니다.<br>상품 정보는 연결된 Meta 제품 카탈로그를 통해 제공되며, Shop 생성 및 판매 채널 설정은 Meta Commerce Manager에서 진행할 수 있습니다.",
      done: (s) => s.connected,
    },
  ];

  function render(root) {
    const s = Store.s;
    AREAS.forEach((a) => {
      const done = a.done(s);
      const el = document.createElement("section");
      el.className = "card home-card";
      el.innerHTML = `
        <div class="home-card__txt">
          <h3>${a.title}</h3>
          <p>${a.desc}</p>
          <div class="home-card__btns">${done ? `<button type="button" class="btn btn--gray btn--lg" data-go="${a.key}">자세히 보기</button>` : `<button type="button" class="btn btn--primary btn--lg" data-go="${a.key}">설정하기</button>`}</div>
        </div>
        <div class="home-card__ill" aria-hidden="true">${ILL[a.key]}</div>`;
      el.querySelector("[data-go]").addEventListener("click", () => App.go(a.key));
      root.appendChild(el);
    });
  }
  return { render };
})();
