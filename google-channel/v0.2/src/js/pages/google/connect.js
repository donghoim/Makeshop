/* ==========================================================================
   SCR-GOOGLE-CONN-001 · Google 연결관리
   - Google 계정 연결 후 Merchant Center·Google Ads를 각각 따로 연결한다 (POL-035)
   - 연결 상태는 화면 진입마다 Google API로 다시 확인한다(결정 주체 Google, POL-036)
   - 연결 절차 세부 화면은 v0.1 화면설계서 4-2부터 4-18을 따르며, 여기서는 단계만 시뮬레이션한다
   ========================================================================== */
const GConnect = (function () {
  const G = () => window.GMOCK;
  const C = () => GCommon;

  function render(root, params) {
    const s = GStore.s;
    if (s.account === "none") {
      root.appendChild(
        App.emptyState({
          logo: C().gLogoBig(),
          title: "Google 계정 하나로<br>Merchant Center와 Google Ads를 연결하세요.",
          desc: "Google 계정을 연결한 뒤 Merchant Center(상품 피드)와 Google Ads(광고 성과)를 필요한 것부터 각각 연결할 수 있습니다.",
          btn: "Google 계정으로 시작하기",
          btnIcon: '<span class="g-ic">G</span>',
          note: "Merchant Center만 연결해도 상품 피드를, Google Ads만 연결해도 광고 성과를 이용할 수 있습니다.",
          onClick: () => C().startAccount(() => App.render()),
        })
      );
      if (params && params.open === "account") setTimeout(() => C().startAccount(() => App.render()), 150);
      return;
    }
    root.appendChild(App.banner("연결관리", "Google 계정을 연결하고 Merchant Center와 Google Ads를 각각 연결하는 공간입니다.<br>Google 계정 연결 후 두 서비스는 따로 연결할 수 있으며, 연결 상태와 계정 정보를 확인할 수 있습니다."));
    root.appendChild(accountSection());
    root.appendChild(mcSection());
    if (s.mc !== "none") root.appendChild(feedSection());
    root.appendChild(adsSection());
    if (params && params.open === "ads" && s.ads === "none") setTimeout(openAdsWizard, 150);
    if (params && params.focus === "mc") setTimeout(() => { const el = root.querySelector("#g-mc"); el && el.scrollIntoView({ behavior: "smooth", block: "start" }); el && el.classList.add("is-flash"); }, 50);
  }

  /* ---------------- 1. Google 계정 ---------------- */
  function accountSection() {
    const s = GStore.s;
    const re = s.account === "reauth";
    const body = `<dl class="kv"><div class="kv__row"><dt>Google 계정</dt><dd><span class="g-av">${G().account.name.charAt(0)}</span>${UI.esc(G().account.email)} ${re ? C().pill("재인증 필요", "red") : C().pill("연결됨")}</dd><dd class="kv__link">${re ? '<button type="button" class="btn btn--primary btn--sm" data-act="relogin">다시 연결하기</button>' : ""}</dd></div>
      ${re ? `<div class="kv__row"><dt></dt><dd class="kv__wide"><p class="note note--warn">${UI.icon.info}<span>Google 계정 인증이 만료되어 Merchant Center·Google Ads 모두 재인증이 필요합니다. 상품 피드 전송이 멈춰 있습니다.</span></p></dd></div>` : ""}</dl>`;
    const el = App.section("Google 계정", '<button type="button" class="btn btn--line btn--sm" data-act="unlink-all">전체 연결 해제</button>', body);
    el.querySelector('[data-act="unlink-all"]').addEventListener("click", async () => {
      if (!(await UI.confirm("Google 계정 연결을 해제하면 Merchant Center와 Google Ads 연결도 함께 해제되고 상품 피드 자동 전송이 중단됩니다.\n전체 연결을 해제하시겠습니까?"))) return;
      GStore.disconnectAll();
      App.render();
      UI.toast("Google 전체 연결이 해제되었습니다.", "success");
    });
    const rl = el.querySelector('[data-act="relogin"]');
    if (rl) rl.addEventListener("click", () => C().startAccount(() => { GStore.s.account = "connected"; if (GStore.s.mc === "reauth") GStore.s.mc = "connected"; if (GStore.s.ads === "reauth") GStore.s.ads = "connected"; GStore.save(); GStore.scheduleQueue(); App.render(); }));
    return el;
  }

  /* ---------------- 2. Merchant Center ---------------- */
  function mcSection() {
    const s = GStore.s;
    const st = GStore.mcState();
    let body;
    let actions = "";
    if (st === "none") {
      body = `<p class="sec__lead">연결된 Merchant Center 계정과 도메인 인증, 판매국가·배송 설정 상태입니다.<br>Merchant Center를 연결하면 메이크샵 상품을 Google에 무료 리스팅·쇼핑 광고로 노출할 수 있습니다.</p>
        <button type="button" class="btn btn--primary btn--lg" data-act="mc-connect">Merchant Center 연동하기</button>`;
    } else {
      const a = s.mcAccount || G().merchantCandidates[0];
      const statePill = st === "reauth" ? C().pill("재인증 필요", "red") : C().pill("연결됨");
      const domain = { none: [C().pill("인증 필요", "gray"), '<button type="button" class="btn btn--line btn--sm" data-act="domain">인증하기</button>'], verifying: [C().pill("인증 중", "line"), ""], done: [C().pill("인증 완료", "solid-blue"), ""], fail: [C().pill("인증 실패", "red"), '<button type="button" class="btn btn--line btn--sm" data-act="domain">다시 시도</button>'] }[s.domain];
      body = `<dl class="kv">
        <div class="kv__row"><dt>Merchant Center 계정 ID</dt><dd>${a.id} ${statePill}${s.mcSuspended ? " " + C().pill("계정 정지됨", "red") : ""}</dd><dd class="kv__link"><a class="ext" data-ext="Merchant Center 바로가기" data-url="https://merchants.google.com/mc/overview?a=${a.id}">Merchant Center 바로가기 ${UI.icon.ext}</a></dd></div>
        ${s.mcSuspended ? `<div class="kv__row"><dt></dt><dd class="kv__wide"><p class="note note--warn">${UI.icon.info}<span>Google이 Merchant Center 계정을 정지했습니다. 연결은 유지되며, 정지 해제는 Merchant Center에서 진행해 주세요.</span></p></dd></div>` : ""}
        ${st === "reauth" ? `<div class="kv__row"><dt></dt><dd class="kv__wide"><p class="note note--warn">${UI.icon.info}<span>Merchant Center 접근 권한을 확인할 수 없습니다. 다시 연결해 주세요. Google Ads는 영향이 없습니다.</span></p></dd></div>` : ""}
        <div class="kv__row"><dt>비즈니스 이름</dt><dd>${UI.esc(a.name)}</dd></div>
        <div class="kv__row"><dt>비즈니스 국가</dt><dd>대한민국</dd></div>
        <div class="kv__row"><dt>연결 완료 일시</dt><dd>2026-07-28 14:32</dd></div>
        <div class="kv__row"><dt>쇼핑몰 도메인 인증</dt><dd>${domain[0]} <span class="muted">${G().merchant.domain}${s.domain === "done" ? " · 2026-07-28 15:10" : ""}</span></dd><dd class="kv__link">${domain[1]}</dd></div>
        <div class="kv__row"><dt>판매국가·배송 설정</dt><dd>${s.shipping ? C().pill("설정 완료", "solid-blue") + ' <span class="muted">판매 국가 대한민국 · 쇼핑몰 배송 설정 자동 가져오기</span>' : C().pill("설정 필요", "gray")}</dd><dd class="kv__link"><button type="button" class="btn btn--line btn--sm" data-act="ship">${s.shipping ? "변경하기" : "설정하기"}</button></dd></div>
      </dl>`;
      actions = '<button type="button" class="btn btn--line btn--sm" data-act="mc-change">계정 변경</button><button type="button" class="btn btn--line btn--sm" data-act="mc-unlink">연결 해제</button>';
    }
    const el = App.section("Merchant Center", actions, body);
    el.id = "g-mc";
    C().bindExt(el);
    const on = (k, fn) => { const b = el.querySelector(`[data-act="${k}"]`); if (b) b.addEventListener("click", fn); };
    on("mc-connect", () => openMcWizard(false));
    on("mc-change", async () => {
      if (!(await UI.confirm("Merchant Center 계정을 바꾸면 Google 상품 피드 정보를 초기화하고 전송 대상 상품을 다시 전송합니다.\n계정을 변경하시겠습니까?"))) return;
      openMcWizard(true);
    });
    on("mc-unlink", async () => {
      if (!(await UI.confirm("Merchant Center 연결을 해제하면 상품 피드 자동 전송이 중단되고 쇼핑 광고 기능을 사용할 수 없습니다. Google Ads 연결은 유지됩니다.\n연결을 해제하시겠습니까?"))) return;
      GStore.disconnectMc();
      App.render();
      UI.toast("Merchant Center 연결이 해제되었습니다.", "success");
    });
    on("domain", () => {
      GStore.s.domain = "verifying";
      GStore.save();
      App.render();
      setTimeout(() => {
        GStore.s.domain = "done"; // Homepage.claimed 재조회 결과로 최종 판정 (POL-044)
        GStore.save();
        UI.toast("쇼핑몰 도메인 인증이 완료되었습니다.", "success");
        afterSetup();
      }, 1500);
    });
    on("ship", openShipping);
    return el;
  }
  /** 도메인 인증·판매국가·배송 설정이 모두 끝나면 카테고리 매칭 모달 1회 자동 노출 (POL-063) */
  function afterSetup() {
    App.render();
    const s = GStore.s;
    if (s.domain === "done" && s.shipping && !s.autoMatchShown) setTimeout(() => C().openCategoryMatch(true), 250);
  }
  function openShipping() {
    const body = `<dl class="kv">
        <div class="kv__row"><dt>판매 국가</dt><dd><select class="select" disabled><option>대한민국</option></select></dd></div>
        <div class="kv__row"><dt>통화</dt><dd><select class="select" disabled><option>KRW (대한민국 원)</option></select></dd></div>
        <div class="kv__row"><dt>배송 설정</dt><dd><label class="chk"><input type="radio" name="ship" checked /> 쇼핑몰 배송 설정 자동 가져오기</label></dd></div>
      </dl><p class="note">${UI.icon.info}<span>착불 배송 또는 무게·가격별 차등 배송비를 쓰면 자동으로 가져올 수 없어 Merchant Center에서 직접 설정해야 합니다.</span></p>`;
    const m = UI.modal({ title: "판매국가·배송 설정", size: "md", body, footer: '<button type="button" class="btn btn--line btn--lg" data-act="c">취소</button><button type="button" class="btn btn--dark btn--lg" data-act="ok">저장</button>' });
    m.el.querySelector('[data-act="c"]').addEventListener("click", () => m.close(true));
    m.el.querySelector('[data-act="ok"]').addEventListener("click", () => {
      GStore.s.shipping = true;
      GStore.save();
      m.close(true);
      UI.toast("판매국가·배송 설정이 저장되었습니다.", "success");
      afterSetup();
    });
  }
  /** Merchant Center 연결 마법사: 준비사항 → 계정 선택 → 사업자 정보 제공 동의 → 전화번호 인증 → 약관 동의 */
  function openMcWizard(isChange) {
    const steps = isChange ? ["계정 선택"] : ["준비사항 확인", "계정 선택", "사업자 정보 제공 동의", "대표 전화번호 인증", "판매자 약관 동의"];
    let i = 0;
    let picked = G().merchantCandidates[0];
    const phone = { verified: false, googleDone: false }; // 전화번호 인증은 Google 화면에서 직접 진행 (POL-043)
    const m = UI.modal({ title: isChange ? "Merchant Center 계정 변경" : "Merchant Center 연결", size: "md", body: '<div id="mcw"></div>', footer: '<button type="button" class="btn btn--line btn--lg" data-act="prev">이전</button><button type="button" class="btn btn--dark btn--lg" data-act="next">다음</button>' });
    const box = m.el.querySelector("#mcw");
    const next = m.el.querySelector('[data-act="next"]');
    function paint() {
      const name = steps[i];
      const stepper = `<ol class="wstep">${steps.map((x, k) => `<li class="${k === i ? "is-on" : k < i ? "is-done" : ""}">${k + 1}. ${x}</li>`).join("")}</ol>`;
      let h = "";
      if (name === "준비사항 확인") h = `<p class="sec__lead">Merchant Center 연결 전에 아래 4가지가 준비되어야 합니다.</p><ul class="checklist">${["커넥트 정보(사업자 정보) 등록", "SSL 보안 인증서 적용", "쇼핑몰 이용약관·환불 정책 등록", "결제 수단 등록"].map((x) => `<li><span class="ok">✓</span>${x}<span class="muted">완료</span></li>`).join("")}</ul>`;
      if (name === "계정 선택") h = `<p class="sec__lead">연결할 Merchant Center 계정을 선택하세요.</p>${G().merchantCandidates.map((c, k) => `<label class="radio-card"><input type="radio" name="mc" value="${k}" ${c.id === picked.id ? "checked" : ""}/><span><b>${UI.esc(c.name)}</b><br><span class="muted">${c.id}</span></span></label>`).join("")}<label class="radio-card"><input type="radio" name="mc" value="new"/><span><b>새 Merchant Center 계정 만들기</b></span></label>`;
      if (name === "사업자 정보 제공 동의") h = `<div class="graybox"><b>Google에 제공하는 사업자 정보</b><ul><li>사업장 주소: 서울특별시 성동구 성수이로 ●● (마스킹)</li><li>대표 전화번호: ${G().merchant.phoneMasked}</li></ul></div><label class="chk"><input type="checkbox" id="mc-agree"/><span><em>(필수)</em>사업자 정보를 Google에 제공하는 데 동의합니다.</span></label>`;
      if (name === "대표 전화번호 인증") h = `<p class="sec__lead">대표 전화번호 인증은 Google 화면에서 직접 진행합니다. 인증번호 받기와 입력도 Google 화면에서 하며, 마친 뒤 [인증 확인]을 눌러 주세요. 이 단계는 건너뛸 수 없습니다.</p>
        <div class="phone-box"><span class="muted">대표 전화번호</span><b>${G().merchant.phoneMasked}</b><span id="ph-st">${phone.verified ? C().pill("인증 완료", "solid-blue") : C().pill("미인증", "gray")}</span></div>
        <div class="row-inline"><button type="button" class="btn btn--line" data-act="g-verify">Google에서 인증하기 ${UI.icon.ext}</button><button type="button" class="btn btn--dark" data-act="ph-check">인증 확인</button></div>
        <p class="muted small" id="ph-msg"></p>`;
      if (name === "판매자 약관 동의") h = `<div class="consent-box is-open"><div class="consent-box__text">Google Merchant Center 판매자 서비스 약관 (Google 제공 화면)</div></div><label class="chk"><input type="checkbox" id="mc-tos"/><span><em>(필수)</em>판매자 서비스 약관에 동의합니다.</span></label>`;
      box.innerHTML = stepper + h;
      m.el.querySelector('[data-act="prev"]').disabled = i === 0;
      next.textContent = i === steps.length - 1 ? "연결 완료" : "다음";
      box.querySelectorAll('input[name="mc"]').forEach((r) => r.addEventListener("change", () => { if (r.value !== "new") picked = G().merchantCandidates[+r.value]; }));
      const gv = box.querySelector('[data-act="g-verify"]');
      if (gv) gv.addEventListener("click", () => { phone.googleDone = true; UI.openExternal("Merchant Center 비즈니스 정보 · 전화번호 인증", "https://merchants.google.com/mc/businessinfo"); });
      const ck = box.querySelector('[data-act="ph-check"]');
      if (ck) ck.addEventListener("click", () => {
        // [인증 확인]을 누를 때만 phoneVerificationState 조회 — VERIFIED 인증 완료 / UNVERIFIED 미인증
        const st = box.querySelector("#ph-st");
        st.innerHTML = '<span class="spin"></span>';
        ck.disabled = true;
        setTimeout(() => {
          phone.verified = phone.googleDone;
          st.innerHTML = phone.verified ? C().pill("인증 완료", "solid-blue") : C().pill("미인증", "gray");
          box.querySelector("#ph-msg").textContent = phone.verified ? "Google에서 대표 전화번호 인증이 확인되었습니다." : "아직 인증되지 않았습니다. [Google에서 인증하기]로 인증을 마친 뒤 다시 확인해 주세요.";
          ck.disabled = false;
        }, 700);
      });
    }
    m.el.querySelector('[data-act="prev"]').addEventListener("click", () => { if (i > 0) { i--; paint(); } });
    next.addEventListener("click", async () => {
      const name = steps[i];
      if (name === "사업자 정보 제공 동의" && !box.querySelector("#mc-agree").checked) return UI.alert("사업자 정보 제공에 동의해 주세요.");
      if (name === "대표 전화번호 인증" && !phone.verified) return UI.alert("대표 전화번호 인증을 완료한 뒤 [인증 확인]을 눌러 주세요.");
      if (name === "판매자 약관 동의" && !box.querySelector("#mc-tos").checked) return UI.alert("판매자 서비스 약관에 동의해 주세요.");
      if (i < steps.length - 1) { i++; paint(); return; }
      m.close(true);
      if (isChange) {
        GStore.changeMc(picked);
        UI.toast("Merchant Center 계정이 변경되었습니다. 전송 대상 상품을 반영대기로 다시 등록했습니다.", "success");
        App.render();
      } else {
        GStore.connectMc(picked);
        UI.toast("Merchant Center가 연결되었습니다. 도메인 인증과 판매국가·배송 설정을 진행해 주세요.", "success");
        App.nav("#/google/connect?focus=mc");
      }
    });
    paint();
  }

  /* ---------------- 3. 상품 피드 요약 (Meta 연결관리와 같은 구성) ---------------- */
  function feedSection() {
    const s = GStore.s;
    const list = GStore.products();
    const done = Store.leafCategories().every((c) => s.catUse[c.id] === false || GStore.validGpc(Store.s.catMap[c.id]));
    const c = GStore.counts(list);
    const sent = s.firstMatchDone;
    const body = `<dl class="kv">
        <div class="kv__row"><dt>카테고리 설정</dt><dd>${done ? C().pill("설정완료", "solid-blue") : C().pill("미설정", "gray")} <button type="button" class="btn btn--line btn--sm" data-act="match">상품 카테고리 매칭</button></dd></div>
        <div class="kv__row kv__row--top"><dt>Merchant Center 연동 상품</dt><dd class="kv__wide">${C().statusBar(c, sent ? s.lastAuto : null)}</dd></div>
      </dl>`;
    const el = App.section("상품 피드", "", body);
    el.querySelector('[data-act="match"]').addEventListener("click", () => C().openCategoryMatch(false));
    return el;
  }

  /* ---------------- 4. Google Ads ---------------- */
  function adsSection() {
    const s = GStore.s;
    const st = GStore.adsState();
    let body;
    let actions = "";
    if (st === "none") {
      body = `<p class="sec__lead">Google Ads를 연결하면 광고 측정 상태와 캠페인·상품 광고 성과를 확인할 수 있습니다. Merchant Center가 없어도 연결할 수 있습니다.</p><button type="button" class="btn btn--primary btn--lg" data-act="ads-connect">Google Ads 연결하기</button>`;
    } else {
      const a = s.adsAccount || G().adsAccounts[0];
      body = `<dl class="kv">
        <div class="kv__row"><dt>광고 계정</dt><dd>${UI.esc(a.name)} (${a.id}) ${st === "reauth" ? C().pill("재인증 필요", "red") : C().pill("연결됨")}</dd><dd class="kv__link"><a class="ext" data-ext="Google Ads 바로가기" data-url="https://ads.google.com/aw/overview?ocid=${a.id.replace(/-/g, "")}">Google Ads 바로가기 ${UI.icon.ext}</a></dd></div>
        ${st === "reauth" ? `<div class="kv__row"><dt></dt><dd class="kv__wide"><p class="note note--warn">${UI.icon.info}<span>Google Ads 접근 권한을 확인할 수 없습니다. 다시 연결해 주세요. 상품 피드 전송은 계속됩니다.</span></p></dd></div>` : ""}
        <div class="kv__row"><dt>Merchant Center 연결</dt><dd>${s.mc !== "none" ? C().pill("연결됨") : C().pill("미연결", "gray") + ' <span class="muted">쇼핑 광고 성과는 Merchant Center 연결 후 확인할 수 있습니다.</span>'}</dd></div>
      </dl>`;
      actions = '<button type="button" class="btn btn--line btn--sm" data-act="ads-change">계정 변경</button><button type="button" class="btn btn--line btn--sm" data-act="ads-unlink">연결 해제</button>';
    }
    const el = App.section("Google Ads", actions, body);
    C().bindExt(el);
    const on = (k, fn) => { const b = el.querySelector(`[data-act="${k}"]`); if (b) b.addEventListener("click", fn); };
    on("ads-connect", openAdsWizard);
    on("ads-change", openAdsWizard);
    on("ads-unlink", async () => {
      if (!(await UI.confirm("Google Ads 연결만 해제합니다. Merchant Center와 상품 피드는 유지됩니다.\n연결을 해제하시겠습니까?"))) return;
      GStore.disconnectAds();
      App.render();
      UI.toast("Google Ads 연결이 해제되었습니다.", "success");
    });
    return el;
  }
  /** Google Ads 연결: 약관 동의 → 계정 선택 → 연동 설정 확인(10개 항목, 필수 3개) → 완료 */
  function openAdsWizard() {
    const steps = ["약관 동의", "계정 선택", "연동 설정 확인"];
    const CHECKS = [["계정 연결", true], ["광고 성과 조회 권한", true], ["연결 정보 저장", true], ["Google Tag 설치", false], ["향상된 전환 설정", false], ["전환 액션 확인", false], ["Merchant Center 연결 확인", false], ["결제 정보 확인", false], ["계정 상태 확인", false], ["자동 태그 추가", false]];
    let i = 0;
    let picked = G().adsAccounts[0];
    const m = UI.modal({ title: "Google Ads 연결", size: "md", body: '<div id="adw"></div>', footer: '<button type="button" class="btn btn--line btn--lg" data-act="prev">이전</button><button type="button" class="btn btn--dark btn--lg" data-act="next">다음</button>' });
    const box = m.el.querySelector("#adw");
    const next = m.el.querySelector('[data-act="next"]');
    function paint() {
      const stepper = `<ol class="wstep">${steps.map((x, k) => `<li class="${k === i ? "is-on" : k < i ? "is-done" : ""}">${k + 1}. ${x}</li>`).join("")}</ol>`;
      let h = "";
      if (i === 0) h = `<div class="consent-box is-open"><div class="consent-box__text">Google Ads 계정의 캠페인·성과 데이터를 메이크샵에서 조회하고, 쇼핑몰에 Google Tag를 설치합니다.</div></div><label class="chk"><input type="checkbox" id="ad-agree"/><span><em>(필수)</em>위 내용에 동의합니다.</span></label>`;
      if (i === 1) h = `<p class="sec__lead">연결할 Google Ads 계정을 선택하세요.</p>${G().adsAccounts.map((c, k) => `<label class="radio-card"><input type="radio" name="ad" value="${k}" ${c.id === picked.id ? "checked" : ""}/><span><b>${UI.esc(c.name)}</b><br><span class="muted">고객 ID ${c.id}</span></span></label>`).join("")}`;
      if (i === 2) h = `<p class="sec__lead">연동 설정을 확인하고 있습니다. 필수 3개 항목이 모두 완료되어야 연결됩니다.</p><ul class="checklist" id="ad-checks">${CHECKS.map((c) => `<li><span class="spin"></span>${c[0]}${c[1] ? ' <em class="req">필수</em>' : ""}<span class="muted">확인 중</span></li>`).join("")}</ul>`;
      box.innerHTML = stepper + h;
      m.el.querySelector('[data-act="prev"]').disabled = i === 0 || i === 2;
      next.textContent = i === 2 ? "연결 완료" : "다음";
      box.querySelectorAll('input[name="ad"]').forEach((r) => r.addEventListener("change", () => (picked = G().adsAccounts[+r.value])));
      if (i === 2) {
        next.disabled = true;
        box.querySelectorAll("#ad-checks li").forEach((li, k) =>
          setTimeout(() => {
            const opt = !CHECKS[k][1] && k % 3 === 1;
            li.querySelector(".spin").outerHTML = opt ? '<span class="warn">!</span>' : '<span class="ok">✓</span>';
            li.lastElementChild.textContent = opt ? "설정 필요" : "완료";
            if (k === CHECKS.length - 1) next.disabled = false;
          }, 180 * (k + 1))
        );
      }
    }
    m.el.querySelector('[data-act="prev"]').addEventListener("click", () => { if (i > 0) { i--; paint(); } });
    next.addEventListener("click", () => {
      if (i === 0 && !box.querySelector("#ad-agree").checked) return UI.alert("필수 항목에 동의해 주세요.");
      if (i < 2) { i++; paint(); return; }
      GStore.connectAds(picked);
      m.close(true);
      App.render();
      UI.toast("Google Ads가 연결되었습니다. '설정 필요' 항목은 오류가 아니며 구글애즈 탭에서 확인할 수 있습니다.", "success");
    });
    paint();
  }

  return { render, openAdsWizard, openMcWizard };
})();
