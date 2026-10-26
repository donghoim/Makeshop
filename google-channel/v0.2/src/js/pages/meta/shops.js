/* ==========================================================================
   SCR 3-6 · Shops 관리 탭 (미연동 / 연동완료)
   - 메이크샵은 Shop·판매 채널을 생성·수정·삭제하지 않으며, 연결 정보 조회와 Meta 관리 화면 이동만 제공
   - 커머스 계정은 연동하지 않는다(2026-10-19 결정). 바로가기는 연결된 카탈로그·비즈니스 ID 기준
   ========================================================================== */
const ShopsPage = (function () {
  function render(root) {
    const s = Store.s;
    const a = window.MOCK.account;
    if (!s.connected) {
      root.appendChild(
        App.emptyState({
          title: "비즈니스 자산 연동 후 Shop을 관리할 수 있습니다.",
          desc: "Meta 비즈니스 연동이 완료되면 카탈로그가 연결되고,<br>Facebook·Instagram Shops 설정 화면으로 바로 이동할 수 있습니다.",
          btn: "비즈니스 자산 설정하기",
          note: "연결 관리 탭에서 비즈니스 자산 설정하기 버튼을 클릭해 Instagram 계정과 카탈로그를 연결하면 Shops 관리 기능이 활성화됩니다.",
          onClick: App.gotoConnectAndStart,
        })
      );
      return;
    }
    root.appendChild(
      App.banner(
        "Shops 관리",
        "Meta Shops를 이용하면 메이크샵 상품을 Facebook과 Instagram에서 고객에게 노출할 수 있습니다.<br>상품 정보는 연결된 Meta 제품 카탈로그를 통해 제공되며, Shop 생성 및 판매 채널 설정은 Meta Commerce Manager에서 진행할 수 있습니다."
      )
    );
    const cmUrl = `https://business.facebook.com/commerce_manager/?business_id=${a.businessId}`;
    const igOn = s.ig;
    const igCard = `
      <div class="shop-card">
        <div class="shop-card__head"><h4>Instagram Shop</h4><button type="button" class="btn btn--line btn--sm" data-ext="Instagram Shop 설정 (Commerce Manager)" data-url="${cmUrl}">${UI.icon.gear} 설정</button></div>
        <p class="muted">Instagram 프로필과 상품을 연결하여 고객이 게시물과 Shop에서 상품을 발견할 수 있도록 설정합니다.</p>
        <div class="shop-card__acct"><span class="shop-ic">${UI.icon.ig}</span><span>${igOn ? "@" + UI.esc(a.instagramUsername) : "연결된 계정이 없습니다."}</span><span class="pill ${igOn ? "pill--blue" : "pill--gray"}">${igOn ? "연결중" : "미연결"}</span></div>
      </div>`;
    const info = App.section(
      "Shops 정보",
      `<button type="button" class="btn btn--line btn--sm" data-ext="커머스 관리자 바로가기" data-url="https://business.facebook.com/commerce/catalogs/${a.catalogId}/products?business_id=${a.businessId}">커머스 관리자 바로가기</button>`,
      igCard
    );
    ConnectPage.bindExt(info);
    root.appendChild(info);
  }
  return { render };
})();
