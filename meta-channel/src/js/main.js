/* ==========================================================================
   Meta 비즈니스 프로토타입 — 메인 컨트롤러
   ========================================================================== */

const STATUS_META = {
  active:   { label: "활동중",   dot: "active" },
  review:   { label: "검토중",   dot: "review" },
  rejected: { label: "미승인",   dot: "rejected" },
  limited:  { label: "노출제한", dot: "limited" },
  disabled: { label: "사용안함", dot: "disabled" },
};
const FILTER_ORDER = ["all", "active", "review", "rejected", "limited", "disabled"];
const FILTER_LABEL = { all: "전체", active: "활동중", review: "검토중", rejected: "미승인", limited: "노출제한", disabled: "사용안함" };
const PERIOD_LABEL = { today: "오늘", yesterday: "어제", last7: "최근 7일", last30: "최근 30일", thisMonth: "이번 달" };

const TAB_SIDE_DESC = {
  home: {
    title: "홈",
    body: `
      <p>Meta 비즈니스 메뉴에 처음 진입했을 때 노출되는 소개 화면입니다.</p>
      <p>연결 관리·상품 피드·광고 관리·Shops 관리 4개 기능을 간단히 소개하고, 각 기능으로 바로 이동할 수 있는 진입점을 제공합니다.</p>
      <p>연동 상태에 따라 각 카드의 "설정하기" 버튼이 안내하는 흐름이 달라지며, 이미 연동이 완료된 항목은 설정 화면으로, 아직 연동 전인 항목은 연결 절차로 이동합니다.</p>
    `,
  },
  conn: {
    title: "연결 관리",
    body: `
      <p>Meta 비즈니스 기능을 사용하기 위해 필요한 계정과 자산을 연결하는 화면입니다.</p>
      <p>FBE(Facebook Business Extension) 로그인 한 번으로 Facebook 페이지, 인스타그램 계정, 광고 계정, 픽셀, 제품 카탈로그, Commerce Manager까지 한 번에 연동할 수 있습니다.</p>
      <p>실제 로그인·권한 동의·자산 선택 절차는 Meta가 제공하는 Embedded Signup 팝업에서 진행되며, 메이크샵은 이 팝업의 화면 구성이나 진행 순서를 임의로 바꿀 수 없습니다.</p>
      <p>최초 연동 시에는 메이크샵 자체 개인정보 수집·이용 동의 절차가 먼저 노출되며, 두 항목 모두 동의해야 다음 단계로 진행됩니다.</p>
      <p>연동이 완료되면 이 화면에서 연결된 자산 정보를 확인하거나 재설정할 수 있고, 필요 시 연결을 해제할 수도 있습니다.</p>
      <p>연결을 해제하면 상품 피드, 광고 관리 등 Meta 관련 기능이 모두 함께 중단되므로 주의가 필요합니다.</p>
    `,
  },
  feed: {
    title: "상품 피드",
    body: `
      <p>카탈로그로 전송할 상품을 관리하고, 상품별 Meta 연동 상태를 확인하는 화면입니다.</p>
      <p>쇼핑몰 상품이 등록·수정·삭제되면 연결된 카탈로그에 자동으로 반영되어 최신 상태가 유지됩니다.</p>
      <p>상품을 Meta 채널에 노출하려면 쇼핑몰 카테고리를 Meta 표준 상품 분류 체계와 매칭해야 하며, 매칭되지 않은 상품은 피드에서 제외되어 노출되지 않습니다.</p>
      <p>상태 값은 활동중·검토중·미승인·노출제한·사용안함으로 구분되며, 미승인·노출제한 상품은 사유를 함께 확인할 수 있습니다.</p>
      <p>"판매불가능"으로 설정된 상품은 자동으로 수집되지 않으므로 판매 상태 값을 함께 점검해야 합니다.</p>
      <p>비즈니스 자산 연동이 완료되어야 이 화면의 기능을 사용할 수 있으며, 연동 전에는 안내와 함께 연결 관리 탭으로 이동을 유도합니다.</p>
    `,
  },
  ads: {
    title: "광고 관리",
    body: `
      <p>Meta 광고 계정의 운영 상태와 캠페인 성과를 확인하는 화면입니다.</p>
      <p>노출수, 클릭수, CTR, 전환수, 광고 지출 등 핵심 지표를 기간별(오늘·어제·최근 7일·최근 30일·이번 달)로 조회할 수 있습니다.</p>
      <p>모든 성과 데이터는 Meta Marketing API를 통해 제공되며, 실제 반영까지 최대 1일 이상 소요될 수 있어 정확한 수치는 Meta 광고 관리자에서 재확인해야 합니다.</p>
      <p>네이버페이·카카오 톡체크아웃 등 외부 간편결제 구매 건을 Meta 전환으로 함께 수집할지는 전환 추적 설정에서 별도로 켜고 끌 수 있습니다.</p>
      <p>캠페인 목록에 표시할 항목(컬럼)은 운영자가 원하는 구성으로 선택하고 순서를 바꿀 수 있습니다.</p>
      <p>결제 수단 관리, 계정 상태 확인 등 광고 계정 자체의 설정은 Meta 광고 관리자로 이동해 진행합니다.</p>
    `,
  },
  shops: {
    title: "Shops 관리",
    body: `
      <p>Facebook·Instagram Shops 기능을 안내하고, Meta Commerce Manager의 Shop 설정 화면으로 이동할 수 있도록 돕는 화면입니다.</p>
      <p>메이크샵은 Shop을 직접 생성·수정·삭제하지 않습니다. Shop 생성과 레이아웃 편집, 심사·승인 처리는 모두 Meta Commerce Manager에서 이루어집니다.</p>
      <p>Facebook과 Instagram은 각각 별도의 Shop이 아니라, 하나의 Shop(커머스 계정 + 카탈로그)에 연결되는 두 개의 판매 채널입니다.</p>
      <p>Instagram 계정이 연결되어 있지 않아도 Facebook Shop 안내는 정상적으로 이용할 수 있으며, 화면 전체가 막히지 않습니다.</p>
      <p>Shop에 노출되는 상품 데이터 관리(동기화·상태·카테고리 매칭)는 이 화면이 아닌 상품 피드 탭에서 진행합니다.</p>
    `,
  },
};

const App = {
  state: {
    connected: false,
    tab: "conn",
    feed: { filter: "all", search: "", page: 1, pageSize: 20, selected: new Set() },
    ads: { period: "yesterday", campaignSearch: "" },
    campaignColumns: JSON.parse(JSON.stringify(MOCK.campaignColumns.selected)),
    conversion: { naverPay: false, kakaoCheckout: false, kakaoEligible: false },
    categoryMatch: Object.assign({}, MOCK.categoryMatch),
  },

  init() {
    document.querySelectorAll("#tabbar .meta-nav__item").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });
    this.render();
  },

  switchTab(tab) {
    this.state.tab = tab;
    document.querySelectorAll("#tabbar .meta-nav__item").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
    this.render();
  },

  render() {
    const desc = TAB_SIDE_DESC[this.state.tab];
    if (desc && typeof SidePanel !== "undefined") SidePanel.setBase(desc.title, desc.body);

    const content = document.getElementById("content");
    if (this.state.tab === "home") this.renderHomeTab(content);
    if (this.state.tab === "conn") this.renderConnTab(content);
    if (this.state.tab === "feed") this.renderFeedTab(content);
    if (this.state.tab === "ads") this.renderAdsTab(content);
    if (this.state.tab === "shops") this.renderShopsTab(content);

    syncQaToolbar();
  },

  /* ======================================================================
     홈 탭 — Meta 비즈니스 메뉴 신규 진입 시 기능 소개 랜딩
     ====================================================================== */
  renderHomeTab(root) {
    const features = [
      {
        key: "conn",
        title: "연결 관리",
        desc: "Meta 비즈니스 기능 사용을 위해 필요한 계정을 연결하는 공간입니다. 메이크샵 FBE(Facebook Business Extension) 로그인을 통해 Facebook 페이지, 인스타그램 계정, 광고 계정, 픽셀, 제품 카탈로그, Commerce Manager 등을 한 번에 연동할 수 있습니다.",
      },
      {
        key: "feed",
        title: "상품 피드",
        desc: "메이크샵 상품을 Meta 제품 카탈로그와 연동하고 관리하는 공간입니다. 쇼핑몰 채널 및 광고 운영에 필요한 상품 데이터를 Meta로 전달하며, 상품 연동 상태·동기화 현황 등 여러 정보를 한눈에 확인할 수 있습니다.",
      },
      {
        key: "ads",
        title: "광고 관리",
        desc: "Meta 광고 운영 상태와 주요 정보를 확인하는 공간입니다. 연결된 광고 계정 정보부터 광고 상비, 주요 성과 정보를 확인할 수 있으며, Meta 광고 관리자와 연계하여 광고 운영을 이어갈 수 있습니다.",
      },
      {
        key: "shops",
        title: "Shops 관리",
        desc: "Meta Shops를 이용하면 메이크샵 상품을 Facebook과 Instagram에서 고객에게 노출할 수 있습니다. 상품 정보는 연결된 Meta 제품 카탈로그를 통해 제공되며, Shop 생성 및 판매 채널 설정은 Meta Commerce Manager에서 진행할 수 있습니다.",
      },
    ];
    root.innerHTML = features
      .map(
        (f) => `
      <div class="card home-feature"><div class="card__body home-feature__body">
        <div class="home-feature__text">
          <div class="card__title" style="font-size:15px;">${f.title}</div>
          <p class="section-desc" style="margin:8px 0 16px;">${f.desc}</p>
          <div style="display:flex; gap:8px;">
            <button class="btn btn--primary btn--sm home-feature-setup" data-tab="${f.key}">설정하기</button>
            <button class="btn btn--sm btn-detail">자세히 보기</button>
          </div>
        </div>
        <div class="home-feature__icon">${META_ICON_SVG}</div>
      </div></div>`
      )
      .join("");
    root.querySelectorAll(".home-feature-setup").forEach((btn) =>
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab))
    );
    bindDetailButtons(root);
  },

  /* ======================================================================
     연결 관리 탭
     ====================================================================== */
  renderConnTab(root) {
    if (!this.state.connected) {
      // 04_Screen-Spec/3-3. 연결관리 탭 _ 미연동.svg 기준 — 최초 진입 시 FBE 연동 유도만 하는
      // 단순 랜딩 화면이다(진행 순서 스텝플로우·도메인 인증·준비사항 체크리스트는 이 화면에 없음).
      root.innerHTML = `
        <div class="conn-empty">
          <div class="conn-empty__icon">∞</div>
          <h2>페이스북부터 인스타그램까지,<br/>한 곳에서 간편하게 관리하세요.</h2>
          <p>한 번의 로그인으로 필요한 채널을 빠르고 안전하게 연동할 수 있습니다.</p>
          <button class="btn btn--fb" id="btn-fbe-start"><span class="fb-f-icon">f</span>Facebook Business Extension 시작하기</button>
          <p class="hint">ⓘ FBE(Facebook Business Extension)를 이용하면 Facebook 페이지 연결, 비즈니스 관리자 연결, 광고 계정·픽셀·카탈로그 등을 한 번의 설정으로 진행할 수 있습니다.</p>
        </div>
      `;
      document.getElementById("btn-fbe-start").addEventListener("click", () => this.openFbeSimModal());
      return;
    }

    // 연동완료 상태
    const counts = statusCounts();
    root.innerHTML = `
      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">연결 관리</div><button class="btn btn--sm btn-detail">자세히 보기</button></div>
        <p class="section-desc">Meta 비즈니스 기능 사용을 위해 필요한 계정을 연결하는 공간입니다. 연동 완료 후에는 상품 연동, 광고 성과 측정 등 Meta 관련 기능을 메이크샵에서 통합 관리할 수 있습니다.</p>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head">
          <div class="card__title">비즈니스 자산 연동 정보</div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn--sm" id="btn-conn-settings">⚙ 설정</button>
            <button class="btn btn--sm btn--danger-outline" id="btn-conn-disconnect">연결 해제하기</button>
          </div>
        </div>
        <div class="kv-list">
          <div class="kv-row"><div class="kv-label">페이스북 계정</div><div class="kv-value">${MOCK.account.fbAccountLabel} <span class="badge badge--success">연결됨</span></div></div>
          <div class="kv-row"><div class="kv-label">비즈니스 관리자</div><div class="kv-value">${MOCK.account.businessManagerName} <span class="kv-link" data-link="bm">비즈니스 관리자 바로가기 ↗</span></div></div>
          <div class="kv-row"><div class="kv-label">페이지</div><div class="kv-value">${MOCK.account.pageName} <span class="kv-link" data-link="page">페이지 바로가기 ↗</span></div></div>
          <div class="kv-row"><div class="kv-label">픽셀 정보</div><div class="kv-value">픽셀 ID: ${MOCK.account.pixelId} <span class="kv-link" data-link="pixel">이벤트 관리자 바로가기 ↗</span></div></div>
          <div class="kv-row"><div class="kv-label">커머스 계정</div><div class="kv-value">${MOCK.account.commerceAccountName} <span class="kv-link" data-link="commerce">커머스 관리자 바로가기 ↗</span></div></div>
          <div class="kv-row"><div class="kv-label">인스타그램 계정</div><div class="kv-value">${MOCK.account.instagramConnected ? "@" + MOCK.account.instagramUsername : "미연동"} ${MOCK.account.instagramConnected ? `<span class="kv-link" data-link="ig">인스타그램 설정 바로가기 ↗</span>` : ""}</div></div>
        </div>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__title">상품 피드</div>
        <div class="kv-row" style="border-bottom:none;">
          <div class="kv-label">카테고리 설정</div>
          <div class="kv-value">
            <span class="badge ${anyCategoryMatched(this.state.categoryMatch) ? "badge--success" : "badge--neutral"}">${anyCategoryMatched(this.state.categoryMatch) ? "설정완료" : "미설정"}</span>
            <button class="btn btn--sm" id="btn-open-catmatch" style="margin-left:8px;">상품 카테고리 매칭</button>
          </div>
        </div>
        <p class="muted" style="font-size:11.5px; margin:10px 0 6px;">상품개수: ${MOCK.products.length}개 (최근 업데이트: 2026-06-01 12:23:45)</p>
        ${renderProgressBar(counts)}
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">광고 관리</div><button class="btn btn--sm" id="btn-ads-settings">⚙ 설정</button></div>
        <div class="kv-row" style="border-bottom:none;">
          <div class="kv-label">광고 계정</div>
          <div class="kv-value">${MOCK.adAccount.name} <span class="kv-link" data-link="ads">광고 계정 바로가기 ↗</span></div>
        </div>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">도메인 인증 안내</div><button class="btn btn--sm btn-detail">자세히 보기</button></div>
        <p class="section-desc">Meta 광고의 전환 추적 및 웹 이벤트 구성을 위해 쇼핑몰 도메인 인증이 필요합니다.</p>
        <p class="faint">01 Meta 비즈니스 관리자 접속 → 02 도메인 등록 → 03 소유권 인증</p>
        <button class="btn" id="btn-domain-goto-2">Meta 비즈니스 관리자 바로가기 ↗</button>
      </div></div>
    `;

    root.querySelectorAll("[data-link]").forEach((el) =>
      el.addEventListener("click", () => UI.toast("새 탭에서 Meta 관리 화면으로 이동합니다. (프로토타입 시뮬레이션)", "success"))
    );
    document.getElementById("btn-domain-goto-2").addEventListener("click", () =>
      UI.toast("새 창에서 Meta 비즈니스 관리자로 이동합니다. (프로토타입에서는 외부 이동을 시뮬레이션합니다)", "success")
    );
    document.getElementById("btn-conn-settings").addEventListener("click", () => this.openFbeSimModal(true));
    document.getElementById("btn-ads-settings").addEventListener("click", () => this.openFbeSimModal(true));
    document.getElementById("btn-open-catmatch").addEventListener("click", () => this.openCategoryMatchModal(false));
    document.getElementById("btn-conn-disconnect").addEventListener("click", () => this.confirmDisconnect());
    bindDetailButtons(root);
  },

  openFbeSimModal(isReconfig) {
    // 0단계(개인정보 동의)는 메이크샵 자체 화면이라 최초 연동 시에만 노출한다.
    // 이미 연동된 상태에서 자산 재설정(FBE 위저드 재실행)할 때는 최초 동의가 이미 확보된 것으로 간주해 다시 묻지 않는다. [가정] — 서비스기획 확인 필요
    if (isReconfig) {
      this.openFbeStepsModal(isReconfig);
    } else {
      this.openPrivacyConsentModal(() => this.openFbeStepsModal(isReconfig));
    }
  },

  openPrivacyConsentModal(onAgree) {
    UI.openModal({
      title: "페이스북 채널 개인정보 수집 및 이용 동의",
      size: "lg",
      sideDesc: `
        <p>Meta 비즈니스 기능을 연동하기 전에 어떤 정보가 Meta에 제공되고, 메이크샵이 무엇을 수집하는지 안내하고 동의를 받는 화면입니다.</p>
        <p>제3자 제공 및 국외 이전 동의, 개인정보 수집·이용 동의 두 항목 모두 필수이며, 하나라도 동의하지 않으면 확인 버튼이 비활성화되어 다음 단계로 진행할 수 없습니다.</p>
        <p>이 화면은 메이크샵이 직접 제공하는 화면으로, Meta의 Embedded Signup 팝업이 열리기 전(0단계)에 노출됩니다.</p>
        <p>이미 연동이 완료된 상태에서 자산을 재설정(FBE 재실행)할 때는 최초 동의가 이미 확보된 것으로 보고 다시 노출하지 않습니다.</p>
      `,
      bodyHTML: `
        <div style="max-height:420px; overflow:auto; border:1px solid #e5e7eb; background:#fafafa; padding:16px; font-size:11.5px; color:#374151; line-height:1.7;">
          <p style="margin-top:0;">메이크샵 Meta 비즈니스 기능 이용을 위해 아래와 같이 정보가 Meta에 제공되며, 메이크샵이 연동 관리를 위해 일부 정보를 수집합니다. 내용을 확인하신 후 동의해 주세요.</p>

          <p style="font-weight:bold; margin-bottom:4px;">1. 개인정보 및 쇼핑몰 정보 제3자 제공 동의</p>
          <ul style="margin-top:0; padding-left:18px;">
            <li>제공받는 자: Meta Platforms, Inc. 및 Meta Platforms Ireland Limited (이하 "Meta")</li>
            <li>제공 목적: 페이스북·인스타그램 채널 상품 연동, 제품 카탈로그 생성 및 동기화, 광고 게재·성과 측정, 전환 추적</li>
            <li>제공 항목: 쇼핑몰 정보(쇼핑몰명, 도메인, 사업자 정보), 상품 정보(상품명, 가격, 이미지, 설명, 카테고리, 판매 상태, 재고, 상품 페이지 URL), 전환 추적 정보(구매·장바구니 행동 이벤트, 주문번호, 결제 금액, 암호화된 구매자 식별 정보)</li>
            <li>보유 및 이용 기간: 연동 해제 또는 제공 목적 달성 시까지 (Meta로 이전된 정보는 Meta 개인정보처리방침에 따름)</li>
            <li>국외 이전 안내: 위 정보는 미국 등 Meta의 국외 서버로 이전·처리되며, 연동 및 피드 동기화 시점에 연동 API를 통해 전송됩니다.</li>
          </ul>

          <p style="font-weight:bold; margin-bottom:4px;">2. 개인정보 수집·이용 동의 (메이크샵)</p>
          <ul style="margin-top:0; padding-left:18px;">
            <li>수집 항목: Facebook 계정 연동 토큰, 비즈니스 관리자·페이지·인스타그램·광고 계정 ID 및 상태, 픽셀 ID, 제품 카탈로그 ID, 광고 성과 데이터(노출수·클릭수·전환수·지출액 등)</li>
            <li>수집 목적: Meta 비즈니스 연동 상태 관리, 상품 피드 동기화, 광고 성과 정보 제공</li>
            <li>보유 및 이용 기간: 연동 해제 또는 회원 탈퇴 시까지(단, 관계 법령상 보존 필요 시 해당 기간 동안 보존)</li>
          </ul>

          <p style="font-weight:bold; margin-bottom:4px;">3. 유의사항</p>
          <ul style="margin-top:0; padding-left:18px;">
            <li>연동 과정에서 Facebook 로그인 및 Meta 측 권한 승인 절차가 진행되며, Meta가 처리하는 정보에는 Meta 이용약관 및 개인정보처리방침이 적용됩니다.</li>
            <li>Meta 권한 승인 단계에서 일부 권한을 허용하지 않을 경우, 도메인 인증 상태 확인·카탈로그 동기화·광고 성과 조회 등 일부 기능이 정상 동작하지 않을 수 있습니다.</li>
            <li>전환 추적 정보에는 쇼핑몰 이용자(구매자)의 개인정보가 포함될 수 있습니다. 운영자께서는 자체 개인정보처리방침에 Meta에 대한 제3자 제공 및 국외 이전 사항을 반영하고, 이용자의 동의를 확보하실 책임이 있습니다.</li>
            <li>연동 해제 시 메이크샵에서 Meta로의 정보 제공은 중단되나, 이미 Meta에 전달된 정보의 삭제는 Meta 정책에 따릅니다.</li>
            <li>동의를 거부할 권리가 있으며, 거부 시 Meta 비즈니스 연동 기능(상품 피드, 광고 관리 등)을 이용할 수 없습니다. 쇼핑몰 운영 등 기본 서비스 이용에는 제한이 없습니다.</li>
          </ul>
        </div>
        <div style="margin-top:16px;">
          <label style="display:flex; gap:8px; align-items:flex-start; font-size:12px; margin-bottom:10px; cursor:pointer;">
            <input type="checkbox" id="consent-1" style="margin-top:2px;"/>
            <span>[필수] 위 제3자 제공 및 국외이전에 동의합니다.</span>
          </label>
          <label style="display:flex; gap:8px; align-items:flex-start; font-size:12px; cursor:pointer;">
            <input type="checkbox" id="consent-2" style="margin-top:2px;"/>
            <span>[필수] 위 개인정보 수집 및 이용에 동의합니다.</span>
          </label>
        </div>
      `,
      footHTML: `<button class="btn btn--primary" id="consent-confirm-btn" disabled>확인</button>`,
      onMount: (root) => {
        const c1 = root.querySelector("#consent-1");
        const c2 = root.querySelector("#consent-2");
        const btn = root.querySelector("#consent-confirm-btn");
        function sync() {
          btn.disabled = !(c1.checked && c2.checked);
        }
        c1.addEventListener("change", sync);
        c2.addEventListener("change", sync);
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          UI.closeModal();
          onAgree();
        });
      },
    });
  },

  openFbeStepsModal(isReconfig) {
    // 실제 Meta Embedded Signup 팝업(로그인→OAuth 동의→Shop 시작→비즈니스 포트폴리오→
    // 페이지→Instagram→카탈로그→광고 계정→픽셀→커머스 계정→설정 확인→권한 확인→
    // 커머스 계정 설정 완료→완료, 14단계)을 최대한 유사하게 재현한 시뮬레이션.
    // 이 팝업은 Meta가 소유하는 외부 화면이라 메이크샵이 UI 순서를 제어하지 않는다.
    // 03_Wireframe/SCR-META-CONN-001/SCR-META-CONN-001-Meta인증팝업플로우.svg 참조.
    FbeOAuth.open({
      onComplete: (sel, wantsAds) => {
        const wasConnected = App.state.connected;
        App.state.connected = true;
        UI.toast(isReconfig ? "비즈니스 자산 설정이 갱신되었습니다." : "Meta 비즈니스 자산 연동이 완료되었습니다.", "success");
        if (wantsAds) {
          setTimeout(() => UI.toast("새 탭에서 Meta 광고 관리자로 이동합니다. (프로토타입 시뮬레이션)", "success"), 350);
        }
        App.render();
        if (!wasConnected) {
          setTimeout(() => App.openCategoryMatchModal(true), wantsAds ? 700 : 300);
        }
      },
      onCancel: () => {
        UI.toast("Meta 인증이 취소되어 연동이 진행되지 않았습니다.", "error");
      },
    });
  },

  confirmDisconnect() {
    UI.confirm({
      title: "연결 해제",
      danger: true,
      bodyHTML: "연결을 해제하면 상품 연동, 광고 연동, 고객 채널 등 모든 Meta 관련 기능이 중단됩니다.<br/>연결을 해제하시겠습니까?",
      confirmText: "확인",
      cancelText: "취소",
      sideDesc: `
        <p>Meta 비즈니스 연결을 해제할지 다시 한번 확인하는 화면입니다.</p>
        <p>연결을 해제하면 상품 연동, 광고 연동, 고객 채널 등 Meta와 연결된 모든 기능이 즉시 중단됩니다.</p>
        <p>해제 이후 다시 연동하려면 Facebook 로그인부터 자산 선택까지 전체 절차를 다시 진행해야 합니다.</p>
        <p>이미 Meta로 전달된 상품·광고 데이터의 삭제 여부는 메이크샵이 아닌 Meta 정책에 따릅니다.</p>
      `,
      onConfirm: () => {
        this.state.connected = false;
        UI.toast("Meta 비즈니스 연결이 해제되었습니다.", "success");
        this.render();
      },
    });
  },

  openCategoryMatchModal(isAuto) {
    const cats = MOCK.shopCategories;
    const localMatch = Object.assign({}, this.state.categoryMatch);
    const ddControls = {};

    const rowsHTML = cats
      .map(
        (c) => `
      <div style="display:flex; align-items:center; padding:8px 0; border-bottom:1px solid #f3f4f6; gap:16px;">
        <div style="flex:0 0 320px; font-size:12px;">${c.path}</div>
        <div class="dd" data-cat="${c.id}" style="flex:1;"></div>
      </div>`
      )
      .join("");

    function tryClose(force) {
      const matchedCount = Object.values(localMatch).filter(Boolean).length;
      if (!force && matchedCount === 0) {
        UI.confirm({
          title: "미매칭 닫기",
          bodyHTML: "카테고리를 매칭하지 않은 상품은 피드에서 제외되어 Meta에 노출되지 않습니다.<br/>다음에 반영하시겠습니까?",
          confirmText: "확인",
          cancelText: "취소",
          sideDesc: `
            <p>카테고리를 매칭하지 않은 상품이 남아있는 상태에서 창을 닫을지 확인하는 화면입니다.</p>
            <p>매칭되지 않은 상품은 상품 피드에서 자동으로 제외되어 Meta 채널에 노출되지 않습니다.</p>
            <p>지금 닫더라도 저장된 매칭 정보는 유지되며, 이후 상품 카테고리 매칭 화면에서 이어서 진행할 수 있습니다.</p>
          `,
          onConfirm: () => UI.closeModal(),
        });
        return;
      }
      UI.closeModal();
    }

    UI.openModal({
      title: "상품 카테고리 매칭",
      size: "lg",
      descHTML:
        "내 쇼핑몰의 상품 분류와 가장 유사한 페이스북의 상품 분류를 선택해주세요. 매칭된 카테고리의 상품은 자동으로 다음 업데이트 시 페이스북 상품 피드로 자동 수집됩니다.",
      sideDesc: `
        <p>쇼핑몰 상품 카테고리와 Meta(페이스북)가 사용하는 표준 상품 분류 체계를 서로 매칭하는 화면입니다.</p>
        <p>매칭된 카테고리에 속한 상품은 다음 상품 피드 업데이트 시점에 자동으로 수집되어 Meta 채널에 노출됩니다.</p>
        <p>반대로 매칭되지 않은 카테고리의 상품은 피드에서 제외되므로, 노출을 원하는 카테고리는 반드시 매칭을 완료해야 합니다.</p>
        <p>매칭 값을 하나도 저장하지 않고 닫으려 하면 별도의 확인 절차(미매칭 닫기)가 노출됩니다.</p>
      `,
      bodyHTML: `<div id="catmatch-rows">${rowsHTML}</div>
        <p class="faint" style="margin-top:10px;">· "판매불가능"으로 설정된 상품은 수집되지 않으니 판매 상태를 꼭 확인해주세요.<br/>· 페이스북 카테고리 연결을 해제하거나 연결 상태의 카테고리를 삭제할 경우 상품 연동이 해제되니 유의해주세요.</p>`,
      footHTML: `
        <button class="btn" id="catmatch-later">다음에 반영</button>
        <button class="btn btn--primary" id="catmatch-apply">상품 피드 반영</button>
      `,
      onCloseAttempt: () => tryClose(false),
      onMount: (root) => {
        cats.forEach((c) => {
          const el = root.querySelector(`[data-cat="${c.id}"]`);
          ddControls[c.id] = UI.mountDropdown(el, {
            options: MOCK.gpcOptions,
            value: localMatch[c.id],
            placeholder: "카테고리를 선택해주세요",
            onChange: (val) => (localMatch[c.id] = val),
          });
        });

        root.querySelector("#catmatch-later").addEventListener("click", () => tryClose(false));
        root.querySelector("#catmatch-apply").addEventListener("click", () => {
          const matchedCount = Object.values(localMatch).filter(Boolean).length;
          if (matchedCount === 0) {
            UI.toast("매칭된 카테고리가 없습니다. 카테고리를 선택해 주세요.", "error");
            return;
          }
          App.state.categoryMatch = localMatch;
          // 매칭된 카테고리에 속하면서 아직 개별 매칭이 안 된 상품에 자동 반영
          cats.forEach((c) => {
            const target = localMatch[c.id];
            if (!target) return;
            MOCK.products.forEach((p) => {
              if (p.shopCategoryPath === c.path && !p.feedCategory) p.feedCategory = target;
            });
          });
          UI.toast("상품 카테고리 매칭이 저장되었습니다.", "success");
          UI.closeModal();
          App.render();
        });
      },
    });
  },

  /* ======================================================================
     상품 피드 탭
     ====================================================================== */
  renderFeedTab(root) {
    if (!this.state.connected) {
      root.innerHTML = emptyStateHTML(
        "비즈니스 자산 연동 후 상품 피드를 사용할 수 있습니다",
        "페이스북 채널 연동이 완료되면 상품 카탈로그가 자동으로 생성되고 Meta에 상품 피드가 연동됩니다.",
        "연결 관리 탭에서 비즈니스 자산 설정하기 버튼을 클릭해 카탈로그·Facebook 페이지·픽셀 등을 연동하면 상품 피드가 자동으로 활성화됩니다."
      );
      document.getElementById("empty-cta").addEventListener("click", () => {
        this.switchTab("conn");
        setTimeout(() => this.openFbeSimModal(), 150);
      });
      return;
    }

    const counts = statusCounts();
    const f = this.state.feed;
    let list = MOCK.products.filter((p) => (f.filter === "all" ? true : p.status === f.filter));
    if (f.search.trim()) list = list.filter((p) => p.name.toLowerCase().includes(f.search.trim().toLowerCase()));

    const totalPages = Math.max(1, Math.ceil(list.length / f.pageSize));
    if (f.page > totalPages) f.page = totalPages;
    const pageList = list.slice((f.page - 1) * f.pageSize, f.page * f.pageSize);

    const showReasonCol = f.filter === "rejected" || f.filter === "limited";

    root.innerHTML = `
      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">상품 피드</div><button class="btn btn--sm btn-detail">자세히 보기</button></div>
        <p class="section-desc">카탈로그 생성 이후 상품의 등록·수정·삭제 시 자동 업데이트되며, 최신 상품 정보가 Meta 채널에 반영될 수 있도록 관리합니다.</p>
      </div></div>

      <div class="card card--info"><div class="card__body">
        <div class="card__head">
          <div class="card__title">상품 피드 등록 현황</div>
          <button class="btn btn--sm" id="btn-catalog-goto">카탈로그 바로가기 ↗</button>
        </div>
        ${renderProgressBar(counts)}
      </div></div>

      <div class="subtabs" id="feed-subtabs">
        ${FILTER_ORDER.map(
          (k) =>
            `<button class="subtabs__item ${f.filter === k ? "is-active" : ""}" data-filter="${k}">${FILTER_LABEL[k]} (${k === "all" ? MOCK.products.length : counts[k] || 0})</button>`
        ).join("")}
      </div>

      <div class="card" style="border-top-left-radius:0; border-top-right-radius:0;"><div class="card__body">
        <div class="toolbar">
          <div class="search-box">🔍 <input type="text" id="feed-search" placeholder="상품명으로 검색" value="${f.search}" /></div>
          <select class="sel" id="feed-pagesize">
            <option value="20" ${f.pageSize === 20 ? "selected" : ""}>20개씩 보기</option>
            <option value="40" ${f.pageSize === 40 ? "selected" : ""}>40개씩 보기</option>
            <option value="60" ${f.pageSize === 60 ? "selected" : ""}>60개씩 보기</option>
            <option value="100" ${f.pageSize === 100 ? "selected" : ""}>100개씩 보기</option>
          </select>
        </div>

        <table class="table">
          <thead><tr>
            <th><input type="checkbox" id="feed-check-all" /></th>
            <th>상품 정보</th><th>상태</th><th>연동 상품 수</th><th>가격</th>
            <th>${showReasonCol ? "사유" : "페이스북 카테고리"}</th>
            <th>관리</th>
          </tr></thead>
          <tbody>
            ${
              pageList.length
                ? pageList
                    .map(
                      (p) => `
              <tr>
                <td><input type="checkbox" class="feed-row-check" data-id="${p.id}" ${f.selected.has(p.id) ? "checked" : ""}/></td>
                <td><div class="prod-cell"><div class="prod-thumb"></div><div><div class="prod-name">${p.name}</div><div class="prod-cat">${p.shopCategoryPath}</div></div></div></td>
                <td><span class="status-dot status-dot--${STATUS_META[p.status].dot}">${STATUS_META[p.status].label}</span></td>
                <td>${p.variantCount}</td>
                <td>${UI.won(p.price)}</td>
                <td>${
                  showReasonCol
                    ? `<span class="muted" style="font-size:11.5px;">${p.reasonCode ? MOCK.reasonMessages[p.reasonCode] : "-"}</span>`
                    : p.feedCategory
                    ? `<span style="font-size:11.5px;">${p.feedCategory}</span>`
                    : `<span class="faint">미설정</span>`
                }</td>
                <td><button class="btn btn--sm feed-detail-btn" data-id="${p.id}">상세</button></td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="6" style="text-align:center; color:#9ca3af; padding:30px;">표시할 상품이 없습니다.</td></tr>`
            }
          </tbody>
        </table>

        <div style="margin-top:14px;"><button class="btn" id="btn-bulk-edit">선택 수정</button></div>
        ${renderPagination(f.page, totalPages)}
      </div></div>
    `;

    document.getElementById("btn-catalog-goto").addEventListener("click", () =>
      UI.toast("새 탭에서 Meta 커머스 관리자(카탈로그)로 이동합니다. (프로토타입 시뮬레이션)", "success")
    );
    bindDetailButtons(root);

    root.querySelectorAll("#feed-subtabs [data-filter]").forEach((btn) =>
      btn.addEventListener("click", () => {
        f.filter = btn.dataset.filter;
        f.page = 1;
        this.renderFeedTab(root);
      })
    );

    const searchInput = document.getElementById("feed-search");
    let searchTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => {
        f.search = val;
        f.page = 1;
        this.renderFeedTab(root);
        document.getElementById("feed-search").focus();
        document.getElementById("feed-search").selectionStart = document.getElementById("feed-search").value.length;
      }, 250);
    });

    document.getElementById("feed-pagesize").addEventListener("change", (e) => {
      f.pageSize = Number(e.target.value);
      f.page = 1;
      this.renderFeedTab(root);
    });

    document.getElementById("feed-check-all").addEventListener("change", (e) => {
      pageList.forEach((p) => (e.target.checked ? f.selected.add(p.id) : f.selected.delete(p.id)));
      this.renderFeedTab(root);
    });
    root.querySelectorAll(".feed-row-check").forEach((cb) =>
      cb.addEventListener("change", (e) => {
        e.target.checked ? f.selected.add(cb.dataset.id) : f.selected.delete(cb.dataset.id);
      })
    );

    root.querySelectorAll(".feed-detail-btn").forEach((btn) =>
      btn.addEventListener("click", () => this.openSelectionMatchModal([btn.dataset.id]))
    );

    document.getElementById("btn-bulk-edit").addEventListener("click", () => {
      if (f.selected.size === 0) {
        UI.toast("선택된 상품이 없습니다.", "error");
        return;
      }
      this.openSelectionMatchModal(Array.from(f.selected));
    });

    root.querySelectorAll(".pagination button[data-page]").forEach((btn) =>
      btn.addEventListener("click", () => {
        f.page = Number(btn.dataset.page);
        this.renderFeedTab(root);
      })
    );
  },

  openSelectionMatchModal(ids) {
    const items = MOCK.products.filter((p) => ids.includes(p.id));
    const ddControls = {};

    const gridCols = "110px 80px minmax(160px,1fr) 60px 160px 230px 90px 90px";
    const rowsHTML = items
      .map(
        (p) => `
      <div class="grid-table__row" data-row="${p.id}" style="grid-template-columns:${gridCols};">
        <div><div class="toggle-group"><button type="button" class="use-on ${p.useYn ? "is-on" : ""}" data-id="${p.id}" data-val="1">사용</button><button type="button" class="use-off ${!p.useYn ? "is-on" : ""}" data-id="${p.id}" data-val="0">사용안함</button></div></div>
        <div><span class="status-dot status-dot--${STATUS_META[p.status].dot}">${STATUS_META[p.status].label}</span></div>
        <div><div class="prod-cell"><div class="prod-thumb" style="width:24px;height:24px;"></div>${p.name}</div></div>
        <div>${p.variantCount}</div>
        <div style="font-size:11.5px;">${p.shopCategoryPath}</div>
        <div class="dd" data-gpc="${p.id}"></div>
        <div><select class="sel gender-sel" data-id="${p.id}"><option value="unisex">남녀공용</option><option value="male">남성</option><option value="female">여성</option></select></div>
        <div><select class="sel age-sel" data-id="${p.id}"><option value="all">전연령</option><option value="adult">성인</option><option value="teen">청소년</option><option value="kids">어린이</option><option value="toddler">유아</option><option value="newborn">영아</option></select></div>
      </div>`
      )
      .join("");

    UI.openModal({
      title: "선택 상품 카테고리 매칭",
      size: "lg",
      descHTML:
        "제품 카테고리 매칭은 쇼핑몰의 상품 카테고리를 메타가 사용하는 표준 상품 분류 체계에 연결하는 것을 의미합니다. 사용여부를 통해 설정한 카테고리 매칭 정보를 상품 데이터 전송여부를 결정할 수 있습니다.",
      sideDesc: `
        <p>상품 목록에서 개별 선택한 상품들의 Meta 카테고리, 성별, 연령대를 한 번에 설정하는 화면입니다.</p>
        <p>제품 카테고리 매칭은 쇼핑몰의 상품 카테고리를 Meta가 사용하는 표준 상품 분류 체계에 연결하는 것을 의미합니다.</p>
        <p>사용여부를 함께 설정해 선택한 상품의 데이터를 Meta로 전송할지 여부를 개별적으로 제어할 수 있습니다.</p>
        <p>저장 시 변경된 값은 즉시 상품 피드에 반영됩니다.</p>
      `,
      bodyHTML: `
        <div class="grid-table" style="min-width:1000px;">
          <div class="grid-table__head" style="grid-template-columns:${gridCols};">
            <div>사용여부</div><div>승인상태</div><div>상품명</div><div>연동 상품 수</div><div>쇼핑몰 카테고리</div><div>페이스북 카테고리</div><div>성별</div><div>연령대</div>
          </div>
          ${rowsHTML}
        </div>
      `,
      footHTML: `
        <button class="btn" data-close="1">취소</button>
        <button class="btn btn--primary" id="selmatch-apply">상품 피드 반영</button>
      `,
      onMount: (root) => {
        const localState = {};
        items.forEach((p) => {
          localState[p.id] = { useYn: p.useYn, feedCategory: p.feedCategory, gender: p.gender || "unisex", ageGroup: p.ageGroup || "all" };

          const genderSel = root.querySelector(`.gender-sel[data-id="${p.id}"]`);
          const ageSel = root.querySelector(`.age-sel[data-id="${p.id}"]`);
          genderSel.value = localState[p.id].gender;
          ageSel.value = localState[p.id].ageGroup;

          function syncApparelFields(val) {
            const isApparel = (val || "").startsWith("의류 및 액세서리");
            genderSel.disabled = !isApparel;
            ageSel.disabled = !isApparel;
          }
          syncApparelFields(p.feedCategory);

          ddControls[p.id] = UI.mountDropdown(root.querySelector(`[data-gpc="${p.id}"]`), {
            options: MOCK.gpcOptions,
            value: p.feedCategory,
            placeholder: "카테고리를 선택해주세요",
            onChange: (val) => {
              localState[p.id].feedCategory = val;
              syncApparelFields(val);
            },
          });

          genderSel.addEventListener("change", (e) => (localState[p.id].gender = e.target.value));
          ageSel.addEventListener("change", (e) => (localState[p.id].ageGroup = e.target.value));

          root.querySelectorAll(`button[data-id="${p.id}"]`).forEach((btn) =>
            btn.addEventListener("click", () => {
              localState[p.id].useYn = btn.dataset.val === "1";
              root.querySelector(`.use-on[data-id="${p.id}"]`).classList.toggle("is-on", localState[p.id].useYn);
              root.querySelector(`.use-off[data-id="${p.id}"]`).classList.toggle("is-on", !localState[p.id].useYn);
            })
          );
        });

        root.querySelector("#selmatch-apply").addEventListener("click", () => {
          items.forEach((p) => {
            const s = localState[p.id];
            p.feedCategory = s.feedCategory;
            p.gender = s.gender;
            p.ageGroup = s.ageGroup;
            p.useYn = s.useYn;
            if (!s.useYn) p.status = "disabled";
            else if (p.status === "disabled") p.status = "review";
          });
          UI.toast("선택한 상품이 상품 피드에 반영되었습니다.", "success");
          UI.closeModal();
          App.render();
        });
      },
    });
  },

  /* ======================================================================
     광고 관리 탭
     ====================================================================== */
  renderAdsTab(root) {
    if (!this.state.connected) {
      root.innerHTML = emptyStateHTML(
        "비즈니스 자산 연동 후 광고 데이터를 확인할 수 있습니다",
        "페이스북 채널 연동이 완료되면 광고 계정이 연결되고 캠페인 성과 데이터를 메이크샵에서 조회할 수 있습니다.",
        null
      );
      document.getElementById("empty-cta").addEventListener("click", () => {
        this.switchTab("conn");
        setTimeout(() => this.openFbeSimModal(), 150);
      });
      return;
    }

    const a = this.state.ads;
    const perf = MOCK.perfByPeriod[a.period];
    const cols = this.state.campaignColumns;
    let campaigns = MOCK.campaigns;
    if (a.campaignSearch.trim()) campaigns = campaigns.filter((c) => c.name.toLowerCase().includes(a.campaignSearch.trim().toLowerCase()));

    root.innerHTML = `
      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">광고 관리</div><button class="btn btn--sm btn-detail">자세히 보기</button></div>
        <p class="section-desc">Meta 광고 운영 상태와 주요 정보를 확인하는 공간입니다. 성과 데이터는 Meta Marketing API 기준으로 제공됩니다.</p>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">광고 계정 정보</div><button class="btn btn--sm">⚙ 설정</button></div>
        <div class="kv-list">
          <div class="kv-row"><div class="kv-label">광고 계정명</div><div class="kv-value">${MOCK.adAccount.name} (${MOCK.adAccount.id})</div></div>
          <div class="kv-row"><div class="kv-label">계정 상태</div><div class="kv-value"><span class="badge badge--success">${MOCK.adAccount.status}</span></div></div>
          <div class="kv-row"><div class="kv-label">이번 달 광고 지출</div><div class="kv-value">${UI.won(MOCK.adAccount.monthSpend)}</div></div>
          <div class="kv-row"><div class="kv-label">잔여 크레딧</div><div class="kv-value">${UI.won(MOCK.adAccount.remainingCredit)} (${MOCK.adAccount.creditType})</div></div>
        </div>
        <div style="display:flex; gap:8px; margin-top:14px;">
          <span class="kv-link" id="lnk-billing">결제 수단 관리 ↗</span>
          <span class="kv-link" id="lnk-account-status">계정 상태 확인 ↗</span>
        </div>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">캠페인 성과 요약</div><button class="btn btn--sm" id="lnk-adsmanager">광고 관리자 바로가기 ↗</button></div>
        <div class="period-group">
          ${Object.keys(PERIOD_LABEL)
            .map((k) => `<button data-period="${k}" class="${a.period === k ? "is-active" : ""}">${PERIOD_LABEL[k]}</button>`)
            .join("")}
        </div>
        <div class="stat-grid">
          <div class="stat-item"><div class="label">노출수</div><div class="value">${UI.num(perf.impressions)}</div><div class="delta delta--up">↗ ${perf.deltaImp}% 전주 대비</div></div>
          <div class="stat-item"><div class="label">클릭수</div><div class="value">${UI.num(perf.clicks)}</div><div class="delta delta--up">↗ ${perf.deltaClk}% 전주 대비</div></div>
          <div class="stat-item"><div class="label">CTR</div><div class="value">${perf.ctr}%</div><div class="delta ${perf.deltaCtr >= 0 ? "delta--up" : "delta--down"}">${perf.deltaCtr >= 0 ? "↗" : "↘"} ${Math.abs(perf.deltaCtr)}% 전주 대비</div></div>
          <div class="stat-item"><div class="label">전환(구매)</div><div class="value">${UI.num(perf.purchases)}</div><div class="delta delta--up">↗ ${perf.deltaPur}% 전주 대비</div></div>
          <div class="stat-item"><div class="label">광고 지출</div><div class="value">${UI.num(perf.spend)}</div><div class="muted" style="font-size:11px;">ROAS ${perf.roas}x</div></div>
        </div>
        <p class="faint" style="margin-top:10px;">성과 데이터는 Meta Marketing API 기준이며 반영까지 최대 1일 이상 소요될 수 있습니다. 정확한 데이터는 Meta 광고 관리자에서 확인하세요.</p>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">캠페인 목록</div><button class="btn btn--sm" id="btn-col-settings">⚙ 항목</button></div>
        <div class="toolbar">
          <div class="search-box">🔍 <input type="text" id="campaign-search" placeholder="캠페인명으로 검색" value="${a.campaignSearch}" /></div>
        </div>
        <table class="table">
          <thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
          <tbody>
            ${
              campaigns.length
                ? campaigns
                    .map(
                      (c) => `<tr>${cols
                        .map((col) => `<td>${formatCampaignCell(c, col.key)}</td>`)
                        .join("")}</tr>`
                    )
                    .join("")
                : `<tr><td colspan="${cols.length}" style="text-align:center; color:#9ca3af; padding:30px;">검색 결과가 없습니다.</td></tr>`
            }
          </tbody>
        </table>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__title">전환 추적 설정</div>
        <p class="section-desc">외부 간편결제(네이버페이 주문형/카카오톡 체크아웃) 구매 건을 Meta 전환으로 수집할지 설정하는 영역입니다.</p>
        <div class="kv-row">
          <div class="kv-label">네이버페이 구매 전환</div>
          <div class="kv-value">
            <div class="toggle-group" id="toggle-naver">
              <button data-val="1" class="${this.state.conversion.naverPay ? "is-on" : ""}">사용</button>
              <button data-val="0" class="${!this.state.conversion.naverPay ? "is-on" : ""}">사용안함</button>
            </div>
          </div>
        </div>
        <div class="kv-row">
          <div class="kv-label">톡 체크아웃 구매 전환</div>
          <div class="kv-value">
            <div class="toggle-group" id="toggle-kakao">
              <button data-val="1" ${this.state.conversion.kakaoEligible ? "" : "disabled"} class="${this.state.conversion.kakaoCheckout ? "is-on" : ""}">사용</button>
              <button data-val="0" ${this.state.conversion.kakaoEligible ? "" : "disabled"} class="${!this.state.conversion.kakaoCheckout ? "is-on" : ""}">사용안함</button>
            </div>
            ${!this.state.conversion.kakaoEligible ? `<span class="faint" style="margin-left:8px;">ⓘ 카카오 연동 설정에서 톡 체크아웃 연동을 먼저 완료해야 사용할 수 있습니다.</span>` : ""}
          </div>
        </div>
        <button class="btn btn--primary" id="btn-save-conversion" style="margin-top:14px;">저장</button>
      </div></div>
    `;

    root.querySelectorAll("[data-period]").forEach((btn) =>
      btn.addEventListener("click", () => {
        a.period = btn.dataset.period;
        this.renderAdsTab(root);
      })
    );
    ["lnk-billing", "lnk-account-status", "lnk-adsmanager"].forEach((id) =>
      document.getElementById(id).addEventListener("click", () => UI.toast("새 탭에서 Meta 광고 관리자로 이동합니다. (프로토타입 시뮬레이션)", "success"))
    );

    let campTimer;
    document.getElementById("campaign-search").addEventListener("input", (e) => {
      clearTimeout(campTimer);
      const val = e.target.value;
      campTimer = setTimeout(() => {
        a.campaignSearch = val;
        this.renderAdsTab(root);
      }, 250);
    });

    document.getElementById("btn-col-settings").addEventListener("click", () => this.openColumnSettingsModal());

    const naverGroup = document.getElementById("toggle-naver");
    naverGroup.querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", () => {
        this.state.conversion.naverPay = btn.dataset.val === "1";
        this.renderAdsTab(root);
      })
    );
    const kakaoGroup = document.getElementById("toggle-kakao");
    kakaoGroup.querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        this.state.conversion.kakaoCheckout = btn.dataset.val === "1";
        this.renderAdsTab(root);
      })
    );
    document.getElementById("btn-save-conversion").addEventListener("click", () => UI.toast("전환 추적 설정이 저장되었습니다.", "success"));
    bindDetailButtons(root);
  },

  /* ======================================================================
     Shops 관리 탭
     ====================================================================== */
  renderShopsTab(root) {
    if (!this.state.connected) {
      root.innerHTML = emptyStateHTML(
        "비즈니스 자산 연동 후 Shops 연결 정보를 확인할 수 있습니다",
        "Meta 비즈니스 연동이 완료되면 커머스 계정·카탈로그가 연결되고, Facebook·Instagram Shops 설정 화면으로 바로 이동할 수 있습니다.",
        null
      );
      document.getElementById("empty-cta").addEventListener("click", () => {
        this.switchTab("conn");
        setTimeout(() => this.openFbeSimModal(), 150);
      });
      return;
    }

    const acc = MOCK.account;
    const igConnected = acc.instagramConnected;

    root.innerHTML = `
      <div class="card"><div class="card__body">
        <div class="shop-intro">
          <div class="shop-intro__text">
            <div class="shop-intro__title">Facebook 및 Instagram Shops를 시작해보세요</div>
            <p class="section-desc" style="margin-top:8px;">Meta Shops를 이용하면 메이크샵 상품을 Facebook과 Instagram에서 고객에게 노출할 수 있습니다. 상품 정보는 연결된 Meta 제품 카탈로그를 통해 제공되며, Shop 생성 및 판매 채널 설정은 Meta Commerce Manager에서 진행할 수 있습니다.</p>
          </div>
          <div class="shop-intro__visual">Facebook · Instagram<br/>Shopping</div>
        </div>
      </div></div>

      <div class="card"><div class="card__body">
        <div class="card__head"><div class="card__title">연결된 Shop 정보</div><button class="btn btn--sm" id="btn-shop-commerce-manager">Commerce Manager에서 관리 ↗</button></div>
        <div class="kv-list">
          <div class="kv-row"><div class="kv-label">Commerce Account</div><div class="kv-value">${acc.commerceAccountName}</div></div>
          <div class="kv-row" style="border-bottom:none;"><div class="kv-label">연결된 Catalog</div><div class="kv-value">${acc.catalogName}</div></div>
        </div>
        <p class="faint" style="margin-top:10px;">ⓘ Shop 심사·승인 상태는 Meta API로 신뢰성 있게 조회 가능한 값이 확인되지 않아 표시하지 않습니다. (05_Policy 3-2장·13장)</p>
      </div></div>

      <div class="card__title" style="font-size:14px; margin:4px 0 12px;">판매 채널</div>

      <div class="channel-grid">
        <div class="card channel-card"><div class="card__body">
          <div class="channel-card__head">
            <span class="channel-icon channel-icon--fb">FB</span>
            <span class="card__title">Facebook Shop</span>
          </div>
          <p class="section-desc">Facebook에서 상품을 소개하고 고객이 쇼핑몰 상품을 발견할 수 있도록 설정합니다.</p>
          <div class="kv-row" style="border-bottom:none; padding-top:6px;">
            <div class="kv-label">연결된 Facebook Page</div>
            <div class="kv-value">${acc.pageName}</div>
          </div>
          <p class="faint">※ 전 자산 필수 수신 정책상 Facebook 페이지는 항상 연결되어 있습니다.</p>
          <button class="btn btn--fb" id="btn-shop-fb-setup" style="margin-top:10px;">Facebook Shop 설정하기 ↗</button>
        </div></div>

        <div class="card channel-card"><div class="card__body">
          <div class="channel-card__head">
            <span class="channel-icon channel-icon--ig">IG</span>
            <span class="card__title">Instagram Shop</span>
          </div>
          <p class="section-desc">Instagram 프로필과 상품을 연결하여 고객이 게시물과 Shop에서 상품을 발견할 수 있도록 설정합니다.</p>
          <div class="kv-row" style="border-bottom:none; padding-top:6px;">
            <div class="kv-label">연결된 Instagram Account</div>
            <div class="kv-value">${igConnected ? "@" + acc.instagramUsername : `<span class="badge badge--neutral">미연결</span>`}</div>
          </div>
          ${
            igConnected
              ? `<button class="btn" style="background:#e1306c; border-color:#e1306c; color:#fff; margin-top:10px;" id="btn-shop-ig-setup">Instagram Shop 설정하기 ↗</button>`
              : `<button class="btn btn--primary" id="btn-shop-ig-connect" style="margin-top:10px;">연결 관리 탭에서 Instagram 계정 연결하기</button>`
          }
        </div></div>
      </div>

      <div class="card card--info"><div class="card__body">
        <div class="card__head"><div class="card__title">안내 사항</div><button class="btn btn--sm" id="btn-shop-guide">Meta Shops 가이드 보기 ↗</button></div>
        <ul class="guide-list">
          <li>Facebook 및 Instagram Shops 설정은 Meta Commerce Manager에서 진행합니다.</li>
          <li>Shop에 노출되는 상품은 연결된 Meta 제품 카탈로그의 상품 정보를 사용합니다.</li>
          <li>메이크샵에서는 상품 피드를 통해 Meta 제품 카탈로그의 상품 정보를 관리합니다.</li>
          <li>실제 Shop 사용 가능 여부 및 심사/승인 상태는 Meta 정책에 따라 결정됩니다.</li>
        </ul>
      </div></div>
    `;

    // 외부 이동 버튼 4종: 정확한 목적지 URL이 05_Policy 13장 검증에서 확인되지 않아
    // 실제 이동을 시뮬레이션하지 않고 "확인 필요(TODO)" 상태를 명시적으로 알린다.
    ["btn-shop-commerce-manager", "btn-shop-fb-setup", "btn-shop-ig-setup", "btn-shop-guide"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", () => todoExternalLink());
    });

    const igConnectBtn = document.getElementById("btn-shop-ig-connect");
    if (igConnectBtn) {
      igConnectBtn.addEventListener("click", () => {
        this.switchTab("conn");
        UI.toast("연결 관리 탭으로 이동했습니다. Instagram 계정을 연결해 주세요.", "success");
      });
    }
  },

  openColumnSettingsModal() {
    let available = MOCK.campaignColumns.available.slice();
    let selected = this.state.campaignColumns.slice();
    let armedLeft = null;
    let armedRight = null;

    function renderLists(root) {
      const leftBox = root.querySelector("#col-available");
      const rightBox = root.querySelector("#col-selected");
      leftBox.innerHTML = available
        .map((c) => `<div class="dual-list__row ${armedLeft === c.key ? "is-selected" : ""}" data-key="${c.key}"><span>${c.label}</span><span class="desc">${c.desc}</span></div>`)
        .join("");
      rightBox.innerHTML = selected
        .map(
          (c) =>
            `<div class="dual-list__row ${armedRight === c.key ? "is-selected" : ""}" data-key="${c.key}"><span>${c.fixed ? `<span class="fixed-tag">*</span>` : ""}${c.label}</span><span class="desc">${c.desc}</span></div>`
        )
        .join("");

      leftBox.querySelectorAll(".dual-list__row").forEach((row) =>
        row.addEventListener("click", () => {
          armedLeft = armedLeft === row.dataset.key ? null : row.dataset.key;
          renderLists(root);
        })
      );
      rightBox.querySelectorAll(".dual-list__row").forEach((row) =>
        row.addEventListener("click", () => {
          armedRight = armedRight === row.dataset.key ? null : row.dataset.key;
          renderLists(root);
        })
      );
    }

    UI.openModal({
      title: "목록 타이틀 양식 관리",
      size: "lg",
      sideDesc: `
        <p>캠페인 목록 화면에 표시할 항목(컬럼)을 선택하는 화면입니다.</p>
        <p>왼쪽에서 표시할 항목을 선택해 오른쪽으로 이동시키면 캠페인 목록에 해당 컬럼이 추가됩니다.</p>
        <p>오른쪽 목록에서는 항목의 노출 순서를 위아래로 조정할 수 있습니다.</p>
        <p>기본값으로 초기화 버튼을 누르면 메이크샵이 제공하는 기본 컬럼 구성으로 되돌아갑니다.</p>
      `,
      bodyHTML: `
        <div class="dual-list">
          <div class="dual-list__col">
            <div class="section-desc">선택 가능한 타이틀 목록</div>
            <div class="dual-list__box" id="col-available"></div>
          </div>
          <div class="dual-list__actions">
            <button id="col-move-right" title="추가">›</button>
            <button id="col-move-left" title="제외">‹</button>
          </div>
          <div class="dual-list__col">
            <div class="section-desc">선택한 타이틀 목록</div>
            <div class="dual-list__box" id="col-selected"></div>
          </div>
          <div class="dual-list__reorder">
            <button id="col-up" title="위로">↑</button>
            <button id="col-down" title="아래로">↓</button>
          </div>
        </div>
        <button class="btn btn--sm" id="col-reset" style="margin-top:14px;">기본값으로 초기화</button>
      `,
      footHTML: `<button class="btn" data-close="1">취소</button><button class="btn btn--primary" id="col-save">저장</button>`,
      onMount: (root) => {
        renderLists(root);

        root.querySelector("#col-move-right").addEventListener("click", () => {
          if (!armedLeft) return;
          const idx = available.findIndex((c) => c.key === armedLeft);
          if (idx > -1) {
            selected.push(available[idx]);
            available.splice(idx, 1);
          }
          armedLeft = null;
          renderLists(root);
        });
        root.querySelector("#col-move-left").addEventListener("click", () => {
          if (!armedRight) return;
          const item = selected.find((c) => c.key === armedRight);
          if (item && item.fixed) {
            UI.toast("캠페인명은 고정 제공되어 컬럼 해제가 불가능합니다.", "error");
            return;
          }
          const idx = selected.findIndex((c) => c.key === armedRight);
          if (idx > -1) {
            available.push(selected[idx]);
            selected.splice(idx, 1);
          }
          armedRight = null;
          renderLists(root);
        });
        root.querySelector("#col-up").addEventListener("click", () => {
          const idx = selected.findIndex((c) => c.key === armedRight);
          if (idx > 0) {
            [selected[idx - 1], selected[idx]] = [selected[idx], selected[idx - 1]];
            renderLists(root);
          }
        });
        root.querySelector("#col-down").addEventListener("click", () => {
          const idx = selected.findIndex((c) => c.key === armedRight);
          if (idx > -1 && idx < selected.length - 1) {
            [selected[idx + 1], selected[idx]] = [selected[idx], selected[idx + 1]];
            renderLists(root);
          }
        });
        root.querySelector("#col-reset").addEventListener("click", () => {
          selected = JSON.parse(JSON.stringify(MOCK.campaignColumns.selected));
          available = JSON.parse(JSON.stringify(MOCK.campaignColumns.available));
          armedLeft = armedRight = null;
          renderLists(root);
        });
        root.querySelector("#col-save").addEventListener("click", () => {
          App.state.campaignColumns = selected;
          UI.closeModal();
          UI.toast("캠페인 목록 항목 설정이 저장되었습니다.", "success");
          App.render();
        });
      },
    });
  },
};

/* ---------------- helpers ---------------- */
// Shops 관리 탭의 외부 이동 버튼(Commerce Manager/Facebook Shop 설정/Instagram Shop 설정/가이드)은
// 정확한 목적지 URL이 05_Policy 13장 검증에서 확인되지 않아 임의 URL을 생성하지 않는다(TODO).
function todoExternalLink() {
  UI.toast("TODO: 실제 이동 URL 확인 필요 (05_Policy 9-1장) — 프로토타입에서는 이동을 시뮬레이션하지 않습니다.", "error");
}

function bindDetailButtons(root) {
  root.querySelectorAll(".btn-detail").forEach((btn) =>
    btn.addEventListener("click", () => UI.toast("새 탭에서 도움말 문서로 이동합니다. (프로토타입 시뮬레이션)", "success"))
  );
}

function statusCounts() {
  const c = { active: 0, review: 0, rejected: 0, limited: 0, disabled: 0 };
  MOCK.products.forEach((p) => c[p.status]++);
  return c;
}

function anyCategoryMatched(map) {
  return Object.values(map).some(Boolean);
}

function renderProgressBar(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const segs = [
    { key: "active", color: "#22c55e" },
    { key: "review", color: "#000000" },
    { key: "rejected", color: "#ef4444" },
    { key: "limited", color: "#f59e0b" },
    { key: "disabled", color: "#d1d5db" },
  ];
  return `
    <div class="progress">${segs.map((s) => `<span style="width:${(counts[s.key] / total) * 100}%; background:${s.color};"></span>`).join("")}</div>
    <div class="legend">
      ${segs.map((s) => `<span><i style="background:${s.color};"></i>${STATUS_META[s.key].label}: ${counts[s.key]}개</span>`).join("")}
    </div>
  `;
}

function renderPagination(page, totalPages) {
  let btns = "";
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button data-page="${i}" class="${i === page ? "is-active" : ""}">${i}</button>`;
  }
  return `<div class="pagination">
    <button data-page="1" ${page === 1 ? "disabled" : ""}>«</button>
    <button data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""}>‹</button>
    ${btns}
    <button data-page="${Math.min(totalPages, page + 1)}" ${page === totalPages ? "disabled" : ""}>›</button>
    <button data-page="${totalPages}" ${page === totalPages ? "disabled" : ""}>»</button>
  </div>`;
}

function emptyStateHTML(headline, desc, hint) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon">${META_ICON_SVG}</div>
      <h2>${headline}</h2>
      <p>${desc}</p>
      <button class="btn btn--primary" id="empty-cta">⚙ 비즈니스 자산 설정하기</button>
      ${hint ? `<div class="hint">ⓘ ${hint}</div>` : ""}
    </div>
  `;
}

const META_ICON_SVG = `<span class="meta-icon-glyph">∞</span>`;

function formatCampaignCell(c, key) {
  const reach = Math.round(c.impressions * 0.62);
  switch (key) {
    case "name": return c.name;
    case "objective": return c.objective;
    case "startDate": return c.startDate;
    case "endDate": return c.endDate;
    case "impressions": return UI.num(c.impressions);
    case "clicks": return UI.num(c.clicks);
    case "purchases": return UI.num(c.purchases);
    case "roas": return `<span style="color:${c.roas >= 3 ? "#059669" : "#dc2626"}">${c.roas}x</span>`;
    case "revenue": return UI.num(c.revenue);
    case "cost": return UI.num(c.cost);
    case "reach": return UI.num(reach);
    case "frequency": return (c.impressions / reach).toFixed(2);
    case "cpm": return UI.num(Math.round((c.cost / c.impressions) * 1000));
    case "ctr": return ((c.clicks / c.impressions) * 100).toFixed(2) + "%";
    case "cpc": return UI.num(Math.round(c.cost / c.clicks));
    case "cartAdd": return UI.num(Math.round(c.clicks * 0.35));
    case "checkoutStart": return UI.num(Math.round(c.clicks * 0.18));
    case "cvr": return ((c.purchases / c.clicks) * 100).toFixed(2) + "%";
    case "cpa": return UI.num(Math.round(c.cost / c.purchases));
    default: return "-";
  }
}

/* ---------------- QA 상태 미리보기 (프로토타입 전용) ----------------
   연결 관리/상품 피드/광고 관리/Shops 관리 4개 탭 모두 App.state.connected 값에 따라
   미연동/연동완료 화면으로 크게 분기되고, Shops 탭은 추가로 MOCK.account.instagramConnected
   값에 따라 Instagram Shop 카드 내용이 달라진다. 두 값은 FBE 연동 팝업(onboarding)을
   처음부터 다시 진행해야 재현되므로, QA 확인을 위해 하단 드롭다운으로 즉시 전환할 수 있게 한다. */
const QA_STATES = [
  { value: "미연동", label: "미연동" },
  { value: "연동완료-IG연동", label: "연동완료 (Instagram 연동)" },
  { value: "연동완료-IG미연동", label: "연동완료 (Instagram 미연동)" },
];

function currentQaState() {
  if (!App.state.connected) return "미연동";
  return MOCK.account.instagramConnected ? "연동완료-IG연동" : "연동완료-IG미연동";
}

function applyQaState(value) {
  if (value === "미연동") {
    App.state.connected = false;
  } else {
    App.state.connected = true;
    MOCK.account.instagramConnected = value === "연동완료-IG연동";
  }
  App.render();
}

function syncQaToolbar() {
  const sel = document.getElementById("qa-state-select");
  if (sel) sel.value = currentQaState();
}

function setupQaToolbar() {
  const sel = document.getElementById("qa-state-select");
  QA_STATES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.value;
    opt.textContent = s.label;
    sel.appendChild(opt);
  });
  sel.value = currentQaState();
  sel.addEventListener("change", () => applyQaState(sel.value));
}

document.addEventListener("DOMContentLoaded", () => {
  setupQaToolbar();
  App.init();
});
