/* ==========================================================================
   SCR 3-6 · Shops 관리 탭 (미연동 / 연동완료)
   - 메이크샵은 Shop·판매 채널을 생성·수정·삭제하지 않으며, 조회 및 Commerce Manager 이동만 제공
   ========================================================================== */
const ShopsPage = (function () {
  function render(root) {
    const s = Store.s;
    const a = window.MOCK.account;
    if (!s.connected) {
      root.appendChild(
        App.emptyState({
          title: "비즈니스 자산 연동 후 Shop을 관리할 수 있습니다.",
          desc: "Meta 비즈니스 연동이 완료되면 커머스 계정·카탈로그가 연결되고,<br>Facebook·Instagram Shops 설정 화면으로 바로 이동할 수 있습니다.",
          btn: "비즈니스 자산 설정하기",
          note: "연결 관리 탭에서 비즈니스 자산 설정하기 버튼을 클릭해 Instagram 계정과 커머스 계정을 연결하면 Shops 관리 기능이 활성화됩니다.",
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
    const info = App.section(
      "Shops 계정 정보",
      `<button type="button" class="btn btn--line btn--sm" data-ext="커머스 관리자 바로가기" data-url="https://business.facebook.com/commerce/catalogs/${a.catalogId}/products?business_id=${a.businessId}">커머스 관리자 바로가기</button>`,
      `<dl class="kv"><div class="kv__row"><dt>Commerce Account</dt><dd>${UI.esc(s.commerceName)}</dd></div><div class="kv__row"><dt>연결된 Catalog</dt><dd>${UI.esc(a.catalogName)}</dd></div></dl>`
    );
    ConnectPage.bindExt(info);
    root.appendChild(info);

    const cmUrl = `https://business.facebook.com/commerce_manager/?business_id=${a.businessId}`;
    const fbOn = s.assetError !== "page"; // 연결된 Facebook Page 확인 불가 시 미연결
    const igOn = s.ig;
    const card = (title, desc, ic, on, name) => `
      <div class="shop-card">
        <div class="shop-card__head"><h4>${title}</h4><button type="button" class="btn btn--line btn--sm" data-ext="${title} 설정 (Commerce Manager)" data-url="${cmUrl}">${UI.icon.gear} 설정</button></div>
        <p class="muted">${desc}</p>
        <div class="shop-card__acct">${ic}<span>${on ? UI.esc(name) : "연결된 계정이 없습니다."}</span><span class="pill ${on ? "pill--blue" : "pill--gray"}">${on ? "연결중" : "미연결"}</span></div>
      </div>`;
    const ch = App.section(
      "판매 채널",
      "",
      `<div class="shop-grid">
        ${card("Facebook Shop", "Facebook에서 상품을 소개하고 고객이 쇼핑몰 상품을 발견할 수 있도록 설정합니다.", `<span class="shop-ic">${UI.icon.fb}</span>`, fbOn, a.fbShopName)}
        ${card("Instagram Shop", "Instagram 프로필과 상품을 연결하여 고객이 게시물과 Shop에서 상품을 발견할 수 있도록 설정합니다.", `<span class="shop-ic">${UI.icon.ig}</span>`, igOn, "@" + a.instagramUsername)}
      </div>`
    );
    ConnectPage.bindExt(ch);
    root.appendChild(ch);
  }
  return { render };
})();
