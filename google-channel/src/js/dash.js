/* 연결 관리 탭 — 렌더링 로직
   근거(Source of Truth): 04_Screen-Spec/01. 연결관리 탭/*.svg, 05_Policy/01. 연결관리 탭/1-1~1-6 정책.pdf
   real HTML/CSS/JS로 재구현(이미지/embed 사용 금지). */

(function () {
  const M = () => window.MOCK_DASH;
  let mount;
  let card = freshCard();

  function freshCard() {
    return {
      mc: "empty",          // empty | checklist | domainShipping | done
      checklist: { connect: true, ssl: false, policy: false, payment: false },
      domain: "idle",       // idle | verifying | done | failed — failed 근거: 1-6장 6-3-2(쇼핑몰 도메인 인증 상태 4종 중 인증 실패)
      domainFailReason: "", // domain === "failed"일 때만 사용
      domainVerifyStep: 0,  // 0~4 — domain === "verifying"일 때만 의미 있음(대표 도메인 조회/HTTPS 확인/Google 소유권 인증/MC 웹사이트 연결 4단계 진행률)
      shipping: "idle",     // idle | done
      shippingMethod: null, // null | auto | direct — card.shipping === "done"일 때만 의미 있음. 판매 국가는 auto일 때 항상 "대한민국" 고정값이라 별도 상태로 저장하지 않는다
      ads: "empty",         // empty | done | failed
      adsFailureReasonIdx: 0, // ads === "failed"일 때 MOCK_DASH.adsFailureReasons 중 노출할 대표 사유 인덱스
      feedConnected: false,
      adsShoppingBlocked: false // 연동완료-부분(Ads만 연동).svg 원본이 MC 연결 상태에서도 "사용 불가"로 표기하는 상태를 그대로 반영
    };
  }

  // 계정 상태 배지 — 06_카드_화면_정책.md 2장·3-3장·4-3장. 색상 등급: 정상=초록, 주의(재인증 필요)=노랑, 위험(정지됨)=빨강
  const BADGE_TONE_CLASS = { success: "gc-badge-success", warning: "gc-badge-warning", danger: "gc-badge-danger" };
  function accountStatusBadge(status, statusMap) {
    const s = statusMap[status] || statusMap.connected;
    return `<span class="gc-badge ${BADGE_TONE_CLASS[s.tone]}">${s.label}</span>`;
  }

  function introBox() {
    return `
      <div class="gc-box gc-mt-16" style="margin-bottom:50px;">
        <div class="gc-box-title" style="font-size:15px;">연결 관리</div>
        <div class="gc-box-desc" style="margin-bottom:0;">Google 쇼핑 기능을 사용하기 위해 필요한 계정을 연결하는 공간입니다. Google 로그인으로 Google Merchant Center와 Google Ads 계정을 연결하면 등록한 상품을 Google 쇼핑에 노출하고 쇼핑 광고에 활용할 수 있습니다.<br>연결이 완료되면 현재 연결된 계정과 상태를 확인할 수 있으며, 상품 정보 관리와 쇼핑 광고 운영을 메이크샵에서 편리하게 이용할 수 있습니다.</div>
      </div>`;
  }

  // ===================== state="미연동" (SCR-GOOGLE-DASH-001-미연동.svg) =====================
  function renderDisconnected() {
    mount.innerHTML = `
      ${introBox()}
      <div class="gc-section">
        <div class="gc-section-title">Google 계정 연동</div>
        <div class="gc-box gc-flex" style="gap:14px;">
          <span class="gc-small gc-muted">GMC 설정</span>
          <span class="gc-info-icon">?</span>
          <button class="gc-btn gc-btn-primary" id="btn-start" style="margin-left:8px;">Google 계정으로 시작하기</button>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">Google 계정 연동 진행 순서</div>
        <div class="gc-box">
          <div class="gc-flex" style="justify-content:space-between;">
            ${stepNode(1, "개인정보 수집·제공 동의", true)}${stepConnector()}${stepNode(2, "Google 로그인", false)}${stepConnector()}${stepNode(3, "구글 계정 액세스 요청", false)}
          </div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">Google 채널 연동 안내</div>
        <div class="gc-box">
          <div class="gc-small gc-muted" style="margin-bottom:16px;">연동 전 알아두면 좋은 내용이에요.</div>
          <div class="gc-grid-2">
            ${benefitItem("①", "광고비 없이 상품이 노출돼요", ["쇼핑몰 상품이 구글 쇼핑 탭과 검색 결과 화면에 무료로 나타나요.", "별도 광고 캠페인을 만들지 않아도 상품 정보만으로 자동 등록돼요.", "사람들이 구글에서 물건을 검색할 때 자연스럽게 노출 기회가 생겨요."])}
            ${benefitItem("②", "쓴 만큼만 비용이 나가요", ["손님이 상품을 클릭했을 때만 비용이 발생해요.", "하루 또는 전체 예산 한도를 직접 정해서 그 이상 쓰이지 않게 막을 수 있어요.", "광고를 언제든 멈추면 그 순간부터 비용 지출도 함께 멈춰요."])}
            ${benefitItem("③", "상품을 두 번 등록할 필요 없어요", ["쇼핑몰에 상품을 올리면 구글에도 같은 상품이 자동으로 만들어져요.", "가격을 바꾸거나 품절 처리해도 구글 쪽 정보가 함께 바뀌어요.", "엑셀로 옮기거나 하나씩 다시 입력하는 수고를 덜 수 있어요."])}
            ${benefitItem("④", "이미 검색하고 있는 손님을 만나요", ["많은 사람이 물건을 사기 전 구글에서 먼저 검색해봐요.", "구글과 상품을 연동하면 바로 그 검색 결과 화면에 내 상품이 나타나요.", "이미 살 마음이 있는 사람에게 보여지는 만큼 실제 구매로 이어질 가능성이 높아요."])}
          </div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">연동 전 준비사항</div>
        <div class="gc-box">
          <div class="gc-small gc-muted" style="margin-bottom:16px;">Google Merchant Center 승인을 위해 아래 요구사항을 충족해야 합니다. (연동 전·후 상시 확인 가능)</div>
          <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px;">
            ${prereqItem("01", "SSL 인증 도메인", "HTTPS(SSL) 적용, 도메인 인증")}
            ${prereqItem("02", "사업자 및 쇼핑몰 정보", "사업자 정보, 고객센터 연락처 및 주소")}
            ${prereqItem("03", "쇼핑몰 운영 정책", "개인정보처리방침, 쇼핑몰 이용약관, 배송 및 교환/환불 정책")}
            ${prereqItem("04", "Google 연동 준비", "Google 계정 준비, Merchant Center 생성 및 도메인 인증")}
          </div>
        </div>
      </div>
    `;
    mount.querySelector("#btn-start").addEventListener("click", () => openOnboardingFlow());
    syncOtherTabs(false);
  }

  // ---------- 실제 연동 상태를 상품피드/Google Ads 탭에도 반영 (하단 QA 드롭다운과 무관하게 실제 흐름이 우선) ----------
  function syncOtherTabs(googleConnected) {
    const feedState = !googleConnected ? "계정미연동" : (card.mc !== "done" ? "GMC미연동" : (card.feedConnected ? "정상" : "상품피드미연동"));
    const adsState = !googleConnected ? "구글계정미연동" : (card.ads !== "done" ? "Ads계정미연동" : "연동완료");
    const feedSel = document.getElementById("dev-feed-state");
    if (feedSel && window.GC_FEED) {
      feedSel.value = feedState;
      window.GC_FEED.render(document.getElementById(window.GC_FEED.mountId), feedState);
    }
    const adsSel = document.getElementById("dev-ads-state");
    if (adsSel && window.GC_ADS) {
      adsSel.value = adsState;
      window.GC_ADS.render(document.getElementById(window.GC_ADS.mountId), adsState);
    }
  }

  function stepNode(n, label, current) {
    return `<div style="text-align:center; flex:1;">
      <div style="width:26px;height:26px;border-radius:50%;background:${current ? "var(--gc-primary)" : "#fff"};border:2px solid ${current ? "var(--gc-primary)" : "var(--gc-border-strong)"};color:${current ? "#fff" : "var(--gc-text-faint)"};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin:0 auto 8px;">${n}</div>
      <div class="gc-small" style="color:${current ? "var(--gc-primary)" : "var(--gc-text-faint)"}; font-weight:${current ? "700" : "400"};">${label}</div>
    </div>`;
  }
  function stepConnector() { return `<div style="flex:2;height:1px;background:var(--gc-line-soft);margin-top:13px;"></div>`; }

  // ---------- 판매자센터 연결 진행 순서 (AREA-DASHBOARD-STEPFLOW, 5단계) ----------
  // 근거: SCR-GOOGLE-DASH-001-미연동-05_MC연결-0_시작안내모달.png / -06_MC연결완료-후속설정.png
  function mcStepNode(n, label, status) {
    const done = status === "done";
    const active = status === "active";
    const circleBg = done ? "var(--gc-success)" : "#fff";
    const circleBorder = done ? "var(--gc-success)" : active ? "var(--gc-primary)" : "var(--gc-border-strong)";
    const textColor = done ? "var(--gc-success)" : active ? "var(--gc-primary)" : "var(--gc-text-faint)";
    return `<div style="text-align:center; flex:1;">
      <div style="width:26px;height:26px;border-radius:50%;background:${circleBg};border:2px solid ${circleBorder};color:${done ? "#fff" : active ? "var(--gc-primary)" : "var(--gc-text-faint)"};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin:0 auto 8px;">${done ? "✓" : n}</div>
      <div class="gc-small" style="color:${textColor}; font-weight:${done || active ? "700" : "400"};">${label}</div>
    </div>`;
  }
  function mcStepflowVisible() { return card.mc === "checklist" || card.mc === "domainShipping"; }
  function mcStepflowSection() {
    const s1 = "done"; // 판매자 센터 정보 설정(체크리스트)은 이 섹션이 노출되는 시점엔 이미 완료된 상태
    const s2 = card.mc === "domainShipping" ? "done" : "active"; // Merchant Center 연결(계정선택~약관동의 4단계)
    const domainDone = card.domain === "done";
    const shippingDone = card.shipping === "done";
    const s3 = card.mc !== "domainShipping" ? "pending" : (domainDone ? "done" : "active");
    const s4 = card.mc !== "domainShipping" ? "pending" : (shippingDone ? "done" : "active");
    const s5 = "pending"; // 연동 완료 — 도달 시 카드가 card.mc="done"으로 전환되며 이 섹션 자체가 사라짐
    return `
      <div class="gc-section">
        <div class="gc-section-title">판매자센터 연결 진행 순서</div>
        <div class="gc-box">
          <div class="gc-flex" style="justify-content:space-between;">
            ${mcStepNode(1, "판매자 센터<br>정보 설정", s1)}${stepConnector()}${mcStepNode(2, "Merchant Center<br>연결", s2)}${stepConnector()}${mcStepNode(3, "쇼핑몰 도메인<br>인증", s3)}${stepConnector()}${mcStepNode(4, "판매국가·배송<br>설정", s4)}${stepConnector()}${mcStepNode(5, "연동 완료", s5)}
          </div>
        </div>
      </div>`;
  }
  function benefitItem(num, title, bullets) {
    return `<div class="gc-subbox">
      <div class="gc-subbox-title">${num} ${title}</div>
      <ul class="gc-small gc-muted gc-mt-8" style="line-height:1.9;">
        ${bullets.map((b) => `<li>· ${b}</li>`).join("")}
      </ul>
    </div>`;
  }
  function prereqItem(num, title, desc) {
    return `<div style="border:1px dashed var(--gc-border-strong); border-radius:var(--gc-radius-sm); padding:14px;">
      <div class="gc-small" style="font-weight:700; margin-bottom:6px;">${num} ${title}</div>
      <div class="gc-faint" style="font-size:11px; line-height:1.6;">${desc}</div>
    </div>`;
  }

  // ---------- 동의 모달 공통 헬퍼 (번호 박스 + 체크 전/후 버튼 상태) ----------
  // 근거: 미연동-01_개인정보동의-모달 / 05_MC연결-2_사업자정보제공동의모달 / 05_MC연결-4_약관동의 / Ads연결-0_약관동의
  // 공통 패턴: 항목별 회색 박스 나열 + 체크박스 → 체크 전 회색(비활성) 버튼, 체크 후 검정(활성) 버튼
  function consentBoxes(sections) {
    return sections.map((s) => `
      <div class="gc-consent-box">
        <div class="t">${s.title}</div>
        <div class="d">${s.body}</div>
      </div>`).join("");
  }
  function bindConsentGate(bd, checkboxSel, btnSel) {
    const cb = bd.querySelector(checkboxSel);
    const btn = bd.querySelector(btnSel);
    const sync = () => {
      btn.disabled = !cb.checked;
      btn.classList.toggle("gc-btn-gated", !cb.checked);
      btn.classList.toggle("gc-btn-dark", cb.checked);
    };
    cb.addEventListener("change", sync);
    sync();
  }

  // ---------- Google 실제 화면(브라우저 크롬 + Google 스타일) 공통 헬퍼 ----------
  // 근거: 미연동-02_Google로그인-계정선택/이메일입력/비밀번호입력, 미연동-03_접근권한동의, Ads연결-2_OAuth동의
  function gWordmark() { return `<div class="gc-glogo"><b>G</b><b>o</b><b>o</b><b>g</b><b>l</b><b>e</b></div>`; }
  function gShell(bodyHtml, hint = "accounts.google.com/signin/v2/identifier?client_id=makeshop...") {
    return `<div class="gc-gframe" style="margin:0 auto; box-shadow:none;">
      <div class="gc-gframe-bar">
        <span class="dot" style="background:#ff5f57;"></span>
        <span class="dot" style="background:#febc2e;"></span>
        <span class="dot" style="background:#28c840;"></span>
        <span style="flex:1;"></span>
        <button id="g-frame-close" style="border:none;background:none;cursor:pointer;color:#5f6368;font-size:13px;line-height:1;padding:2px;">✕</button>
      </div>
      <div class="gc-gframe-url"><span style="width:9px;height:9px;background:#5f6368;border-radius:2px;display:inline-block;flex:none;"></span>${hint}</div>
      <div class="gc-gframe-body">${bodyHtml}</div>
    </div>`;
  }
  function bindGShellClose(bd, onClose) {
    const btn = bd.querySelector("#g-frame-close");
    if (btn) btn.addEventListener("click", onClose || (() => GC.closeModal(bd)));
  }
  function gAccountSelectBody(acc) {
    return `
      ${gWordmark()}
      <div class="gc-gtitle">계정 선택</div>
      <div class="gc-gsub">MakeShop(으)로 계속하려면 Google 계정을 선택하세요</div>
      <button class="gc-gchip" id="g-acc-existing" style="width:100%;margin-bottom:10px;">
        <span class="av">${GC.esc(acc.email[0].toUpperCase())}</span>
        <span><b style="display:block;font-size:14px;font-weight:400;">${GC.esc(acc.name)}</b><span style="font-size:12px;color:#5f6368;">${GC.esc(acc.email)}</span></span>
      </button>
      <button class="gc-gchip" id="g-acc-other" style="width:100%;">
        <span class="av" style="background:#f1f3f4;color:#5f6368;">+</span>
        <span style="font-size:14px;">다른 계정 사용</span>
      </button>
      <div class="gc-faint gc-small" style="margin-top:22px;line-height:1.6;">계속 진행하면 Google의 <a href="#" class="gc-btn-link" style="display:inline;">서비스 약관</a>과 개인정보처리방침에 동의하는 것으로 간주됩니다.<br><a href="#" class="gc-btn-link" style="display:inline;">자세히 알아보기</a></div>
    `;
  }
  function gEmailBody() {
    return `
      ${gWordmark()}
      <div class="gc-gtitle">로그인</div>
      <div class="gc-gsub">Google 계정 사용</div>
      <input type="text" class="gc-ginput" id="g-email-input" placeholder="이메일 또는 휴대전화">
      <div style="text-align:left;margin-top:8px;"><a href="#" class="gc-btn-link" style="display:inline;">이메일을 잊으셨나요?</a></div>
      <div class="gc-faint gc-small" style="margin-top:20px;line-height:1.6;">본인 소유가 아닌 기기라면 게스트 모드를 사용해 비공개로 로그인하세요. <a href="#" class="gc-btn-link" style="display:inline;">자세히 알아보기</a></div>
      <div class="gc-gfooter"><button class="gc-btn-text" id="g-create-account">계정 만들기</button><button class="gc-gbtn" id="g-email-next">다음</button></div>
    `;
  }
  function gPasswordBody(email) {
    return `
      ${gWordmark()}
      <div class="gc-gtitle">로그인</div>
      <div class="gc-gsub">Google 계정 사용</div>
      <button class="gc-gchip" style="width:100%;margin-bottom:18px;" disabled><span class="av">${GC.esc(email[0].toUpperCase())}</span><span style="font-size:14px;">${GC.esc(email)}</span></button>
      <div style="text-align:left;">
        <label class="gc-small" style="color:#1a73e8;font-weight:600;">비밀번호 입력</label>
        <input type="password" class="gc-ginput" id="g-pw-input" value="dummyPassword123" style="margin-top:6px;">
        <label class="gc-flex gc-gap-8 gc-small" style="margin-top:12px;"><input type="checkbox" id="g-pw-show"> 비밀번호 표시</label>
      </div>
      <div class="gc-gfooter"><button class="gc-btn-text" id="g-pw-find">비밀번호 찾기</button><button class="gc-gbtn" id="g-pw-next">다음</button></div>
    `;
  }
  function gScopeBasicBody(email) {
    return `
      ${gWordmark()}
      <div class="gc-gavatar">M</div>
      <div class="gc-gtitle" style="font-size:18px;">MakeShop에서 Google 계정에<br>대한 액세스를 요청합니다.</div>
      <button class="gc-gchip" style="width:100%;margin:18px 0;" disabled><span class="av">${GC.esc(email[0].toUpperCase())}</span><span style="font-size:14px;">${GC.esc(email)}</span></button>
      <div style="text-align:left;border-top:1px solid #f1f3f4;padding-top:16px;">
        <div class="gc-small" style="font-weight:600;margin-bottom:6px;">MakeShop에서 다음 정보에 액세스하려고 합니다:</div>
        <div class="gc-gscope-row"><span class="dot"></span><div class="txt"><b>이름, 이메일 주소, 언어 환경설정, 프로필 사진</b><span>계정 식별 및 기본 프로필 표시를 위해 사용돼요.</span></div></div>
      </div>
      <div class="gc-faint gc-small" style="margin-top:14px;line-height:1.6;text-align:left;border-top:1px solid #f1f3f4;padding-top:14px;">MakeShop이(가) 내 개인정보를 자체 <a href="#" class="gc-btn-link" style="display:inline;">서비스 약관</a> 및 <a href="#" class="gc-btn-link" style="display:inline;">개인정보처리방침</a>에 따라 사용하도록 허용됩니다.</div>
      <div class="gc-faint gc-small" style="margin-top:10px;line-height:1.6;text-align:left;border-top:1px solid #f1f3f4;padding-top:14px;">Google은 타사 앱과 정보를 공유하기 전에 이 앱이 Google 요건을 준수하는지 확인하도록 도와드립니다. <a href="#" class="gc-btn-link" style="display:inline;">자세히 알아보기</a></div>
      <div class="gc-gfooter"><button class="gc-btn-text" id="g-scope-cancel">취소</button><button class="gc-gbtn" id="g-scope-continue">계속</button></div>
    `;
  }
  function gScopeAdsBody(email) {
    const items = [
      ["Google Ads 계정 정보 확인", "광고 계정 기본 정보를 조회할 수 있어요"],
      ["Google Ads 캠페인 및 성과 데이터 조회", "캠페인 목록과 광고 성과 지표를 확인할 수 있어요"],
      ["Google Tag 정보 확인 및 관리", "설치된 태그 상태를 확인하고 관리할 수 있어요"],
      ["전환 측정 설정 확인 및 관리", "구매·장바구니 추가·결제 시작 등 전환 이벤트를 확인해요"],
      ["향상된 전환 설정", "전환 정밀도 향상을 위한 설정을 관리할 수 있어요"]
    ];
    return `
      ${gWordmark()}
      <div class="gc-gavatar">M</div>
      <div class="gc-gtitle" style="font-size:18px;">MakeShop에서 Google 계정에<br>대한 액세스를 요청합니다.</div>
      <button class="gc-gchip" style="width:100%;margin:18px 0;" disabled><span class="av">${GC.esc(email[0].toUpperCase())}</span><span style="font-size:14px;">${GC.esc(email)}</span></button>
      <div style="text-align:left;border-top:1px solid #f1f3f4;padding-top:14px;">
        <div class="gc-small" style="font-weight:600;margin-bottom:6px;">MakeShop에서 다음 데이터에 액세스하려고 합니다:</div>
        ${items.map(([t, d]) => `<label class="gc-gscope-row"><input type="checkbox" checked disabled><div class="txt"><b>${t}</b><span>${d}</span></div></label>`).join("")}
      </div>
      <div class="gc-faint gc-small" style="margin-top:14px;line-height:1.6;text-align:left;border-top:1px solid #f1f3f4;padding-top:14px;">Google은 타사 앱과 정보를 공유하기 전에 이 앱이 Google 요건을 준수하는지 확인하도록 도와드립니다. <a href="#" class="gc-btn-link" style="display:inline;">자세히 알아보기</a></div>
      <div class="gc-faint gc-small" style="margin-top:10px;line-height:1.6;text-align:left;">이렇게 하면 타사인 MakeShop이(가) 제공된 정보를 자체 <a href="#" class="gc-btn-link" style="display:inline;">서비스 약관</a> 및 <a href="#" class="gc-btn-link" style="display:inline;">개인정보처리방침</a>에 따라 사용할 수 있습니다.</div>
      <div class="gc-gfooter"><button class="gc-btn-text" id="g-scope-cancel">취소</button><button class="gc-gbtn" id="g-scope-continue">계속</button></div>
    `;
  }

  // ---------- 개인정보동의/Google로그인/접근권한동의 모달 (SCR-GOOGLE-DASH-001-미연동-01~03) ----------
  function openOnboardingFlow() {
    const html = `
      <div class="gc-modal-header"><div><h3 class="gc-modal-title">Google 쇼핑 연동을 위한 개인정보 수집·이용 동의</h3><p class="gc-modal-sub">Google Merchant Center·Google Ads 등 Google 계정 연동을 위해 아래 개인정보를 수집·이용합니다.<br>내용을 확인하고 동의해주세요.</p></div><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body">
        ${consentBoxes([
          { title: "수집·이용 항목", body: "이름, 이메일, 프로필 사진, Google Merchant Center 계정 정보(계정 ID·계정명·연결 상태 등)" },
          { title: "수집·이용 목적", body: "Google 계정 연결 및 Merchant Center 계정 생성·조회·관리" },
          { title: "보유·이용 기간", body: "Google 계정 연동을 해제 또는 서비스 해지 시 지체 없이 파기합니다.<br>단, 관계 법령의 규정에 의하여 일정 기간 보존이 필요한 경우에는 해당 기간만큼 보관 후 삭제합니다." },
          { title: "동의 거부 권리 및 불이익", body: "해당 동의를 거부할 권리가 있으나, 동의하지 않으면 서비스 이용에 제한이 있을 수 있습니다." }
        ])}
        <label class="gc-consent-agree"><input type="checkbox" class="gc-checkbox" id="privacy-check"> (필수) 위 개인정보 수집·이용에 동의합니다</label>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-gated" id="btn-privacy-confirm" disabled>확인</button></div>
    `;
    const bd = GC.openModal(html, { persistent: true });
    bindConsentGate(bd, "#privacy-check", "#btn-privacy-confirm");
    bd.querySelector("#btn-privacy-confirm").addEventListener("click", () => {
      GC.closeModal(bd);
      setTimeout(openGoogleLoginModal, 180);
    });
  }

  // 계정 선택 → (다른 계정 사용 시) 이메일 입력 → 비밀번호 입력, 실제 Google 로그인 화면 구조로 재현
  function openGoogleLoginModal() {
    const acc = M().googleAccountsForLogin[0];
    let step = "select"; // select | email | password
    let typedEmail = acc.email;

    function body() {
      if (step === "email") return gEmailBody();
      if (step === "password") return gPasswordBody(typedEmail);
      return gAccountSelectBody(acc);
    }
    function render(bd) {
      bd.querySelector(".gc-modal").innerHTML = gShell(body());
      wire(bd);
    }
    function wire(bd) {
      bindGShellClose(bd);
      if (step === "select") {
        bd.querySelector("#g-acc-existing").addEventListener("click", () => { GC.closeModal(bd); setTimeout(openAccessScopeModal, 180); });
        bd.querySelector("#g-acc-other").addEventListener("click", () => { step = "email"; render(bd); });
      } else if (step === "email") {
        bd.querySelector("#g-email-next").addEventListener("click", () => {
          const v = bd.querySelector("#g-email-input").value.trim();
          if (!v) { GC.toast("이메일 또는 휴대전화를 입력해주세요.", "error"); return; }
          typedEmail = v; step = "password"; render(bd);
        });
      } else if (step === "password") {
        const pwInput = bd.querySelector("#g-pw-input");
        bd.querySelector("#g-pw-show").addEventListener("change", (e) => { pwInput.type = e.target.checked ? "text" : "password"; });
        bd.querySelector("#g-pw-next").addEventListener("click", () => { GC.closeModal(bd); setTimeout(openAccessScopeModal, 180); });
      }
    }
    const bd = GC.openModal(gShell(body()), { persistent: true });
    wire(bd);
  }

  function openAccessScopeModal() {
    const email = M().googleAccountsForLogin[0].email;
    const bd = GC.openModal(gShell(gScopeBasicBody(email)), { persistent: true });
    bindGShellClose(bd);
    bd.querySelector("#g-scope-cancel").addEventListener("click", () => GC.closeModal(bd));
    bd.querySelector("#g-scope-continue").addEventListener("click", () => {
      GC.closeModal(bd);
      GC.toast("Google 계정이 연동되었습니다.", "success");
      card = freshCard();
      switchState("둘다미연결");
    });
  }

  function switchState(state) {
    const sel = document.getElementById("dev-dash-state");
    sel.value = state;
    window.GC_DASH.render(document.getElementById("panel-dash"), state);
  }

  // ===================== 연결완료 계열 — 공통 셸 =====================
  // 근거: SCR-GOOGLE-DASH-001-연동완료-전체.svg / -부분(Ads만 연동).svg / -부분(MFC만 연동).svg / -부분(상품피드만 연동).svg
  // 4개 SVG 모두 동일한 레이아웃(Google 계정 연동 박스 → 판매자 센터 연동 박스 → Google Ads 설정 박스 → 상품 피드 박스)을
  // 공유하며 각 박스 내부 상태(연결됨/미연결)만 다르다. 하나의 셸에서 card 상태값에 따라 내부만 전환한다.
  function renderConnectedShell() {
    mount.innerHTML = `
      ${introBox()}
      <div class="gc-section">
        <div class="gc-section-title">Google 계정 연동</div>
        <div class="gc-box gc-flex-between">
          <div class="gc-flex gc-gap-12">
            <span class="gc-small gc-muted">Google 계정</span>
            <span class="gc-info-icon">?</span>
            <span class="gc-avatar-sm">${GC.esc(M().googleAccount.email[0].toUpperCase())}</span>
            <b>${GC.esc(M().googleAccount.email)}</b>
            ${accountStatusBadge(M().googleAccount.status, {
              connected: { label: "연결됨", tone: "success" },
              reauth_required: { label: "재인증 필요", tone: "warning" }
            })}
          </div>
          <button class="gc-btn gc-btn-danger" id="btn-google-disconnect">전체 연결 해제</button>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">판매자 센터 연동</div>
        <div class="gc-box" id="mc-box"></div>
      </div>

      ${mcStepflowVisible() ? mcStepflowSection() : ""}

      <div class="gc-section">
        <div class="gc-section-title">${card.ads === "done" ? "Google Ads 설정" : card.ads === "failed" ? "Google Ads 계정 연동 (연결 실패)" : "Google Ads 계정 연동 (미연결)"}</div>
        <div class="gc-box" id="ads-box"></div>
      </div>

      ${card.mc === "done" ? `
      <div class="gc-section">
        <div class="gc-section-title">상품 피드${!card.adsShoppingBlocked ? "" : " (미연결)"}</div>
        <div class="gc-box" id="feed-box"></div>
      </div>` : ""}
    `;
    mount.querySelector("#btn-google-disconnect").addEventListener("click", () => confirmDisconnect("Google 계정 전체", () => switchState("미연동")));
    renderMcBox();
    renderAdsBox();
    if (card.mc === "done") renderFeedBox();
    syncOtherTabs(true);
  }

  // ---------- 판매자 센터 연동 박스 ----------
  function renderMcBox() {
    const box = mount.querySelector("#mc-box");
    if (card.mc === "empty") {
      box.innerHTML = `
        <div class="gc-box-title">판매자센터 정보 설정</div>
        <div class="gc-box-desc">상품을 Google에 등록하려면 Merchant Center를 연결하세요.</div>
        <button class="gc-btn gc-btn-primary" id="btn-mc-start">Merchant Center 연동하기</button>
      `;
      box.querySelector("#btn-mc-start").addEventListener("click", () => { card.mc = "checklist"; renderConnectedShell(); });
      return;
    }
    if (card.mc === "checklist") {
      const items = M().checklistItems;
      const allDone = items.every((it) => card.checklist[it.key]);
      box.innerHTML = `
        <div class="gc-box-title">판매자센터 정보 설정</div>
        <div class="gc-box-desc">아래 4가지 항목을 모두 확인해야 Merchant Center를 연결할 수 있어요.</div>
        <div class="gc-subbox">
          ${items.map((it, i) => `
            <div class="gc-flex-between" style="padding:11px 0; ${i > 0 ? "border-top:1px solid var(--gc-line-soft);" : ""}">
              <span class="gc-small" style="font-weight:600;">${GC.esc(it.label)}</span>
              ${card.checklist[it.key]
                ? '<span class="gc-pill gc-pill-success">인증 완료</span>'
                : `<button class="gc-btn gc-btn-sm" data-check-item="${it.key}" ${it.auto ? "disabled" : ""}>${it.auto ? "자동 등록" : "확인하기"}</button>`}
            </div>`).join("")}
        </div>
        <button class="gc-btn gc-btn-primary gc-mt-16" id="btn-mc-connect" ${allDone ? "" : "disabled"}>${allDone ? "Merchant Center 연결하기" : "🔒 체크리스트 완료 후 활성화"}</button>
      `;
      box.querySelectorAll("[data-check-item]").forEach((btn) => btn.addEventListener("click", () => openChecklistItemModal(btn.dataset.checkItem)));
      const connectBtn = box.querySelector("#btn-mc-connect");
      if (allDone) connectBtn.addEventListener("click", openMcIntroModal);
      return;
    }
    if (card.mc === "domainShipping") {
      const domainDone = card.domain === "done";
      const shippingDone = card.shipping === "done";
      box.innerHTML = `
        <div class="gc-box-title">판매자센터 정보 설정</div>
        <div class="gc-box-desc">연결된 Merchant Center 계정과 쇼핑몰 도메인 인증 상태를 확인하고, 판매 국가와 배송 정보를 설정할 수 있어요.</div>
        ${mcAccountSubbox()}
        <div class="gc-subbox">
          <div class="gc-subbox-header">
            ${domainDone ? '<span class="gc-pill gc-pill-success">인증 완료</span>' : card.domain === "verifying" ? '<span class="gc-flex gc-gap-8 gc-small"><span class="gc-spinner"></span>인증 중</span>' : card.domain === "failed" ? '<span class="gc-pill gc-pill-danger">인증 실패</span>' : '<span class="gc-pill gc-pill-warning">인증 필요</span>'}
          </div>
          <div class="gc-subbox-title">쇼핑몰 도메인 인증</div>
          <div class="gc-subbox-desc">메이크샵에 등록된 대표 도메인을 Google Merchant Center에 인증해요.<br>별도의 HTML 코드 삽입이나 DNS 설정 없이 자동으로 처리돼요.</div>
          ${card.domain === "verifying" ? domainVerifyStepper() : ""}
          ${card.domain === "failed" ? `<div class="gc-consent-box" style="background:#fef2f2;border-color:#fecaca;margin:10px 0;"><div class="gc-small" style="color:var(--gc-danger);font-weight:600;">■ ${GC.esc(card.domainFailReason || "인증에 실패했어요.")}</div><div class="gc-small" style="color:var(--gc-danger);">도메인 설정을 확인한 뒤 다시 시도해 주세요.</div></div>` : ""}
          <div class="gc-flex gc-gap-8 gc-mt-8">
            <input class="gc-input" style="width:325px; max-width:60%;" value="${GC.esc(M().mc.domain.host)}" readonly>
            ${domainDone ? '<button class="gc-btn gc-btn-sm">변경하기</button>' : `<button class="gc-btn gc-btn-sm" id="btn-domain-verify" ${card.domain === "verifying" ? "disabled" : ""}>${card.domain === "verifying" ? '<span class="gc-spinner"></span> 인증 처리 진행중 ...' : card.domain === "failed" ? "다시 시도 ↻" : "도메인 인증하기"}</button>`}
          </div>
          ${domainDone ? `<ul class="gc-small gc-muted gc-mt-8" style="line-height:1.9;"><li>· 인증 완료: 방금 전</li><li>· HTTPS 적용됨 · Google 소유권 인증 완료 · Merchant Center 웹사이트 연결 완료</li></ul>` : ""}
        </div>
        <div class="gc-subbox">
          <div class="gc-subbox-header">
            ${shippingDone ? '<span class="gc-pill gc-pill-success">설정 완료</span>' : '<span class="gc-pill gc-pill-warning">설정 필요</span>'}
          </div>
          <div class="gc-subbox-title">판매국가·배송 설정</div>
          <div class="gc-subbox-desc">Google 쇼핑에 상품을 노출할 판매 국가와 고객에게 적용할 배송 정보를 설정해 주세요.</div>
          ${shippingDone ? shippingSummaryList() : ""}
          ${shippingDone ? shippingActionButton("btn-shipping-setup") : `<button class="gc-btn gc-btn-sm" id="btn-shipping-setup">판매국가·배송 설정</button>`}
        </div>
      `;
      const domainBtn = box.querySelector("#btn-domain-verify");
      if (domainBtn) domainBtn.addEventListener("click", () => {
        card.domain = "verifying"; card.domainVerifyStep = 0; renderConnectedShell();
        const advance = () => {
          card.domainVerifyStep++;
          if (card.domainVerifyStep >= DOMAIN_VERIFY_LABELS.length) {
            card.domain = "done"; renderConnectedShell(); checkBothDone();
          } else {
            renderConnectedShell();
            setTimeout(advance, 550);
          }
        };
        setTimeout(advance, 550);
      });
      bindShippingActionButton(box.querySelector("#btn-shipping-setup"));
      bindMcAccountButtons();
      return;
    }
    // done
    box.innerHTML = `
      <div class="gc-box-title">판매자센터 정보 설정</div>
      <div class="gc-box-desc">연결된 Merchant Center 계정과 쇼핑몰 도메인 인증 상태를 확인하고, 판매 국가와 배송 정보를 설정할 수 있어요.</div>
      ${mcAccountSubbox()}
      <div class="gc-subbox">
        <div class="gc-subbox-header"><span class="gc-pill gc-pill-success">인증 완료</span></div>
        <div class="gc-subbox-title">쇼핑몰 도메인 인증</div>
        <div class="gc-subbox-desc">메이크샵에 등록된 대표 도메인을 Google Merchant Center에 인증해요.<br>별도의 HTML 코드 삽입이나 DNS 설정 없이 자동으로 처리돼요.</div>
        <div class="gc-flex gc-gap-8">
          <input class="gc-input" style="width:325px; max-width:60%;" value="${GC.esc(M().mc.domain.host)}" readonly>
          <button class="gc-btn gc-btn-sm">변경하기</button>
        </div>
        <ul class="gc-small gc-muted gc-mt-8" style="line-height:1.9;"><li>· 인증 완료: 2026-07-28 15:10</li><li>· HTTPS 적용됨 · Google 소유권 인증 완료 · Merchant Center 웹사이트 연결 완료</li></ul>
      </div>
      <div class="gc-subbox">
        <div class="gc-subbox-header"><span class="gc-pill gc-pill-success">설정 완료</span></div>
        <div class="gc-subbox-title">판매국가·배송 설정</div>
        <div class="gc-subbox-desc">Google 쇼핑에 상품을 노출할 판매 국가와 고객에게 적용할 배송 정보를 설정해 주세요.</div>
        ${shippingSummaryList()}
        ${shippingActionButton("btn-shipping-setup-done")}
      </div>
    `;
    bindShippingActionButton(box.querySelector("#btn-shipping-setup-done"));
    bindMcAccountButtons();
  }

  // ---------- 판매국가·배송 설정 요약(카드 노출용) — 방식(①자동/②MC직접)에 따라 표시 항목이 다르다 ----------
  // 근거: 05_Policy/01_연결관리_탭/03_연결_중_정책.md 3장 — ②는 메이크샵이 값을 보유하지 않으므로 세부 수치를 표시하지 않는다(Single Source of Truth = Merchant Center)
  function shippingSummaryList() {
    if (card.shippingMethod === "direct") {
      return `<ul class="gc-small gc-muted" style="line-height:1.9; margin-bottom:14px;"><li>· 배송 설정: ② Google Merchant Center에서 직접 관리 중</li><li>· 배송비·배송기간 등 세부 값은 Merchant Center에서 직접 확인해 주세요.</li><li>· 완료 확인: 방금 전(사용자 확인 기준, 메이크샵 API 검증 아님)</li></ul>`;
    }
    return `<ul class="gc-small gc-muted" style="line-height:1.9; margin-bottom:14px;"><li>· 판매 국가: 대한민국(고정)</li><li>· 배송 설정: ① 쇼핑몰 배송 설정 자동 가져오기 적용됨</li><li>· 설정 완료: 방금 전</li></ul>`;
  }
  function shippingActionButton(id) {
    return card.shippingMethod === "direct"
      ? `<button class="gc-btn gc-btn-sm" id="${id}">설정 확인하기</button>`
      : `<button class="gc-btn gc-btn-sm" id="${id}">변경하기</button>`;
  }
  // ②(MC 직접 설정) 완료 후에는 메이크샵에 편집 UI가 없으므로 버튼이 모달 재오픈이 아니라 Merchant Center 아웃링크로 동작한다
  function bindShippingActionButton(btnEl) {
    if (!btnEl) return;
    if (card.shippingMethod === "direct") {
      btnEl.addEventListener("click", () => window.open("https://merchants.google.com/", "_blank"));
    } else {
      btnEl.addEventListener("click", openShippingModal);
    }
  }

  // ---------- 쇼핑몰 도메인 인증 진행 상태 박스 (06_도메인인증중.svg — 파란 박스 안 4단계 체크리스트) ----------
  // 근거: 03_Wireframe/FINAL WIREFRAME/2. 연결관리 탭/SCR-GOOGLE-DASH-001-미연동-06_도메인인증중.svg
  const DOMAIN_VERIFY_LABELS = ["대표 도메인 조회", "HTTPS 접근 가능 여부 확인", "Google 소유권 인증", "Merchant Center 웹사이트 연결"];
  function domainVerifyStepper() {
    const step = card.domainVerifyStep;
    return `
      <div class="gc-subbox" style="background:#eff6ff; border-color:var(--gc-primary);">
        <div class="gc-small" style="margin-bottom:10px;">대표 도메인의 소유권을 자동으로 확인하고 있어요. 잠시만 기다려 주세요.</div>
        ${DOMAIN_VERIFY_LABELS.map((label, i) => {
          if (i < step) return `<div class="gc-flex gc-gap-8 gc-small" style="padding:3px 0;"><span style="width:8px;height:8px;border-radius:50%;background:var(--gc-success);flex:none;"></span>${label} 완료</div>`;
          if (i === step) return `<div class="gc-flex gc-gap-8 gc-small" style="padding:3px 0;color:var(--gc-primary);font-weight:600;"><span style="width:8px;height:8px;border-radius:50%;background:var(--gc-primary);flex:none;"></span>${label} 진행 중...</div>`;
          return `<div class="gc-flex gc-gap-8 gc-small gc-faint" style="padding:3px 0;"><span style="width:8px;height:8px;border-radius:50%;background:var(--gc-border-strong);flex:none;"></span>${label} 대기</div>`;
        }).join("")}
      </div>
    `;
  }

  // MC 계정 상태 5종(연결됨/확인 필요/연결 오류/재인증 필요/계정 정지됨) — 근거: 1-6장 6-3-2·6-7. 결정 주체는 항상 Google이며
  // 메이크샵은 화면 진입 시 Merchant API 조회 결과를 그대로 노출한다(로컬 값으로 대체·추론하지 않음).
  const MC_STATUS_MAP = {
    connected: { label: "연결됨", tone: "success" },
    issue: { label: "확인 필요", tone: "warning" },
    error: { label: "연결 오류", tone: "danger" },
    reauth_required: { label: "재인증 필요", tone: "warning" },
    suspended: { label: "계정 정지됨", tone: "danger" }
  };
  function mcStatusBanner() {
    const st = M().mc.status;
    if (st === "connected") return "";
    const copy = {
      issue: { tone: "warning", text: M().mc.statusReason || "Merchant Center 계정 확인이 필요해요. 계정 정보를 다시 확인해 주세요." },
      error: { tone: "danger", text: M().mc.statusReason || "Merchant Center 연결에 오류가 발생했어요. 계정 연결 상태를 다시 확인해 주세요." },
      reauth_required: { tone: "warning", text: "Google 계정 인증이 만료되어 Merchant Center 연동이 일시 중단됐어요. Google 계정을 다시 연결해 주세요." },
      suspended: { tone: "danger", text: "Google 정책 위반으로 Merchant Center 계정이 정지됐어요. 상품 피드 전송과 심사가 전체 중단된 상태예요. Merchant Center에서 정지 사유를 확인해 주세요." }
    }[st];
    if (!copy) return "";
    return `<div class="gc-subbox" style="background:${copy.tone === "danger" ? "#fef2f2" : "#fffbeb"};border-color:${copy.tone === "danger" ? "#fecaca" : "#fde68a"};margin-bottom:12px;">
      <div class="gc-small" style="font-weight:700;color:${copy.tone === "danger" ? "var(--gc-danger)" : "#b45309"};">${copy.text}</div>
    </div>`;
  }
  function mcAccountSubbox() {
    return `
      ${mcStatusBanner()}
      <div class="gc-subbox">
        <div class="gc-subbox-header">
          <div class="gc-subbox-title">Merchant Center 계정</div>
          <a href="#" class="gc-btn-link gc-small">Merchant Center 바로가기</a>
        </div>
        <div class="gc-field-grid cols-1 gc-mt-8">
          <div class="gc-field"><div class="lbl">Merchant Center 계정 ID</div><div class="val gc-flex gc-gap-8" style="align-items:center;">${M().mc.accountId} ${accountStatusBadge(M().mc.status, MC_STATUS_MAP)}</div></div>
          <div class="gc-field"><div class="lbl">비즈니스 이름</div><div class="val">${GC.esc(M().mc.businessName)}</div></div>
          <div class="gc-field"><div class="lbl">비즈니스 국가</div><div class="val">${M().mc.businessCountry}</div></div>
          <div class="gc-field"><div class="lbl">연결 완료 일시</div><div class="val muted">2026-07-28 14:32</div></div>
        </div>
        <hr class="gc-subbox-divider">
        <div class="gc-flex gc-gap-8">
          <button class="gc-btn gc-btn-sm" id="btn-mc-change">계정 변경</button>
          <button class="gc-btn gc-btn-sm gc-btn-danger" id="btn-mc-disconnect">연결 해제</button>
        </div>
      </div>
    `;
  }

  function bindMcAccountButtons() {
    const changeBtn = mount.querySelector("#btn-mc-change");
    const discBtn = mount.querySelector("#btn-mc-disconnect");
    if (changeBtn) changeBtn.addEventListener("click", () => GC.toast("계정 변경 화면으로 이동합니다.", "info"));
    if (discBtn) discBtn.addEventListener("click", () => confirmDisconnect("Merchant Center", () => {
      card.mc = "empty"; card.feedConnected = false; card.domain = "idle"; card.shipping = "idle";
      card.checklist = { connect: true, ssl: false, policy: false, payment: false };
      renderConnectedShell();
    }));
  }

  // ---------- 판매자센터 정보 설정 체크리스트 항목 모달 (04_판매자센터체크리스트-항목모달-*) ----------
  function openChecklistItemModal(key) {
    const item = M().checklistItems.find((i) => i.key === key);
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">${GC.esc(item.label)}</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body gc-small">
        <div class="gc-muted">${GC.esc(item.desc)}</div>
        ${item.current ? `<div class="gc-mt-12 gc-badge gc-badge-warning">${GC.esc(item.current)}</div>` : ""}
        ${item.linkLabel ? `<div class="gc-mt-12"><a href="#" class="gc-btn-link gc-small">${GC.esc(item.linkLabel)}</a></div>` : ""}
        ${item.confirmCheckbox ? `<label class="gc-flex gc-gap-8 gc-mt-16"><input type="checkbox" class="gc-checkbox" id="confirm-cb">${GC.esc(item.confirmCheckbox)}</label>` : ""}
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-item-confirm">설정 완료 확인</button></div>
    `;
    const bd = GC.openModal(html);
    bd.querySelector("#btn-item-confirm").addEventListener("click", () => {
      const cb = bd.querySelector("#confirm-cb");
      if (cb && !cb.checked) { GC.toast("확인 후 체크해 주세요.", "error"); return; }
      card.checklist[key] = true;
      GC.closeModal(bd);
      renderMcBox();
    });
  }

  // ---------- 판매국가·배송 설정 모달 (06_판매국가배송설정-모달 / -모달-MC직접선택) ----------
  // 근거: 05_Policy/01_연결관리_탭/03_연결_중_정책.md 3장 — 판매 국가는 ① 자동으로 가져오기 방식에서만 노출되며, "대한민국" 고정값을 비활성화 상태로 보여준다(선택 불가).
  // 메이크샵 입점 쇼핑몰은 판매 국가가 대한민국으로 고정돼 있고, 자동 가져오기 자체가 국내향 배송 데이터를 그대로 전달하는 방식이라 임의 선택은 정합성에 맞지 않는다.
  // ② MC 직접 설정은 입력폼 없이 안내문구+아웃링크만 제공하며, 판매 국가를 포함한 모든 값을 Merchant Center가 원본으로 관리한다(Single Source of Truth) — 해외向 판매는 이 경로로 안내한다.
  function openShippingModal() {
    const s = { mode: card.shippingMethod === "direct" ? "direct" : "auto" };

    function body() {
      const isAuto = s.mode === "auto";
      return `
        <div class="gc-modal-body gc-small">
          ${isAuto ? `
            <div style="margin-bottom:16px;">
              <label class="gc-small" style="font-weight:600; display:block; margin-bottom:4px;">판매 국가</label>
              <input class="gc-input" style="width:220px; background:#f3f4f6; color:var(--gc-text-faint);" value="대한민국" disabled readonly>
              <div class="gc-faint gc-mt-4">메이크샵은 국내 판매만 지원해 판매 국가가 대한민국으로 고정돼요. 해외 판매를 원하시면 "Google Merchant Center에서 직접 설정"을 이용해 주세요.</div>
            </div>
          ` : ""}

          <div class="gc-faint" style="margin-bottom:6px;">배송 설정 방식</div>
          <label class="gc-flex gc-gap-8" style="align-items:flex-start; padding:12px; border:1px solid ${isAuto ? "var(--gc-primary)" : "var(--gc-line-soft)"}; background:${isAuto ? "#eff6ff" : "transparent"}; border-radius:8px; margin-bottom:8px;">
            <input type="radio" name="shipmode" id="ship-mode-auto" ${isAuto ? "checked" : ""} style="margin-top:2px;">
            <div>
              <div style="font-weight:700;">① 쇼핑몰 배송 설정 자동으로 가져오기 <span class="gc-faint" style="font-weight:400;">(권장)</span></div>
              <div class="gc-faint gc-mt-4">메이크샵에 등록된 배송 설정을 불러와 Google Merchant Center에 자동 반영해요.</div>
            </div>
          </label>
          <label class="gc-flex gc-gap-8" style="align-items:flex-start; padding:12px; border:1px solid ${!isAuto ? "var(--gc-primary)" : "var(--gc-line-soft)"}; background:${!isAuto ? "#eff6ff" : "transparent"}; border-radius:8px;">
            <input type="radio" name="shipmode" id="ship-mode-direct" ${!isAuto ? "checked" : ""} style="margin-top:2px;">
            <div>
              <div style="font-weight:700;">② Google Merchant Center에서 직접 설정</div>
              <div class="gc-faint gc-mt-4">Google Merchant Center에서 판매 국가와 배송 정책을 직접 설정해 주세요.</div>
            </div>
          </label>

          ${isAuto ? `
            <div class="gc-mt-16">
              <div class="gc-faint" style="margin-bottom:6px;">불러온 배송 정보(쇼핑몰 배송 설정 자동 조회, 읽기 전용)</div>
              <div style="background:#f9fafb; border:1px solid var(--gc-line-soft); border-radius:6px; padding:12px; line-height:1.9;">
                배송비 : ${GC.fmtWon(M().mc.shipping.fee)}<br>
                무료배송 기준 : ${GC.fmtWon(M().mc.shipping.freeThreshold)} 이상<br>
                배송 기간 : ${M().mc.shipping.leadTime}<br>
                배송 대상 : 대한민국
              </div>
            </div>
          ` : `
            <div class="gc-mt-16">
              <div class="gc-faint gc-mt-4">메이크샵은 Google 배송 정책을 직접 관리하지 않아요. 아래 버튼으로 이동해 설정을 완료한 뒤, 이 화면으로 돌아와 저장을 진행해 주세요.</div>
              <button class="gc-btn gc-btn-dark gc-mt-12" id="btn-ship-outlink">Google Merchant Center 배송 설정으로 이동 ⧉</button>
              <div class="gc-faint" style="text-align:right;font-size:11px;margin-top:2px;">새 탭으로 열림</div>
            </div>
          `}
        </div>
        <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-shipping-save">저장</button></div>
      `;
    }

    function render(bd) {
      bd.querySelector(".gc-modal").innerHTML = `<div class="gc-modal-header"><h3 class="gc-modal-title">판매국가·배송 설정</h3><button class="gc-modal-close" data-close-modal>✕</button></div>${body()}`;
      wire(bd);
    }

    function wire(bd) {
      bd.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", () => GC.closeModal(bd)));
      bd.querySelector("#ship-mode-auto").addEventListener("change", () => { s.mode = "auto"; render(bd); });
      bd.querySelector("#ship-mode-direct").addEventListener("change", () => { s.mode = "direct"; render(bd); });
      const outlinkBtn = bd.querySelector("#btn-ship-outlink");
      if (outlinkBtn) outlinkBtn.addEventListener("click", () => window.open("https://merchants.google.com/", "_blank"));

      bd.querySelector("#btn-shipping-save").addEventListener("click", () => {
        if (s.mode === "auto") {
          const btn = bd.querySelector("#btn-shipping-save");
          btn.disabled = true; btn.innerHTML = `<span class="gc-spinner"></span> 저장 중...`;
          setTimeout(() => {
            GC.closeModal(bd);
            card.shipping = "done";
            card.shippingMethod = "auto";
            renderConnectedShell();
            checkBothDone();
          }, 1000);
          return;
        }
        // ② MC 직접 설정 — Merchant API로 검증하지 않고 사용자 자가 확인만으로 완료 처리(컨펌 팝업)
        const confirmHtml = `
          <div class="gc-modal-header"><h3 class="gc-modal-title">설정을 완료하셨나요?</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
          <div class="gc-modal-body gc-small gc-muted">Google Merchant Center에서 배송 정책 설정을 완료하셨습니까?</div>
          <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-ship-direct-confirm">확인</button></div>
        `;
        const confirmBd = GC.openModal(confirmHtml);
        confirmBd.querySelector("#btn-ship-direct-confirm").addEventListener("click", () => {
          GC.closeModal(confirmBd);
          GC.closeModal(bd);
          card.shipping = "done";
          card.shippingMethod = "direct";
          renderConnectedShell();
          checkBothDone();
        });
      });
    }

    const bd = GC.openModal(`<div></div>`, { persistent: true });
    render(bd);
  }

  // ---------- 도메인인증+배송 둘 다 완료 시 → "상품 피드 연동을 시작하시겠습니까?" 확인 모달 ----------
  function checkBothDone() {
    if (card.domain === "done" && card.shipping === "done") {
      setTimeout(() => {
        const html = `
          <div class="gc-modal-header"><h3 class="gc-modal-title">상품 피드 연동을 시작하시겠습니까?</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
          <div class="gc-modal-body gc-small gc-muted">Google Merchant Center 연동이 모두 완료되었습니다. 상품 피드를 지금 전송하려면 연동을 시작해 주세요.</div>
          <div class="gc-modal-footer"><button class="gc-btn" id="btn-feed-later">나중에 하기</button><button class="gc-btn gc-btn-primary" id="btn-feed-start">연동 시작</button></div>
        `;
        const bd = GC.openModal(html, { persistent: true });
        bd.querySelector("#btn-feed-later").addEventListener("click", () => { GC.closeModal(bd); card.mc = "done"; card.feedConnected = false; renderConnectedShell(); });
        bd.querySelector("#btn-feed-start").addEventListener("click", () => { GC.closeModal(bd); card.mc = "done"; card.feedConnected = true; renderConnectedShell(); GC.toast("상품 피드 연동이 시작되었습니다.", "success"); });
      }, 300);
    }
  }

  // ---------- Merchant Center 연결 4단계 위저드 (미연동-05_MC연결-0~4) ----------
  // ---------- Merchant Center 연결 시작 안내 모달 (SCR-GOOGLE-DASH-001-미연동-05_MC연결-0_시작안내모달) ----------
  function openMcIntroModal() {
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">Google Merchant Center 연결 시작</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body">
        <div class="gc-small gc-muted" style="margin-bottom:14px;">지금부터 아래 4단계로 Merchant Center 연결을 진행해요.</div>
        <div class="gc-small" style="line-height:2.3;">
          <div>① Merchant Center 계정 선택</div>
          <div>② 사업자 주소·대표 전화번호 제3자 제공 동의</div>
          <div>③ 대표 전화번호 인증(SMS/음성)</div>
          <div>④ Google 판매자 서비스 약관 동의</div>
        </div>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>닫기</button><button class="gc-btn gc-btn-dark" id="btn-mc-intro-next">다음</button></div>
    `;
    const bd = GC.openModal(html, { persistent: true });
    bd.querySelector("#btn-mc-intro-next").addEventListener("click", () => { GC.closeModal(bd); setTimeout(openMcWizard, 180); });
  }

  // 비즈니스 이름 검증 — 근거: 05_MC연결-1_계정선택.png 우측 alert 5종(순서대로 판정)
  function validateMcBusinessName(name) {
    const v = (name || "").trim();
    if (!v) return "비즈니스 이름을 입력해 주세요.";
    if (/[_/／]|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(v)) return "비즈니스 이름에는 밑줄, 슬래시, 이모지 등의 특수문자를 사용할 수 없습니다.";
    if (/^[A-Z0-9\s]+$/.test(v) && /[A-Z]/.test(v)) return "영문 비즈니스 이름은 전체 대문자로 입력할 수 없습니다.";
    if (/\d{2,4}-?\d{3,4}-?\d{4}/.test(v) || /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(v)) return "비즈니스 이름에는 전화번호나 이메일 주소를 포함할 수 없습니다.";
    if (/할인|이벤트|프로모션|무료|특가|최저가/.test(v)) return "입력한 비즈니스 이름을 사용할 수 없습니다.\n특수문자, 홍보 문구 또는 불필요한 표현을 제외하고 다시 입력해 주세요.";
    return null;
  }

  // ---------- Merchant Center 연결 4단계 위저드 (미연동-05_MC연결-1~4) ----------
  function openMcWizard() {
    const steps = ["계정 선택", "사업자정보 제공동의", "대표 전화번호 인증", "서비스 약관 동의"];
    let idx = 0;
    const wState = { phone: "idle", accountMode: "existing", businessName: "" };
    const existingAccount = { id: "makeshop-1234567890" };

    function stepBody() {
      if (idx === 0) {
        const isNew = wState.accountMode === "new";
        return `
          <div class="gc-small gc-muted" style="margin-bottom:14px;">로그인한 Google 계정에 연결된 Merchant Center 계정이 있으면 자동으로 조회돼요.</div>
          <label class="gc-flex gc-gap-8" style="align-items:flex-start; padding:14px; border:1px solid ${!isNew ? "var(--gc-primary)" : "var(--gc-line-soft)"}; background:${!isNew ? "#eff6ff" : "transparent"}; border-radius:8px; margin-bottom:10px;">
            <input type="radio" name="mc-acc-mode" id="mc-mode-existing" ${!isNew ? "checked" : ""} style="margin-top:3px;">
            <div>
              <div class="gc-small" style="font-weight:700;">기존 계정으로 설정</div>
              <div class="gc-small" style="margin-top:4px;">${existingAccount.id}</div>
              <div class="gc-faint gc-small" style="margin-top:2px;">이 계정으로 연결하려면 아래 [다음]을 클릭하세요</div>
            </div>
          </label>
          <label class="gc-flex gc-gap-8" style="align-items:flex-start; padding:14px; border:1px solid ${isNew ? "var(--gc-primary)" : "var(--gc-line-soft)"}; background:${isNew ? "#eff6ff" : "transparent"}; border-radius:8px;">
            <input type="radio" name="mc-acc-mode" id="mc-mode-new" ${isNew ? "checked" : ""} style="margin-top:3px;">
            <div style="flex:1;">
              <div class="gc-small" style="font-weight:700;">새 Merchant Center 계정 생성</div>
              ${isNew ? `
                <div class="gc-mt-8">
                  <label class="gc-small" style="font-weight:600; display:block; margin-bottom:4px;">비즈니스 이름</label>
                  <input type="text" class="gc-input" id="mc-business-name" style="width:100%;" value="${GC.esc(wState.businessName)}" placeholder="비즈니스 이름을 입력해 주세요">
                </div>
                <div class="gc-mt-8 gc-small">
                  <div class="gc-faint">웹사이트</div>
                  <div>${GC.esc(M().mc.domain.host)}</div>
                  <div class="gc-faint" style="margin-top:2px;">· 쇼핑몰 도메인에서 자동으로 입력돼요(변경 불가)</div>
                </div>
              ` : ""}
            </div>
          </label>
        `;
      }
      if (idx === 1) {
        return `
          <div class="gc-consent-sub" style="margin-top:-4px;">Google Merchant Center 계정 검증을 위해 아래 사업자 정보를 Google에 제공해요. 개인정보보호법 제17조(제3자 제공)에 따라 내용을 안내드려요.</div>
          ${consentBoxes([
            { title: "① 제공받는 자", body: "Google LLC (Google Merchant Center 서비스 제공자)" },
            { title: "② 제공 목적", body: "Google Merchant Center 계정 생성 및 사업자 정보 검증" },
            { title: "③ 제공 항목", body: `사업장 주소, 대표 전화번호(${GC.esc(M().mc.phone)})` },
            { title: "④ 보유·이용 기간", body: "Google 개인정보처리방침에 따라 보관·삭제됩니다. Google은 삭제 요청 후 활성 시스템에서 완전 삭제까지 통상 약 2개월(백업 시스템 최대 6개월)이 소요될 수 있으며, 결제·거래 관련 정보는 관계 법령에 따라 더 길게 보관될 수 있습니다. 자세한 내용은 Google 개인정보처리방침(policies.google.com/privacy)을 참고하세요." },
            { title: "⑤ 동의 거부 권리 및 불이익", body: "귀하는 본 제3자 제공에 동의를 거부할 권리가 있습니다. 다만 사업장 주소·대표 전화번호는 Google Merchant Center 계정 인증에 필수적인 정보로, 동의하지 않으실 경우 Merchant Center 연동을 진행할 수 없습니다." }
          ])}
          <label class="gc-consent-agree"><input type="checkbox" class="gc-checkbox" id="mc-step2-agree"> (필수) 위 내용을 확인하였으며, 사업장 주소·대표 전화번호를 Google에 제공하는 것에 동의합니다.</label>`;
      }
      if (idx === 2) {
        if (wState.phone === "done") {
          return `
            <div class="gc-consent-box" style="background:#f0fdf4;border-color:#bbf7d0;">
              <div class="gc-small gc-faint" style="margin-bottom:4px;">현재 인증 상태</div>
              <div class="gc-small" style="font-weight:700;color:var(--gc-success);">■ 인증 완료</div>
            </div>
            <div class="gc-small gc-mt-12">대표 전화번호 인증이 완료됐어요.<br>'다음'을 눌러 계속 진행해 주세요.</div>`;
        }
        if (wState.phone === "checking") {
          return `
            <div class="gc-small gc-muted gc-mt-8">Merchant Center 계정 검증을 위해 Google이 대표 전화번호 인증을 요구해요.</div>
            <div class="gc-consent-box gc-mt-12">
              <div class="gc-small gc-faint" style="margin-bottom:4px;">현재 인증 상태</div>
              <div class="gc-flex gc-gap-8 gc-small"><span class="gc-spinner"></span> 인증 상태를 확인하는 중이에요...</div>
            </div>`;
        }
        if (wState.phone === "unreachable") {
          return `
            <div class="gc-small gc-muted gc-mt-8">Merchant Center 계정 검증을 위해 Google이 대표 전화번호 인증을 요구해요.</div>
            <div class="gc-consent-box gc-mt-12">
              <div class="gc-small gc-faint" style="margin-bottom:4px;">현재 인증 상태</div>
              <div class="gc-small gc-faint">조회할 수 없음</div>
            </div>
            <div class="gc-consent-box" style="background:#fef2f2;border-color:#fecaca;margin-top:8px;">
              <div class="gc-small" style="color:var(--gc-danger);font-weight:600;">■ 인증 상태를 불러오지 못했어요.</div>
              <div class="gc-small" style="color:var(--gc-danger);">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</div>
            </div>
            <button class="gc-btn gc-mt-12" id="btn-phone-retry" style="width:100%;">다시 시도 ↻</button>`;
        }
        return `
          <div class="gc-small gc-muted gc-mt-8">Merchant Center 계정 검증을 위해 Google이 대표 전화번호 인증을 요구해요.</div>
          <div class="gc-consent-box gc-mt-12" style="background:#fffbeb;border-color:#fde68a;">
            <div class="gc-small gc-faint" style="margin-bottom:4px;">현재 인증 상태</div>
            <div class="gc-small" style="font-weight:700;color:#b45309;">■ 미인증</div>
          </div>
          <div class="gc-small gc-mt-12">전화번호 문자(SMS) 인증은 Google Merchant Center 인증 창에서 직접 진행돼요.</div>
          <button class="gc-btn gc-btn-dark gc-mt-8" id="btn-phone-open" style="width:100%;">Google에서 인증하기 ⧉</button>
          <div class="gc-faint" style="text-align:right;font-size:11px;margin-top:2px;">새 탭으로 열림</div>
          <div class="gc-small gc-mt-16">인증을 마치셨나요?</div>
          <button class="gc-btn gc-mt-8" id="btn-phone-refresh" style="width:100%;">인증 상태 새로고침 ↻</button>`;
      }
      return `
        <div class="gc-small gc-muted">Google Merchant Center 연결을 마치려면 마지막으로 서비스 약관에 동의해야 해요.</div>
        <a href="#" class="gc-btn-link gc-mt-8" style="display:inline-flex;">약관 전문 자세히 보기</a>
        <label class="gc-consent-agree" style="margin-top:16px;"><input type="checkbox" class="gc-checkbox" id="mc-step4-agree"> (필수) Google 판매자 서비스 약관에 동의합니다</label>`;
    }

    function render(bd) {
      const isConsentStep = idx === 1 || idx === 3;
      const nextDisabled = isConsentStep || (idx === 2 && wState.phone !== "done");
      // 근거: 05_MC연결-0~4 전 화면에서 [다음]/[연결하기]는 회색(비활성)→검정(활성) 패턴만 사용, 파란 버튼 없음
      const nextBtnCls = nextDisabled ? "gc-btn gc-btn-gated" : "gc-btn gc-btn-dark";
      bd.querySelector(".gc-modal").innerHTML = `
        <div class="gc-modal-header"><div><h3 class="gc-modal-title">Merchant Center 연결 — ${steps[idx]}</h3><p class="gc-modal-sub">${idx + 1} / ${steps.length}단계</p></div><button class="gc-modal-close" data-close-modal>✕</button></div>
        <div class="gc-modal-body">${stepBody()}</div>
        <div class="gc-modal-footer spread">
          <button class="gc-btn" id="btn-wiz-prev" ${idx === 0 ? "disabled" : ""}>이전</button>
          <button class="${nextBtnCls}" id="btn-wiz-next" ${nextDisabled ? "disabled" : ""}>${idx === steps.length - 1 ? "연결하기" : "다음"}</button>
        </div>
      `;
      bd.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", () => GC.closeModal(bd)));
      bd.querySelector("#btn-wiz-prev").addEventListener("click", () => { idx--; render(bd); });
      if (idx === 0) {
        const modeExisting = bd.querySelector("#mc-mode-existing");
        const modeNew = bd.querySelector("#mc-mode-new");
        if (modeExisting) modeExisting.addEventListener("change", () => { wState.accountMode = "existing"; render(bd); });
        if (modeNew) modeNew.addEventListener("change", () => { wState.accountMode = "new"; render(bd); });
        const nameInput = bd.querySelector("#mc-business-name");
        if (nameInput) nameInput.addEventListener("input", (e) => { wState.businessName = e.target.value; });
      }
      const phoneOpenBtn = bd.querySelector("#btn-phone-open");
      if (phoneOpenBtn) phoneOpenBtn.addEventListener("click", () => window.open("https://merchants.google.com/", "_blank"));
      const phoneRefreshBtn = bd.querySelector("#btn-phone-refresh");
      if (phoneRefreshBtn) phoneRefreshBtn.addEventListener("click", () => {
        wState.phone = "checking"; render(bd);
        setTimeout(() => { wState.phone = "done"; render(bd); }, 1500);
      });
      const phoneRetryBtn = bd.querySelector("#btn-phone-retry");
      if (phoneRetryBtn) phoneRetryBtn.addEventListener("click", () => {
        wState.phone = "checking"; render(bd);
        setTimeout(() => { wState.phone = "done"; render(bd); }, 1500);
      });
      if (idx === 1) bindConsentGate(bd, "#mc-step2-agree", "#btn-wiz-next");
      if (idx === 3) bindConsentGate(bd, "#mc-step4-agree", "#btn-wiz-next");
      bd.querySelector("#btn-wiz-next").addEventListener("click", () => {
        if (idx === 0 && wState.accountMode === "new") {
          const msg = validateMcBusinessName(wState.businessName);
          if (msg) { alert(msg); return; }
        }
        if (idx === 3) {
          GC.closeModal(bd);
          card.mc = "domainShipping"; card.domain = "idle"; card.shipping = "idle";
          renderConnectedShell();
          GC.toast("Merchant Center가 연결되었습니다.", "success");
          return;
        }
        idx++; render(bd);
      });
    }
    const bd = GC.openModal(`<div></div>`, { size: "wide", persistent: true });
    render(bd);
  }

  // ---------- Google Ads 설정 박스 ----------
  function renderAdsBox() {
    const box = mount.querySelector("#ads-box");
    if (card.ads === "empty") {
      box.innerHTML = `
        <div class="gc-box-title">Google Ads 설정</div>
        <div class="gc-box-desc">Google Ads를 연결하면 쇼핑 광고를 사용할 수 있어요(단, 쇼핑 광고 노출 자체는 Merchant Center 연동도 함께 필요해요). Merchant Center와 독립적으로 연결할 수 있어요.</div>
        <button class="gc-btn gc-btn-primary" id="btn-ads-start">Google Ads 연결하기</button>
      `;
      box.querySelector("#btn-ads-start").addEventListener("click", openAdsWizard);
      return;
    }
    // 근거: 1-6장 6-4-4 Google Ads 연결 실패 오류 매핑 표 — 대표 사유별 후속 조치(재인증/계정확인/권한확인/다시시도) 4종을 축약 반영
    if (card.ads === "failed") {
      const reason = M().adsFailureReasons[card.adsFailureReasonIdx || 0];
      box.innerHTML = `
        <div class="gc-box-title">Google Ads 설정</div>
        <div class="gc-consent-box" style="background:#fef2f2;border-color:#fecaca;">
          <div class="gc-small" style="color:var(--gc-danger);font-weight:700;">■ ${GC.esc(reason.label)}</div>
          <div class="gc-faint gc-small gc-mt-4">오류 코드: ${reason.code}</div>
        </div>
        <button class="gc-btn gc-btn-dark gc-mt-12" id="btn-ads-failure-action">${GC.esc(reason.actionLabel)}</button>
      `;
      box.querySelector("#btn-ads-failure-action").addEventListener("click", () => {
        if (reason.action === "reauth") { card.ads = "empty"; renderConnectedShell(); openAdsWizard(); return; }
        if (reason.action === "retry") {
          const btn = box.querySelector("#btn-ads-failure-action");
          btn.disabled = true; btn.innerHTML = `<span class="gc-spinner"></span> 다시 연결하는 중...`;
          setTimeout(() => { card.ads = "done"; renderConnectedShell(); GC.toast("Google Ads가 다시 연결되었습니다.", "success"); }, 1000);
          return;
        }
        window.open("https://ads.google.com/", "_blank");
      });
      return;
    }
    box.innerHTML = `
      <div class="gc-flex-between">
        <div class="gc-box-title" style="margin-bottom:0;">Google Ads 계정 정보</div>
        <a href="#" class="gc-btn-link gc-small">Google Ads 바로가기</a>
      </div>
      <div class="gc-field-grid gc-mt-16">
        <div class="gc-field"><div class="lbl">Google Ads 계정</div><div class="val gc-flex gc-gap-8" style="align-items:center;">${GC.esc(M().ads.accountName)} ${accountStatusBadge(M().ads.status, {
          connected: { label: "연결됨", tone: "success" },
          reauth_required: { label: "재인증 필요", tone: "warning" }
        })}</div></div>
        <div class="gc-field"><div class="lbl">결제 프로필</div><div class="val">${GC.esc(M().ads.billingProfile)}</div></div>
        <div class="gc-field"><div class="lbl">Merchant Center 연동 상태</div><div class="val ${card.mc === "done" ? "ok" : "warn"}">${card.mc === "done" ? "연동됨" : "미연동"}</div></div>
        <div class="gc-field"><div class="lbl">쇼핑 광고 사용 가능 여부</div><div class="val ${card.mc === "done" && !card.adsShoppingBlocked ? "ok" : "danger"}">${card.mc === "done" && !card.adsShoppingBlocked ? "가능" : "사용 불가 — Merchant Center 연결 필요"}</div></div>
        <div class="gc-field"><div class="lbl">연결 완료 일시</div><div class="val muted">2026-07-28 14:32</div></div>
      </div>
      <hr class="gc-subbox-divider">
      <div class="gc-flex gc-gap-8">
        <button class="gc-btn gc-btn-sm" id="btn-ads-change">계정 변경</button>
        <button class="gc-btn gc-btn-sm gc-btn-danger" id="btn-ads-disconnect">연결 해제</button>
      </div>
    `;
    box.querySelector("#btn-ads-change").addEventListener("click", () => GC.toast("계정 변경 화면으로 이동합니다.", "info"));
    box.querySelector("#btn-ads-disconnect").addEventListener("click", () => confirmDisconnect("Google Ads", () => { card.ads = "empty"; renderConnectedShell(); }));
  }

  // 받침 유무에 따라 "을/를" 조사를 반환 (한글 음절이 아니면 "을(를)"로 폴백)
  function josa(word) {
    const ch = word.trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? "를" : "을";
    return "을(를)";
  }

  // ---------- Google Ads 연결 5단계 위저드 (Ads연결-0~4, 5-1·5-2장 정책 순서로 정정) ----------
  function openAdsWizard() {
    const steps = ["개인정보 동의", "OAuth 동의", "Ads 계정 선택", "연결 정보 확인", "연결 완료"];
    let idx = 0;
    const wState = { checked: new Set(), progressTimer: null };

    function stepBody() {
      if (idx === 0) {
        return `
          <div class="gc-consent-sub" style="margin-top:-4px;">Google Ads 계정 연결과 광고 성과 및 전환 측정 기능을 제공하기 위해 아래와 같이 개인정보를 수집·이용합니다.<br>내용을 확인하고 동의해주세요.</div>
          ${consentBoxes([
            { title: "수집·이용 항목", body: "Google 계정 이메일, Google Ads 계정명, Google Ads 고객 ID, Google Ads 계정 및 캠페인 식별정보, Google Tag 및 전환 액션 식별정보, OAuth 인증 및 연동 상태 정보" },
            { title: "수집·이용 목적", body: `<ul style="padding-left:16px;margin:0;"><li>Google Ads 계정 연결 및 연동 상태 관리</li><li>Google Tag 및 전환 측정 설정 확인</li><li>광고 캠페인 및 성과 정보 조회</li><li>Google Ads 연동 오류 확인 및 기능 제공</li><li>광고 운영 현황 및 성과 분석 기능 제공</li></ul>` },
            { title: "보유·이용 기간", body: "Google Ads 계정 연동을 해제 또는 서비스 해지 시 지체 없이 파기합니다.<br>단, 관계 법령의 규정에 의하여 일정 기간 보존이 필요한 경우에는 해당 기간만큼 보관 후 삭제합니다." },
            { title: "동의 거부 권리 및 불이익", body: "개인정보 수집·이용에 대한 동의를 거부할 수 있습니다. 다만, 필수 항목에 동의하지 않을 경우 Google Ads 계정 연동 및 관련 기능을 이용할 수 없습니다." }
          ])}
          <label class="gc-consent-agree"><input type="checkbox" class="gc-checkbox" id="ads-step0-agree"> (필수) Google Ads 연동을 위한 개인정보 수집·이용에 동의합니다.</label>`;
      }
      if (idx === 2) {
        return M().adsAccountsList.map((a, i) => `<label class="gc-flex gc-gap-8" style="padding:10px;border:1px solid var(--gc-line-soft);border-radius:6px;margin-bottom:8px;"><input type="radio" name="adsacc" ${i === 0 ? "checked" : ""}><div><div class="gc-small" style="font-weight:600;">${GC.esc(a.name)}</div><div class="gc-faint gc-small">ID: ${a.id}</div></div></label>`).join("");
      }
      if (idx === 3) {
        // 근거: Ads연결-3_자동설정.svg — 진행 중(스피너+동적 문구)/완료(초록 진행바) 두 상태를 순차 전환
        const items = M().adsConfirmItems;
        const doneCount = wState.checked.size;
        const allDone = doneCount >= items.length;
        const pct = Math.round((doneCount / items.length) * 100);
        const current = !allDone ? items[doneCount] : null;
        const currentBase = current ? current.label.replace(/\s*확인$/, "") : "";
        const headline = allDone ? "모든 항목 확인이 완료되었습니다." : `${currentBase}${josa(currentBase)} 확인하고 있습니다...`;
        const subtext = allDone ? "아래 완료 확인 버튼을 클릭해 연결 결과를 확인해주세요." : "잠시만 기다려주세요.";
        return `
          <div style="text-align:center;padding:4px 0 18px;">
            <div class="gc-small" style="font-weight:700;font-size:15px;">${GC.esc(headline)}</div>
            <div class="gc-faint gc-small gc-mt-4">${subtext}</div>
          </div>
          <div class="gc-progressbar gc-mt-8" style="margin-bottom:8px;"><div style="width:${pct}%;background:${allDone ? "var(--gc-success)" : "var(--gc-primary)"};"></div></div>
          <div class="gc-small" style="text-align:right;margin-bottom:8px;color:${allDone ? "var(--gc-success)" : "var(--gc-text-faint)"};font-weight:${allDone ? "700" : "400"};">${doneCount} / ${items.length} 완료</div>
          ${items.map((it, i) => {
            const state = i < doneCount ? "done" : (i === doneCount && !allDone ? "checking" : "pending");
            const icon = state === "done" ? "✅" : state === "checking" ? '<span class="gc-spinner" style="width:14px;height:14px;"></span>' : "⚪";
            const statusLabel = state === "done"
              ? '<span style="color:var(--gc-success);font-weight:600;">완료</span>'
              : state === "checking"
                ? '<span style="color:var(--gc-primary);font-weight:600;">진행 중</span>'
                : '<span class="gc-faint">대기</span>';
            return `<div class="gc-flex-between" style="padding:6px 0;"><div class="gc-flex gc-gap-8"><span style="width:16px;display:inline-flex;justify-content:center;">${icon}</span><span class="gc-small">${GC.esc(it.label)}</span></div><span class="gc-small">${statusLabel}</span></div>`;
          }).join("")}
        `;
      }
      // 근거: Ads연결-4_연결완료.svg — 체크 아이콘+헤드라인, 10행 요약 리스트(라벨 좌/값 우), 하단 안내 박스
      const mcLinked = card.mc === "done";
      const toneColor = { ok: "var(--gc-success)", warn: "var(--gc-warning)" };
      const rows = [
        { label: "Google Ads", value: "연결 완료", tone: "ok", dot: true },
        { label: "계정명", value: M().ads.accountName },
        { label: "고객 ID", value: M().ads.customerId },
        { label: "Google Tag", value: "정상", tone: "ok" },
        { label: "구매 전환", value: "설정 필요", tone: "warn" },
        { label: "장바구니 추가 전환", value: "정상", tone: "ok" },
        { label: "결제 시작 전환", value: "정상", tone: "ok" },
        { label: "향상된 전환", value: "설정 필요", tone: "warn" },
        { label: "광고 성과 조회", value: "사용 가능", tone: "ok" },
        { label: "Merchant Center 연결 여부", value: mcLinked ? "연동됨" : "설정 필요", tone: mcLinked ? "ok" : "warn" }
      ];
      return `
        <div style="text-align:center;padding:6px 0 20px;">
          <div style="width:56px;height:56px;border-radius:50%;background:var(--gc-success-bg);border:2px solid var(--gc-success);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px;color:var(--gc-success);font-weight:700;">✓</div>
          <div style="font-weight:700;font-size:15px;">Google Ads 계정 연결이 완료되었습니다.</div>
          <div class="gc-faint gc-small gc-mt-4">이제 광고 성과를 조회하고 전환 측정 기능을 설정할 수 있어요.</div>
        </div>
        ${rows.map((r) => `
          <div class="gc-flex-between" style="padding:10px 0;border-bottom:1px solid var(--gc-line-soft);">
            <span class="gc-small gc-faint">${GC.esc(r.label)}</span>
            <span class="gc-small" style="font-weight:700;${r.tone ? `color:${toneColor[r.tone]};` : ""}">${r.dot ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gc-success);margin-right:5px;"></span>' : ""}${GC.esc(r.value)}</span>
          </div>
        `).join("")}
        <div class="gc-empty-hint" style="display:block;width:100%;box-sizing:border-box;margin-top:14px;">
          <strong style="color:var(--gc-text);">쇼핑 광고 추가 설정</strong><br>
          현재 Google Ads 계정으로 광고 성과 조회와 전환 측정 기능을 사용할 수 있어요.<br>
          ${mcLinked ? "Merchant Center와 연동되어 있어 상품 피드 기반 쇼핑 광고와 Performance Max를 운영할 수 있어요." : "쇼핑 광고와 상품 피드 기반 Performance Max를 운영하려면 Merchant Center를 추가로 연결해주세요."}
        </div>`;
    }

    // OAuth 동의(2단계)는 위저드 챕터가 아니라 실제 Google 팝업 그대로 노출 (근거: Ads연결-2_OAuth동의.svg)
    function renderOAuthStep(bd) {
      const email = M().googleAccountsForLogin ? M().googleAccountsForLogin[0].email : M().googleAccount.email;
      bd.querySelector(".gc-modal").innerHTML = gShell(gScopeAdsBody(email));
      bindGShellClose(bd, () => { clearInterval(wState.progressTimer); GC.closeModal(bd); });
      bd.querySelector("#g-scope-cancel").addEventListener("click", () => { clearInterval(wState.progressTimer); GC.closeModal(bd); });
      bd.querySelector("#g-scope-continue").addEventListener("click", () => { idx++; render(bd); });
    }

    function render(bd) {
      if (idx === 1) { renderOAuthStep(bd); return; }
      const isConsentStep = idx === 0;
      const isDoneStep = idx === steps.length - 1;
      const nextLabel = isDoneStep ? "완료" : (idx === 3 ? "완료 확인" : "다음");
      const nextDisabled = isConsentStep || (idx === 3 && wState.checked.size < M().adsConfirmItems.length);
      const nextBtnCls = isConsentStep ? "gc-btn gc-btn-gated" : "gc-btn gc-btn-primary";
      // 근거: Ads연결-4_연결완료.svg — 완료 화면은 헤더가 "Google Ads 연결 완료" 단일 타이틀(단계 카운터 없음)이고
      // 하단 버튼도 이전/다음이 아니라 [Google Ads 바로가기]/[완료] 2개로 바뀐다.
      const headerHtml = isDoneStep
        ? `<div class="gc-modal-header"><h3 class="gc-modal-title">Google Ads 연결 완료</h3><button class="gc-modal-close" data-close-modal>✕</button></div>`
        : `<div class="gc-modal-header"><div><h3 class="gc-modal-title">Google Ads 연결 — ${steps[idx]}</h3><p class="gc-modal-sub">${idx + 1} / ${steps.length}단계</p></div><button class="gc-modal-close" data-close-modal>✕</button></div>`;
      const footerHtml = isDoneStep
        ? `<div class="gc-modal-footer spread"><button class="gc-btn" id="btn-ads-goto">Google Ads 바로가기</button><button class="gc-btn gc-btn-dark" id="btn-wiz-next">완료</button></div>`
        : `<div class="gc-modal-footer spread"><button class="gc-btn" id="btn-wiz-prev" ${idx === 0 ? "disabled" : ""}>이전</button><button class="${nextBtnCls}" id="btn-wiz-next" ${nextDisabled ? "disabled" : ""}>${nextLabel}</button></div>`;
      bd.querySelector(".gc-modal").innerHTML = `
        ${headerHtml}
        <div class="gc-modal-body">${stepBody()}</div>
        ${footerHtml}
      `;
      bd.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", () => { clearInterval(wState.progressTimer); GC.closeModal(bd); }));
      if (!isDoneStep) bd.querySelector("#btn-wiz-prev").addEventListener("click", () => { idx--; render(bd); });
      if (isDoneStep) bd.querySelector("#btn-ads-goto").addEventListener("click", () => GC.toast("Google Ads로 이동합니다.", "info"));
      if (isConsentStep) bindConsentGate(bd, "#ads-step0-agree", "#btn-wiz-next");
      if (idx === 3 && wState.checked.size < M().adsConfirmItems.length && !wState.progressTimer) {
        const items = M().adsConfirmItems;
        wState.progressTimer = setInterval(() => {
          if (wState.checked.size >= items.length) { clearInterval(wState.progressTimer); wState.progressTimer = null; return; }
          wState.checked.add(wState.checked.size);
          render(bd);
        }, 1000);
      }
      bd.querySelector("#btn-wiz-next").addEventListener("click", () => {
        if (idx === steps.length - 1) {
          GC.closeModal(bd);
          card.ads = "done";
          renderConnectedShell();
          GC.toast("Google Ads가 연결되었습니다.", "success");
          return;
        }
        idx++; render(bd);
      });
    }
    const bd = GC.openModal(`<div></div>`, { size: "wide", persistent: true });
    render(bd);
  }

  // ---------- 상품 피드 박스 (AREA-DASH-FEED-SUMMARY) ----------
  function renderFeedBox() {
    const box = mount.querySelector("#feed-box");
    // 근거: SCR-GOOGLE-DASH-001-연동완료-부분(MFC만 연동).svg — Merchant Center는 연결됐지만 상품 피드가
    // 아직 전송되지 않은 상태(card.feedConnected=false)에서는 "자동 매칭하기"/"직접 매칭하기" 2버튼 Empty 상태를 노출한다.
    if (!card.feedConnected) {
      box.innerHTML = `
        <div class="gc-box-title">상품 피드 설정</div>
        <div class="gc-box-desc">Google Merchant Center 및 Google Ads와 연동할 상품 피드의 생성, 동기화, 전송 상태를 관리할 수 있습니다</div>
        <div class="gc-flex gc-gap-8">
          <button class="gc-btn gc-btn-primary" id="btn-feed-auto">자동 매칭하기</button>
          <button class="gc-btn gc-btn-primary" id="btn-feed-manual">직접 매칭하기</button>
        </div>
      `;
      // 근거: 02_상품피드_탭/02_상품피드_반영_정책.md 2장 — "자동 매칭하기"는 모달 없이 즉시 최초 전송을 시작하고,
      // "직접 매칭하기"는 성별·연령대가 없는 INITIAL 모달을 연다(연결관리 탭은 카테고리 기준, 상품 단위 속성 없음).
      box.querySelector("#btn-feed-auto").addEventListener("click", () => {
        card.feedConnected = true;
        GC.toast("상품 피드 연동이 시작되었습니다.", "success");
        renderFeedBox();
      });
      box.querySelector("#btn-feed-manual").addEventListener("click", () => {
        window.GC_FEED.openCategoryMatchingModalInitial(() => {
          card.feedConnected = true;
          renderFeedBox();
        });
      });
      return;
    }
    const s = M().feed;
    const total = Object.values(s.statusCounts).reduce((a, b) => a + b, 0);
    const segs = [
      { k: "active", label: "활동중", color: "var(--gc-success)" },
      { k: "review", label: "검토중", color: "var(--gc-info)" },
      { k: "disapproved", label: "미승인", color: "var(--gc-danger)" },
      { k: "limited", label: "노출제한", color: "#f59e0b" },
      { k: "disabled", label: "사용안함", color: "#c7cbd3" }
    ];
    box.innerHTML = `
      <div class="gc-box-title">상품 피드 설정</div>
      <div class="gc-box-desc">Google Merchant Center 및 Google Ads와 연동할 상품 피드의 생성, 동기화, 전송 상태를 관리할 수 있습니다</div>
      <div class="gc-subbox">
        <div class="gc-subbox-header">
          <div class="gc-subbox-title">상품 피드 정보</div>
          <a href="#" class="gc-btn-link gc-small">Merchant Center 바로가기</a>
        </div>
        <div class="gc-flex-between gc-mt-8">
          <span class="gc-small gc-muted">카테고리 설정</span>
          <button class="gc-btn gc-btn-sm" id="btn-feed-cat">상품 카테고리 매칭</button>
        </div>
        <div class="gc-small gc-mt-16">${card.feedConnected ? `상품개수: ${GC.fmtNumber(s.productCount)}개 (최근 동기화: ${s.lastSync})` : "아직 상품 피드가 전송되지 않았어요."}</div>
        ${card.feedConnected ? `
        <div class="gc-mt-12">
          <div class="gc-small gc-muted gc-mt-8" style="margin-bottom:6px;">상품 피드 상태 <span class="gc-info-icon">?</span></div>
          <div class="gc-statusbar">${segs.map((sg) => `<div style="width:${(s.statusCounts[sg.k] / total * 100).toFixed(1)}%; background:${sg.color};"></div>`).join("")}</div>
          <div class="gc-flex gc-gap-16 gc-mt-8" style="flex-wrap:wrap;">
            ${segs.map((sg) => `<span class="gc-statusbar-legend"><span class="sw" style="background:${sg.color};"></span>${sg.label}: ${s.statusCounts[sg.k]}개</span>`).join("")}
          </div>
        </div>` : ""}
      </div>
    `;
    box.querySelector("#btn-feed-cat").addEventListener("click", () => window.GC_FEED.openCategoryMatchingModal());
  }

  function confirmDisconnect(label, onConfirm) {
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">${label} 연결을 해제할까요?</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body gc-small gc-muted">연결을 해제하면 종속된 기능이 즉시 비활성화됩니다. 이 작업은 언제든 다시 연결하여 되돌릴 수 있습니다.</div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-danger" id="btn-confirm-disc">연결 해제</button></div>
    `;
    const bd = GC.openModal(html);
    bd.querySelector("#btn-confirm-disc").addEventListener("click", () => { GC.closeModal(bd); onConfirm(); GC.toast(`${label} 연결이 해제되었습니다.`, "success"); });
  }

  // dev 툴바에서 상태를 바꿔도 이전 선택에서 남긴 계정 상태(확인 필요/연결 오류/재인증 필요/정지됨 등) 오버라이드가
  // 다음 화면에 새지 않도록, 상태 전환마다 계정 상태값을 기본값(정상)으로 되돌린다.
  function resetAccountStatuses() {
    M().googleAccount.status = "connected";
    M().mc.status = "connected"; M().mc.statusReason = "";
    M().ads.status = "connected";
  }

  // ===================== state 진입점 =====================
  window.GC_DASH = {
    mountId: "panel-dash",
    states: [
      { value: "미연동", label: "미연동" },
      { value: "둘다미연결", label: "연동완료 — 둘 다 미연결" },
      { value: "GMC만", label: "GMC만 연동" },
      { value: "GMC-도메인배송미인증", label: "GMC 연동완료 — 도메인·배송 미인증" },
      { value: "GMC-도메인인증실패", label: "GMC 연동완료 — 도메인 인증 실패" },
      { value: "Ads만", label: "Ads만 연동" },
      { value: "상품피드만", label: "상품피드만 연동" },
      { value: "전체", label: "전체 연동완료" },
      { value: "MC-확인필요", label: "전체 연동완료 — MC 확인 필요" },
      { value: "MC-연결오류", label: "전체 연동완료 — MC 연결 오류" },
      { value: "MC-정지됨", label: "전체 연동완료 — MC 계정 정지됨" },
      { value: "Ads-연결실패", label: "전체 연동완료 — Ads 연결 실패" },
      { value: "전체-재인증필요", label: "전체 연동완료 — Google 계정 재인증 필요(전파)" }
    ],
    render(container, state) {
      mount = container;
      if (state === "미연동") { renderDisconnected(); return; }
      card = freshCard();
      resetAccountStatuses();
      // 근거: 연동완료-부분(Ads만 연동).svg는 MC 계정이 이미 연결된 상태로 그려져 있음(도메인·배송 완료 포함) —
      // 원본 그대로 반영(다른 정책 문서의 [확인 필요-디자인] 플래그 참조).
      if (state === "GMC만") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = false; }
      else if (state === "GMC-도메인배송미인증") { card.mc = "domainShipping"; }
      else if (state === "GMC-도메인인증실패") { card.mc = "domainShipping"; card.domain = "failed"; card.domainFailReason = "SSL 인증서가 유효하지 않아 도메인 소유권을 확인할 수 없어요."; }
      else if (state === "Ads만") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = false; card.ads = "done"; card.adsShoppingBlocked = true; }
      else if (state === "상품피드만") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; }
      else if (state === "전체") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; card.ads = "done"; }
      else if (state === "MC-확인필요") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; card.ads = "done"; M().mc.status = "issue"; M().mc.statusReason = "사업자 정보에서 확인되지 않는 항목이 있어요."; }
      else if (state === "MC-연결오류") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; card.ads = "done"; M().mc.status = "error"; M().mc.statusReason = "Merchant Center 연결에 실패했어요. 계정 연결 상태를 다시 확인해 주세요."; }
      else if (state === "MC-정지됨") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; card.ads = "done"; M().mc.status = "suspended"; }
      else if (state === "Ads-연결실패") { card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; card.ads = "failed"; card.adsFailureReasonIdx = 0; }
      else if (state === "전체-재인증필요") {
        card.mc = "done"; card.domain = "done"; card.shipping = "done"; card.feedConnected = true; card.ads = "done";
        // 근거: 1-6장 6-7 — Google 계정 자체 인증 문제는 Merchant Center·Google Ads 상태에도 동시에 전파된다.
        M().googleAccount.status = "reauth_required"; M().mc.status = "reauth_required"; M().ads.status = "reauth_required";
      }
      renderConnectedShell();
    }
  };
})();
