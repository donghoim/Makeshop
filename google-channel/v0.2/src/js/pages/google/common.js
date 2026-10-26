/* ==========================================================================
   Google 탭 공통 — 표시 헬퍼, Google 계정 연동, 카테고리 매칭 모달(SCR-GOOGLE-FEED-002)
   - 디자인은 Meta 채널 화면 기준(카드·섹션·표·버튼·팝업·상태 배지)을 그대로 쓴다 (POL-032)
   ========================================================================== */
const GCommon = (function () {
  const G = () => window.GMOCK;
  const PALETTE = ["#d9c3a5", "#9fb4c7", "#c7a0a0", "#a3b18a", "#b8a1c9", "#e0b77c", "#8fa3a8", "#c9b79c"];
  const GENDERS = [["male", "남성"], ["female", "여성"], ["unisex", "남녀공용"]];
  const AGES = [["adult", "청소년·성인"], ["kids", "아동"], ["toddler", "유아"], ["infant", "영아"], ["newborn", "신생아"]];

  function thumb(p, sm) {
    if (p.r && p.r.noImage) return `<span class="thumb thumb--none">No<br>Image</span>`;
    const c = PALETTE[p.id % PALETTE.length];
    const ch = UI.esc(p.name.replace(/^\[[^\]]*\]\s*/, "").charAt(0));
    return `<span class="thumb" style="background:linear-gradient(135deg, ${c}, #fff)">${ch}</span>`;
  }
  const catPath = (p) => (p.cat ? UI.esc(Store.catPath(p.cat)) : '<span class="muted">분류 미지정</span>');
  function gpcLabel(id) {
    const g = GStore.validGpc(id) ? Store.gpc(id) : null;
    return g ? g.path : null;
  }
  function gpcCell(p) {
    const l = gpcLabel(Store.effGpc(p));
    return l ? `<span class="ellipsis" title="${UI.esc(l)}">${UI.esc(l)}</span>` : "-";
  }
  const stTag = (st) => `<span class="st st--${st}">${st}</span>`;
  const skuCount = (p) => Math.max(1, p.options); // 연동 상품 수 = 조합 옵션(SKU) 수
  function priceText(p) {
    if (p.r && p.r.priceText) return '<span class="muted">가격문의</span>';
    return UI.fmt(p.price) + "원";
  }
  function reason(p) {
    const st = GStore.status(p);
    if (st === "노출제한") {
      const r = G().restrictReasons[GStore.restriction(p)];
      return { title: r.label, guide: r.guide };
    }
    if (st === "미승인") {
      const i = G().issueGroups[GStore.gp(p).issue] || G().issueGroups.other;
      return { title: i.group, guide: i.description, detail: i.detail };
    }
    return null;
  }
  function statusBar(c, lastUpdate, hideTotal) {
    const total = GStore.STATES.reduce((s, st) => s + (c[st] || 0), 0);
    const segs = GStore.STATES.map((st) => (total && c[st] ? `<span class="sb sb--${st}" style="width:${(c[st] / total) * 100}%" title="${st} ${c[st]}개"></span>` : "")).join("");
    return `
      ${hideTotal ? "" : `<div class="sbar__top"><b>상품개수 : ${UI.fmt(total)}개</b><span class="muted">최근 업데이트 ${lastUpdate || "-"}</span></div>`}
      <div class="sbar">${segs}</div>
      <ul class="legend">${GStore.STATES.map((st) => `<li><i class="dot dot--${st}"></i>${st}(${c[st] || 0})</li>`).join("")}</ul>`;
  }
  const pill = (txt, kind) => `<span class="pill pill--${kind || "blue"}">${txt}</span>`;
  function bindExt(el) {
    el.querySelectorAll("[data-ext]").forEach((x) => x.addEventListener("click", () => UI.openExternal(x.dataset.ext, x.dataset.url)));
  }
  const gLogoBig = () => UI.icon.google.replace('width="44" height="44"', 'width="80" height="80"');

  /* ---------------- Google 계정 연동 (개인정보 동의 → Google 로그인·권한 동의) ---------------- */
  function startAccount(onDone) {
    const body = `
      <div class="consent">
        <p class="consent__intro">Google 채널 이용을 위해 아래와 같이 정보가 Google에 제공되며, 메이크샵이 연동 관리를 위해 일부 정보를 수집합니다.</p>
        <div class="consent-box is-open"><div class="consent-box__head"><span>개인정보 및 쇼핑몰 정보 제3자 제공 동의(필수)</span></div>
          <div class="consent-box__text">제공받는 자: Google LLC<br>제공 목적: Merchant Center 상품 피드 등록, Google Ads 광고 성과 조회 및 전환 측정<br>제공 항목: 쇼핑몰 도메인, 상품 정보, 사업장 주소, 대표 전화번호(Merchant Center 연동 시)<br>국외 이전: 미국(Google LLC), 연동 시 정보통신망을 통해 수시 전송</div></div>
        <div class="consent-box"><div class="consent-box__head"><span>개인정보 수집·이용 동의 (메이크샵)</span></div>
          <div class="consent-box__text">수집 항목: Google 계정 이메일, 인증 정보, Merchant Center 계정 ID, Google Ads 고객 ID<br>보유 기간: 연결 해제 시까지</div></div>
        <label class="chk"><input type="checkbox" id="g-agree1" /><span><em>(필수)</em>위 제3자 제공 및 국외 이전에 동의합니다.</span></label>
        <label class="chk"><input type="checkbox" id="g-agree2" /><span><em>(필수)</em>위 개인정보 수집 및 이용에 동의합니다.</span></label>
      </div>`;
    const m = UI.modal({ title: "Google 채널 개인정보 수집 및 이용 동의", size: "md", body, footer: '<button class="btn btn--dark btn--lg" data-act="ok" type="button">확인</button>' });
    m.el.querySelector('[data-act="ok"]').addEventListener("click", async () => {
      if (!(m.el.querySelector("#g-agree1").checked && m.el.querySelector("#g-agree2").checked)) return UI.alert("필수 동의 항목에 모두 동의해 주세요.");
      m.close(true);
      googleLogin(onDone);
    });
  }
  function googleLogin(onDone) {
    const a = G().account;
    const body = `
      <div class="glogin">
        <div class="glogin__logo">${UI.icon.google}</div>
        <h3>계정 선택</h3><p class="muted">makeshop.co.kr(으)로 이동</p>
        <button type="button" class="glogin__acct" data-act="pick"><span class="glogin__av">${a.name.charAt(0)}</span><span><b>${UI.esc(a.name)}</b><br><span class="muted">${UI.esc(a.email)}</span></span></button>
        <div class="glogin__scopes is-hidden">
          <h4>메이크샵에서 다음 권한을 요청합니다</h4>
          <label class="chk"><input type="checkbox" checked /> Merchant Center 상품 데이터 관리</label>
          <label class="chk"><input type="checkbox" checked /> Google Ads 계정 데이터 조회</label>
          <label class="chk"><input type="checkbox" checked /> 사이트 소유권 확인(Search Console)</label>
        </div>
      </div>`;
    const m = UI.modal({
      title: "Google 로그인 (시뮬레이션)",
      size: "sm",
      body,
      footer: '<button class="btn btn--line btn--lg" data-act="cancel" type="button">취소</button><button class="btn btn--primary btn--lg" data-act="allow" type="button" disabled>허용</button>',
      onClose: () => { UI.toast("Google 계정 연동이 완료되지 않았습니다. 연동 정보는 저장되지 않습니다.", "warn"); return true; },
    });
    m.el.querySelector('[data-act="pick"]').addEventListener("click", () => {
      m.el.querySelector(".glogin__scopes").classList.remove("is-hidden");
      m.el.querySelector('[data-act="allow"]').disabled = false;
    });
    m.el.querySelector('[data-act="cancel"]').addEventListener("click", () => m.close());
    m.el.querySelector('[data-act="allow"]').addEventListener("click", () => {
      GStore.connectAccount();
      m.close(true);
      UI.toast("Google 계정이 연결되었습니다. Merchant Center와 Google Ads를 각각 연결할 수 있습니다.", "success");
      onDone && onDone();
    });
  }

  /* ---------------- 카테고리 매칭 모달 (SCR-GOOGLE-FEED-002) ---------------- */
  function openCategoryMatch(auto) {
    const s = GStore.s;
    if (auto) { s.autoMatchShown = true; GStore.save(); }
    const items = window.MOCK.gpcList.map((g) => ({ value: g.id, label: g.path }));
    const cats = Store.leafCategories();
    const SIZE = 8;
    // 모달 안 입력값 (페이지를 이동해도 유지, [상품 피드 반영] 전에는 저장하지 않음)
    const draft = {};
    cats.forEach((c) => {
      const cur = Store.s.catMap[c.id] || "";
      draft[c.id] = { use: s.catUse[c.id] !== false, gpc: GStore.validGpc(cur) ? cur : "" };
    });
    let page = 1;
    const body = `
      <div class="infobox">${UI.icon.info}<div>
        · 메이크샵 카테고리를 Google 상품 카테고리(GPC)에 연결합니다. 매칭한 카테고리의 상품만 Google로 전송합니다.<br>
        · Google 상품 카테고리는 Meta와 공통으로 사용합니다. Meta에서 설정한 카테고리는 선택되어 있고, 여기서 바꾸면 Meta에도 같이 적용됩니다.<br>
        · 카테고리를 선택하지 않은 상품은 노출제한(카테고리 미매칭)으로 표시되며 전송하지 않습니다.<br>
        · 사용여부를 끄면 해당 카테고리 상품은 사용안함으로 처리합니다.</div></div>
      <div class="mtable-wrap"><table class="mtable">
        <thead><tr><th style="width:90px">사용여부</th><th>쇼핑몰 카테고리</th><th style="width:110px">연동 상품 수</th><th style="width:380px">Google 카테고리</th></tr></thead>
        <tbody id="gcm-body"></tbody></table></div>
      <div id="gcm-pager" class="gcm-pager"></div>`;
    const unmatched = () => cats.some((c) => draft[c.id].use && !draft[c.id].gpc);
    const m = UI.modal({
      title: "Google 상품 카테고리 매칭",
      size: "lg",
      body,
      footer: '<button type="button" class="btn btn--line btn--lg" data-act="later">다음에 반영</button><button type="button" class="btn btn--dark btn--lg" data-act="save">상품 피드 반영</button>',
      onClose: async () => {
        if (unmatched() && !(await UI.confirm("카테고리를 매칭하지 않은 상품은 피드에서 제외되어 Google에 노출되지 않습니다.\n다음에 반영하시겠습니까?"))) return false;
        // 최초 매칭을 닫으면 이미 공통 GPC가 있는 카테고리 상품은 전송 대상 (POL-064)
        if (!GStore.s.firstMatchDone) { GStore.saveCategoryMatch([]); setTimeout(() => App.render(), 0); }
        return true;
      },
    });
    function paint() {
      const rows = cats.slice((page - 1) * SIZE, page * SIZE);
      const tb = m.el.querySelector("#gcm-body");
      tb.innerHTML = rows
        .map((c) => {
          const n = GStore.products().filter((p) => p.cat === c.id).length;
          return `<tr data-cat="${c.id}"><td><label class="switch"><input type="checkbox" class="gcm-use" ${draft[c.id].use ? "checked" : ""} aria-label="사용여부"/><i></i></label></td><td class="td-left">${UI.esc(c.path.join(" > "))}</td><td>${n}</td><td><div class="gpc-dd"></div></td></tr>`;
        })
        .join("");
      tb.querySelectorAll("tr").forEach((tr) => {
        const id = tr.dataset.cat;
        const dd = UI.dropdown(tr.querySelector(".gpc-dd"), { items, value: draft[id].gpc, placeholder: "카테고리를 선택해주세요", minListWidth: 420, disabled: !draft[id].use, onChange: (v) => (draft[id].gpc = v) });
        tr.querySelector(".gcm-use").addEventListener("change", (e) => { draft[id].use = e.target.checked; dd.setDisabled(!e.target.checked); });
      });
      const pg = m.el.querySelector("#gcm-pager");
      pg.innerHTML = "";
      pg.appendChild(UI.pagination(cats.length, page, SIZE, (p) => { page = p; paint(); }));
    }
    paint();
    m.el.querySelector('[data-act="later"]').addEventListener("click", () => m.close());
    m.el.querySelector('[data-act="save"]').addEventListener("click", async () => {
      GStore.saveCategoryMatch(cats.map((c) => ({ cat: c.id, use: draft[c.id].use, gpc: draft[c.id].gpc || null })));
      await UI.alert("선택한 카테고리가 상품 피드에 반영되었습니다.");
      m.close(true);
      App.render();
    });
  }

  return { GENDERS, AGES, thumb, catPath, gpcLabel, gpcCell, stTag, skuCount, priceText, reason, statusBar, pill, bindExt, gLogoBig, startAccount, openCategoryMatch };
})();
