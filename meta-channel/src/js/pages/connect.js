/* ==========================================================================
   SCR 3-3 · 연결 관리 탭 (미연동 / 연동완료) + 3-3-2 상품 카테고리 매칭 모달
   ========================================================================== */
const ConnectPage = (function () {
  const A = () => window.MOCK.account;
  const AD = () => window.MOCK.adAccount;

  function render(root) {
    const s = Store.s;
    if (!s.connected) {
      root.appendChild(
        App.emptyState({
          title: "페이스북부터 인스타그램까지,<br>한 곳에서 간편하게 관리하세요.",
          desc: "한 번의 로그인으로 필요한 채널을 빠르고 안전하게 연동할 수 있습니다.",
          btn: "Facebook Business Extension 시작하기",
          fbIcon: true,
          note: "FBE(Facebook Business Extension)를 이용하면 Facebook 페이지 연결, 비즈니스 관리자 연결, 광고 계정, 픽셀, 카탈로그 등을 한 번에 설정할 수 있습니다.",
          onClick: App.startFbe,
        })
      );
      return;
    }
    root.appendChild(
      App.banner(
        "연결 관리",
        "Meta 비즈니스 기능 사용을 위해 필요한 계정을 연결하는 공간입니다. 페이스북 FBE(Facebook Business Extension) 로그인을 통해 Facebook 페이지, 광고 계정, 픽셀, 제품 카탈로그, Commerce Manager 등을<br>한 번에 연동할 수 있습니다. 연결 완료 후에는 상품 연동부터 광고 성과 측정 등 Meta 관련 기능을 메이크샵에서 통합 관리할 수 있으며, 현재 연결된 계정 및 권한 상태도 함께 확인할 수 있습니다."
      )
    );
    root.appendChild(assetSection());
    root.appendChild(feedSection());
    root.appendChild(adsSection());
    if (!s.domainVerified) root.appendChild(domainSection());
  }

  /* ---------------- 2. 비즈니스 자산 연동 정보 ---------------- */
  function assetSection() {
    const s = Store.s;
    const a = A();
    const bid = a.businessId;
    const fail = (key) => s.assetError === key;
    const failCell = `<span class="pill pill--red">확인불가</span><span class="row-hint">자산 조회에 실패했습니다(권한 부족·토큰 만료 등). [설정]에서 재연동해 주세요.</span>`;
    const rows = [
      ["페이스북 계정", `${UI.esc(a.fbEmail)} <span class="pill pill--blue">연결됨</span>`, null],
      ["비즈니스 관리자", UI.esc(a.businessManagerName), ["비즈니스 관리자 바로가기", `https://business.facebook.com/settings/info?business_id=${bid}`]],
      ["페이지", fail("page") ? failCell : UI.esc(a.pageName), fail("page") ? null : ["페이지 바로가기", `https://www.facebook.com/${a.pageId}`]],
      ["픽셀 정보", fail("pixel") ? failCell : `픽셀 ID : ${a.pixelId}`, fail("pixel") ? null : ["이벤트 관리자 바로가기", `https://business.facebook.com/events_manager2/list/pixel/${a.pixelId}/overview?business_id=${bid}`]],
      ["커머스 계정", UI.esc(s.commerceName), ["커머스 관리자 바로가기", `https://business.facebook.com/commerce_manager/?business_id=${bid}`]],
      ["인스타그램 계정", s.ig ? "@" + UI.esc(a.instagramUsername) : '<span class="pill pill--gray">미연결</span>', s.ig ? ["인스타그램 설정 바로가기", `https://business.facebook.com/settings/instagram-accounts?business_id=${bid}`] : null],
    ];
    const body = `<dl class="kv">${rows
      .map((r) => `<div class="kv__row"><dt>${r[0]}</dt><dd>${r[1]}</dd><dd class="kv__link">${r[2] ? `<a class="ext" data-ext="${r[2][0]}" data-url="${r[2][1]}">${r[2][0]} ${UI.icon.ext}</a>` : ""}</dd></div>`)
      .join("")}</dl>`;
    const el = App.section("비즈니스 자산 연동 정보", `<button type="button" class="btn btn--line btn--sm" data-act="unlink">연결 해제</button><button type="button" class="btn btn--line btn--sm" data-act="setting">${UI.icon.gear} 설정</button>`, body);
    bindExt(el);
    el.querySelector('[data-act="setting"]').addEventListener("click", () => App.openWizard(false));
    el.querySelector('[data-act="unlink"]').addEventListener("click", unlink);
    return el;
  }
  async function unlink() {
    const ok = await UI.confirm("연결을 해제하면 Meta 상품 피드 동기화, 광고 계정 조회 및 전환 추적 기능이 중단됩니다. 이미 Meta에 전달된 정보의 삭제는 Meta 정책에 따릅니다.\n연결을 해제하시겠습니까?");
    if (!ok) return;
    const r = Store.s.unlinkResult;
    if (r === "network") return UI.alert("연결 해제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    if (r === "auth") return UI.alert("연결 해제 권한이 만료되었습니다. 다시 로그인 후 시도해 주세요.");
    Store.disconnect();
    App.go("connect");
    UI.toast("Meta 비즈니스 연결이 해제되었습니다. 최초 연동 가이드 화면으로 전환됩니다.", "success");
  }

  /* ---------------- 3. 상품 피드 요약 ---------------- */
  function feedSection() {
    const s = Store.s;
    const matched = Object.keys(s.catMap).length;
    const active = s.categorySaved && matched > 0;
    const c = active ? Store.counts(s.products) : { 전체: 0, 활동중: 0, 검토중: 0, 미승인: 0, 노출제한: 0, 사용안함: 0, 미전송: 0 };
    const body = `
      <dl class="kv">
        <div class="kv__row"><dt>카테고리 설정</dt><dd>${active ? `<span class="pill pill--solid-blue">설정완료</span><span class="muted">매칭 ${matched} / ${Store.leafCategories().length}개 카테고리</span>` : "미설정"} <button type="button" class="btn btn--line btn--sm" data-act="match">상품 카테고리 매칭</button></dd></div>
        <div class="kv__row kv__row--top"><dt>카탈로그 연동 상품 ${UI.qmark("catalog")}</dt><dd class="kv__wide">${statusBar(c, active ? s.lastUpdate : null)}</dd></div>
      </dl>`;
    const el = App.section("상품 피드", "", body);
    el.querySelector('[data-act="match"]').addEventListener("click", () => openCategoryMatch(false));
    return el;
  }
  /** 상태별 요약 바 + 범례 (연결 관리·상품 피드 탭 공용) */
  function statusBar(c, lastUpdate, hideTotal) {
    const total = c.전체 || 0;
    const segs = Store.FEED_STATES.map((st) => (total && c[st] ? `<span class="sb sb--${st}" style="width:${(c[st] / total) * 100}%" title="${st} ${c[st]}개"></span>` : "")).join("");
    return `
      ${hideTotal ? "" : `<div class="sbar__top"><b>상품개수 : ${UI.fmt(total)}개</b>${lastUpdate ? `<span class="muted">최근 업데이트 ${lastUpdate}</span>` : ""}</div>`}
      <div class="sbar">${segs}</div>
      <ul class="legend">${Store.FEED_STATES.map((st) => `<li><i class="dot dot--${st}"></i>${st}(${c[st] || 0})</li>`).join("")}</ul>`;
  }

  /* ---------------- 4. 광고 관리 요약 ---------------- */
  function adsSection() {
    const a = A();
    const ad = AD();
    const actId = ad.id.replace(/^act_/, "");
    const body = `<dl class="kv"><div class="kv__row"><dt>광고 계정</dt><dd>${UI.esc(ad.name)}</dd><dd class="kv__link"><a class="ext" data-ext="광고 계정 바로가기" data-url="https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${actId}&business_id=${a.businessId}">광고 계정 바로가기 ${UI.icon.ext}</a></dd></div></dl>`;
    const el = App.section("광고 관리", `<button type="button" class="btn btn--line btn--sm" data-act="setting">${UI.icon.gear} 설정</button>`, body);
    bindExt(el);
    el.querySelector('[data-act="setting"]').addEventListener("click", () => App.openWizard(false));
    return el;
  }

  /* ---------------- 5. 도메인 인증 안내 (미인증 시에만) ---------------- */
  function domainSection() {
    const body = `
      <p class="sec__lead">Meta 광고의 전환 추적 및 웹 이벤트 구성을 위해 쇼핑몰 도메인 인증이 필요합니다.<br>도메인 인증은 Meta 비즈니스 관리자에서 직접 진행하며, 연동 전·후 언제든 진행할 수 있습니다.</p>
      <ol class="steps3">
        <li><b>Meta 비즈니스 관리자 접속</b><span>연동에 사용할 비즈니스 계정으로 로그인</span></li>
        <li><b>도메인 등록</b><span>비즈니스 설정 &gt; 브랜드 보안 &gt; 도메인 &gt; 추가</span></li>
        <li><b>소유권 인증</b><span>DNS TXT · 메타태그 · HTML 파일 중 택1로 인증</span></li>
      </ol>
      <p class="note">${UI.icon.info}<span>인증 결과가 Meta에 반영되기까지 최대 72시간이 소요될 수 있습니다.</span><a class="ext" data-ext="Meta 비즈니스 관리자 바로가기" data-url="https://business.facebook.com/settings/owned-domains">Meta 비즈니스 관리자 바로가기 ${UI.icon.ext}</a></p>`;
    const el = App.section("도메인 인증 안내", `<button type="button" class="btn btn--line btn--sm" data-ext="도메인 인증 도움말" data-url="https://www.facebook.com/business/help/321167023127050">자세히 보기</button>`, body);
    bindExt(el);
    return el;
  }

  function bindExt(el) {
    el.querySelectorAll("[data-ext]").forEach((x) => x.addEventListener("click", () => UI.openExternal(x.dataset.ext, x.dataset.url)));
  }

  /* ---------------- 3-3-2 상품 카테고리 매칭 모달 (카테고리 단위) ---------------- */
  function openCategoryMatch(auto) {
    const s = Store.s;
    const items = window.MOCK.gpcList.map((g) => ({ value: g.id, label: g.path }));
    const cats = Store.leafCategories();
    const body = `
      <div class="infobox">${UI.icon.info}<div>내 쇼핑몰의 상품 분류와 가장 유사한 Meta 상품 카테고리를 선택해주세요.<br>카테고리 매칭 후 상품은 미전송 상태로 저장되며, 상품 피드 &gt; 미전송 탭에서 전송할 상품을 선택하여 Meta로 전송할 수 있습니다.</div></div>
      <div class="mtable-wrap"><table class="mtable">
        <thead><tr><th>쇼핑몰 카테고리</th><th>페이스북 카테고리</th></tr></thead>
        <tbody>${cats.map((c) => `<tr><td>${UI.esc(c.path.join(" > "))}${!s.catMap[c.id] && c.googleGpc ? '<span class="tag-gray">Google 채널 설정값</span>' : ""}</td><td><div class="gpc-dd" data-cat="${c.id}"></div></td></tr>`).join("")}</tbody>
      </table></div>
      <ul class="bullets muted">
        <li>판매불가능으로 설정된 상품은 Meta 전송 대상에 포함되지 않으니 판매 상태를 확인해주세요.</li>
        <li>Meta 카테고리 연결을 해제하거나 연결된 카테고리를 삭제할 경우 상품 연동이 해제될 수 있으니 유의해주세요.</li>
      </ul>`;
    const dds = {};
    const confirmClose = () => UI.confirm("카테고리를 매칭하지 않은 상품은 피드에서 제외되어 Meta에 노출되지 않습니다.\n다음에 반영하시겠습니까?");
    const m = UI.modal({
      title: "상품 카테고리 매칭",
      size: "lg",
      body,
      footer: '<button type="button" class="btn btn--line btn--lg" data-act="later">다음에 반영</button><button type="button" class="btn btn--dark btn--lg" data-act="save">저장</button>',
      onClose: confirmClose,
    });
    m.el.querySelectorAll(".gpc-dd").forEach((d) => {
      const c = Store.cat(d.dataset.cat);
      dds[c.id] = UI.dropdown(d, { items, value: s.catMap[c.id] || c.googleGpc || "", placeholder: "카테고리를 선택해주세요", minListWidth: 420 });
    });
    m.el.querySelector('[data-act="later"]').addEventListener("click", () => m.close());
    m.el.querySelector('[data-act="save"]').addEventListener("click", async () => {
      const map = {};
      Object.keys(dds).forEach((k) => (map[k] = dds[k].value || null));
      Store.saveCategoryMap(map);
      await UI.alert("상품 카테고리 매칭이 저장되었습니다.");
      m.close(true);
      App.render();
    });
    if (auto) m.el.classList.add("is-auto");
  }

  return { render, openCategoryMatch, statusBar, bindExt };
})();
