/* ==========================================================================
   SCR-GOOGLE-FEED-001 · Google 상품피드 (+ FEED-003 상품 상세, FEED-004 선택 수정, 동기화 이력)
   - 메이크샵이 Merchant Center에 전송한 상품만 관리한다 (POL-062)
   ========================================================================== */
const GFeed = (function () {
  const C = () => GCommon;
  const G = () => window.GMOCK;
  const TABS = ["전체", "활동중", "검토중", "미승인", "노출제한", "사용안함", "반영대기"];
  const SIZES = [10, 20, 50, 100];
  const view = { tab: "전체", q: "", page: 1, size: 10, sel: new Set() };

  function render(root, params) {
    const s = GStore.s;
    if (params && params.tab && TABS.includes(params.tab)) { view.tab = params.tab; view.page = 1; view.sel.clear(); }
    root.appendChild(App.banner("상품피드", "메이크샵 상품을 Merchant Center로 보내고 상품별 상태와 전송 결과를 확인하는 공간입니다.<br>카테고리를 매칭한 상품을 자동으로 전송하고, 상품 수정 내용도 자동으로 반영합니다."));
    if (GStore.queueBlocked()) {
      const n = document.createElement("p");
      n.className = "note note--warn";
      n.innerHTML = `${UI.icon.info}<span>재인증이 필요해 상품 피드 전송이 멈춰 있습니다. 연결관리에서 다시 연결하면 전송을 이어갑니다.</span><a class="lnk" href="#/google/connect">연결관리로 이동</a>`;
      root.appendChild(n);
    }
    root.appendChild(operationSection());
    const c = GStore.counts(GStore.products());
    const reg = App.section("상품 피드 등록 현황", `<button type="button" class="btn btn--line btn--sm" data-ext="Merchant Center 바로가기" data-url="https://merchants.google.com/mc/products/diagnostics?a=${(s.mcAccount || G().merchantCandidates[0]).id}">Merchant Center 바로가기</button>`, C().statusBar(c, null, true) + (!s.firstMatchDone ? `<p class="note note--warn">${UI.icon.info}<span>상품 카테고리 매칭 전입니다. 연결관리 &gt; 상품 카테고리 매칭에서 [상품 피드 반영]을 누르면 매칭된 상품이 반영대기로 등록되어 자동 전송됩니다.</span></p>` : ""));
    C().bindExt(reg);
    root.appendChild(reg);
    root.appendChild(programSection(c));
    const listSec = App.section("상품 피드", "", '<div id="gfeed-list"></div>', { cls: "sec--list" });
    root.appendChild(listSec);
    paintList(listSec.querySelector("#gfeed-list"));
  }

  /* ---------------- 1. 운영 현황 ---------------- */
  function operationSection() {
    const s = GStore.s;
    const q = GStore.queueSize();
    const failN = s.lastResult === "일부 실패" ? 3 : 0;
    const resultPill = { 성공: "blue", "일부 실패": "red", 실패: "red", "진행 중": "line" }[s.lastResult];
    const items = [
      ["최근 전체 동기화", s.lastFull || "-"],
      ["최근 자동 동기화", s.lastAuto || "-"],
      ["최근 동기화 결과", s.lastResult ? C().pill(s.lastResult, resultPill) : "-"],
      ["반영대기 상품 수", UI.fmt(q)],
      ["전송 실패 상품 수", UI.fmt(failN)],
    ];
    const body = `<div class="opgrid">${items.map((x) => `<div class="opgrid__item"><span class="opgrid__label">${x[0]}</span><span class="opgrid__val">${x[1]}</span></div>`).join("")}</div>`;
    const busy = q > 0 && s.syncing;
    const el = App.section("운영 현황", `<button type="button" class="btn btn--line btn--sm" data-act="hist">동기화 이력</button><button type="button" class="btn btn--line btn--sm" data-act="resync" ${busy ? "disabled title=\"큐에 전송 중인 상품이 있습니다.\"" : ""}>다시 동기화</button>`, body);
    el.querySelector('[data-act="hist"]').addEventListener("click", openHistory);
    el.querySelector('[data-act="resync"]').addEventListener("click", async () => {
      if (!(await UI.confirm("전송 조건을 충족한 전체 상품을 다시 전송합니다.\n다시 동기화하시겠습니까?"))) return;
      GStore.fullSync();
      App.render();
      UI.toast("전체 동기화를 시작했습니다. 전송 대상 상품이 반영대기로 등록되었습니다.", "info");
    });
    return el;
  }

  /* ---------------- 3. 프로그램별 피드 (aggregateProductStatuses, POL-075) ---------------- */
  function programSection(c) {
    const extraDisapproved = GStore.products().filter((p) => GStore.status(p) === "활동중" && p.id % 17 === 0).length;
    const rows = [
      ["무료 리스팅", c.활동중, c.검토중, c.미승인],
      ["쇼핑 광고", c.활동중 - extraDisapproved, c.검토중, c.미승인 + extraDisapproved],
    ];
    const body = `<div class="table-wrap"><table class="table table--compact"><thead><tr><th class="th-left">프로그램</th><th>전체</th><th>정상</th><th>검토중</th><th>미승인</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="td-left">${r[0]}</td><td>${UI.fmt(r[1] + r[2] + r[3])}</td><td>${UI.fmt(r[1])}</td><td>${UI.fmt(r[2])}</td><td>${UI.fmt(r[3])}</td></tr>`).join("")}</tbody></table></div>
      <p class="note">${UI.icon.info}<span>Merchant Center의 프로그램별 집계(대한민국 기준)입니다. 두 프로그램의 상품 수는 더하지 않습니다.</span></p>`;
    return App.section("프로그램별 피드", "", body);
  }

  /* ---------------- 4. 상품 피드 목록 ---------------- */
  function paintList(box) {
    const q = view.q.trim().toLowerCase();
    const base = GStore.products().filter((p) => !q || p.name.toLowerCase().includes(q));
    const c = GStore.counts(base);
    const rows = view.tab === "전체" ? base : base.filter((p) => GStore.status(p) === view.tab);
    const pages = Math.max(1, Math.ceil(rows.length / view.size));
    if (view.page > pages) view.page = pages;
    const pageRows = rows.slice((view.page - 1) * view.size, view.page * view.size);
    const cols = columnsFor(view.tab);
    box.innerHTML = `
      <div class="list-tools">
        <div class="stabs" role="tablist">${TABS.map((t) => `<button type="button" role="tab" class="stab ${t === view.tab ? "is-active" : ""}" data-tab="${t}">${t} <b>${c[t]}</b></button>`).join("")}</div>
        <div class="list-tools__right">
          <form class="search" id="gfeed-search"><button type="submit" aria-label="검색">${UI.icon.search}</button><input type="search" placeholder="상품명으로 검색" value="${UI.esc(view.q)}" aria-label="상품명 검색" /></form>
          <select class="select" id="gfeed-size" aria-label="페이지당 노출 개수">${SIZES.map((n) => `<option value="${n}" ${n === view.size ? "selected" : ""}>${n}개씩</option>`).join("")}</select>
        </div>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>${cols.map((k) => `<th class="col-${k}">${head(k)}</th>`).join("")}</tr></thead>
        <tbody>${pageRows.length ? pageRows.map((p) => `<tr>${cols.map((k) => `<td class="col-${k}">${cell(k, p)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="table__empty">${view.q ? "검색 결과가 없습니다." : "표시할 상품이 없습니다."}</td></tr>`}</tbody>
      </table></div>
      <div class="list-foot"><div class="list-foot__left"><button type="button" class="btn btn--line" data-act="bulk">선택 수정</button>${view.tab === "반영대기" ? '<span class="muted small">반영대기 상품은 전송 큐에서 순서대로 자동 전송됩니다. 직접 전송하는 기능은 없습니다.</span>' : ""}</div><div id="gfeed-pager"></div><div class="list-foot__right muted small">총 ${UI.fmt(rows.length)}건 · 선택 ${view.sel.size}건</div></div>`;
    box.querySelector("#gfeed-pager").appendChild(UI.pagination(rows.length, view.page, view.size, (p) => { view.page = p; view.sel.clear(); paintList(box); }));
    box.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { view.tab = b.dataset.tab; view.page = 1; view.sel.clear(); paintList(box); }));
    box.querySelector("#gfeed-search").addEventListener("submit", (e) => { e.preventDefault(); view.q = e.target.querySelector("input").value; view.page = 1; view.sel.clear(); paintList(box); });
    box.querySelector("#gfeed-size").addEventListener("change", (e) => { view.size = +e.target.value; view.page = 1; view.sel.clear(); paintList(box); });
    const all = box.querySelector("#gchk-all");
    const chks = [...box.querySelectorAll(".row-chk")];
    const foot = () => (box.querySelector(".list-foot__right").textContent = `총 ${UI.fmt(rows.length)}건 · 선택 ${view.sel.size}건`);
    all.checked = chks.length > 0 && chks.every((x) => x.checked);
    all.addEventListener("change", () => { chks.forEach((x) => { x.checked = all.checked; all.checked ? view.sel.add(+x.value) : view.sel.delete(+x.value); }); foot(); });
    chks.forEach((x) => x.addEventListener("change", () => { x.checked ? view.sel.add(+x.value) : view.sel.delete(+x.value); all.checked = chks.every((y) => y.checked); foot(); }));
    box.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openDetail(+b.dataset.detail)));
    box.querySelector('[data-act="bulk"]').addEventListener("click", () => {
      const ids = pageRows.filter((p) => view.sel.has(p.id)).map((p) => p.id);
      if (!ids.length) return UI.alert("선택된 상품이 없습니다.");
      openBulk(ids);
    });
  }
  function columnsFor(tab) {
    if (tab === "전체") return ["chk", "info", "price", "sku", "status", "gpc", "manage"];
    if (tab === "미승인" || tab === "노출제한") return ["chk", "info", "price", "sku", "gpc", "reason", "manage"];
    if (tab === "사용안함") return ["chk", "info", "price", "sku", "manage"];
    return ["chk", "info", "price", "sku", "gpc", "manage"];
  }
  function head(k) {
    return {
      chk: '<input type="checkbox" id="gchk-all" aria-label="현재 페이지 전체 선택" />',
      info: "상품정보",
      price: "가격",
      sku: "연동 상품 수",
      status: "상태",
      gpc: "Google 상품 카테고리",
      reason: view.tab === "미승인" ? "미승인 사유" : "노출제한 사유",
      manage: "관리",
    }[k];
  }
  function cell(k, p) {
    switch (k) {
      case "chk": return `<input type="checkbox" class="row-chk" value="${p.id}" ${view.sel.has(p.id) ? "checked" : ""} aria-label="${UI.esc(p.name)} 선택" />`;
      case "info": return `<div class="pinfo">${C().thumb(p)}<div><div class="pinfo__name">${UI.esc(p.name)}</div><div class="pinfo__cat">${C().catPath(p)}</div></div></div>`;
      case "price": return C().priceText(p);
      case "sku": return UI.fmt(C().skuCount(p));
      case "status": return C().stTag(GStore.status(p));
      case "gpc": return C().gpcCell(p);
      case "reason": { const r = C().reason(p); return r ? `<b class="reason__t">${UI.esc(r.title)}</b><div class="muted small">${UI.esc(r.guide)}</div>` : "-"; }
      case "manage": return `<button type="button" class="btn btn--line btn--sm" data-detail="${p.id}">상세</button>`;
    }
  }

  /* ---------------- FEED-003 상품 상세 설정 ---------------- */
  function openDetail(id) {
    const p = GStore.products().find((x) => x.id === id);
    const g = GStore.gp(p);
    const st = GStore.status(p);
    const r = C().reason(p);
    const items = window.MOCK.gpcList.map((x) => ({ value: x.id, label: x.path }));
    const cur = { use: GStore.effUse(p), gpc: GStore.validGpc(Store.effGpc(p)) ? Store.effGpc(p) : "", gender: g.gender || "", age: g.age || "" };
    const rr = p.r || {};
    const body = `
      <h4 class="mh">상품 기본정보</h4>
      <div class="pbasic">${C().thumb(p)}<dl class="kv kv--tight">
        <div class="kv__row"><dt>상품코드</dt><dd>P${String(p.no).padStart(8, "0")}</dd></div>
        <div class="kv__row"><dt>카테고리</dt><dd>${C().catPath(p)}</dd></div>
        <div class="kv__row"><dt>상품명</dt><dd>${UI.esc(p.name)}</dd></div>
        <div class="kv__row"><dt>판매가</dt><dd>${C().priceText(p)}</dd></div>
        <div class="kv__row"><dt>진열상태</dt><dd>${rr.display ? "진열 안 함" : "진열함"}</dd></div>
        <div class="kv__row"><dt>판매상태</dt><dd>${rr.sale ? "판매 안 함" : rr.soldout ? "품절" : "판매함"}</dd></div>
      </dl></div>
      <div class="pbasic__foot"><span class="muted small">상품 정보는 여기서 수정할 수 없습니다.</span><button type="button" class="btn btn--line btn--sm" data-act="edit">상품 상세 관리</button></div>
      <h4 class="mh">Google 피드 상태</h4>
      <div class="graybox gstate">${C().stTag(st)} <span class="tag-gray">판정: ${GStore.judge(st)}</span>
        <ul><li>최근 연동일시 ${g.status ? GStore.s.lastAuto || "-" : "-"}</li>${r ? `<li>사유 <b>${UI.esc(r.title)}</b> — ${UI.esc(r.guide)}</li>` : ""}${r && r.detail ? `<li class="muted">Google 안내: ${UI.esc(r.detail)}</li>` : ""}</ul></div>
      <h4 class="mh">카테고리 매칭</h4>
      <table class="mtable"><thead><tr><th style="width:90px">사용여부</th><th>Google 상품 카테고리</th><th style="width:140px">성별</th><th style="width:150px">연령대</th></tr></thead>
        <tbody><tr><td><label class="switch"><input type="checkbox" class="d-use" ${cur.use ? "checked" : ""}/><i></i></label></td><td><div class="d-gpc"></div></td><td>${sel("d-gender", C().GENDERS)}</td><td>${sel("d-age", C().AGES)}</td></tr></tbody></table>
      <p class="note">${UI.icon.info}<span>Google 상품 카테고리는 Meta와 공통값입니다. 여기서 바꾸면 Meta에도 같이 적용되고 두 채널 모두 다시 판정합니다. 성별·연령대는 의류 및 액세서리 카테고리에서만 입력합니다.</span></p>`;
    const m = UI.modal({ title: "상품 상세 설정", size: "lg", body, footer: '<button type="button" class="btn btn--line btn--lg" data-act="cancel">취소</button><button type="button" class="btn btn--dark btn--lg" data-act="save">상품 피드 반영</button>' });
    const gs = m.el.querySelector(".d-gender");
    const as = m.el.querySelector(".d-age");
    const dd = UI.dropdown(m.el.querySelector(".d-gpc"), { items, value: cur.gpc, placeholder: "카테고리를 선택해주세요", minListWidth: 420, onChange: (v) => { cur.gpc = v; sync(); } });
    function sync() {
      const ap = Store.isApparel(cur.gpc);
      dd.setDisabled(!cur.use);
      gs.disabled = as.disabled = !(cur.use && ap);
      if (!ap) { gs.innerHTML = '<option value="">해당없음</option>'; as.innerHTML = '<option value="">해당없음</option>'; }
      else { restoreOpts(gs, C().GENDERS, cur.gender); restoreOpts(as, C().AGES, cur.age); }
    }
    m.el.querySelector(".d-use").addEventListener("change", (e) => { cur.use = e.target.checked; sync(); });
    gs.addEventListener("change", () => (cur.gender = gs.value));
    as.addEventListener("change", () => (cur.age = as.value));
    sync();
    m.el.querySelector('[data-act="edit"]').addEventListener("click", () => UI.toast("메이크샵 상품 상세 관리 화면이 새 창으로 열립니다. (프로토타입 미연결)", "info"));
    m.el.querySelector('[data-act="cancel"]').addEventListener("click", () => m.close(true));
    m.el.querySelector('[data-act="save"]').addEventListener("click", async () => {
      if (cur.use && !cur.gpc) return UI.alert("상품 피드를 사용하려면 Google 상품 카테고리를 선택해 주세요.");
      GStore.saveProducts([{ id, use: cur.use, gpc: cur.gpc || null, gender: Store.isApparel(cur.gpc) ? cur.gender : null, age: Store.isApparel(cur.gpc) ? cur.age : null }]);
      await UI.alert("선택한 상품이 상품 피드에 반영되었습니다.");
      m.close(true);
      App.render();
    });
  }
  function sel(cls, opts) {
    return `<select class="select select--sm ${cls}" aria-label="${cls}"><option value="">선택</option>${opts.map((o) => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
  }
  function restoreOpts(selEl, opts, val) {
    selEl.innerHTML = `<option value="">선택</option>${opts.map((o) => `<option value="${o[0]}">${o[1]}</option>`).join("")}`;
    selEl.value = val || "";
  }

  /* ---------------- FEED-004 선택 상품 카테고리 매칭 ---------------- */
  function openBulk(ids) {
    const items = window.MOCK.gpcList.map((x) => ({ value: x.id, label: x.path }));
    const rows = ids.map((id) => {
      const p = GStore.products().find((x) => x.id === id);
      const g = GStore.gp(p);
      return { p, cur: { use: GStore.effUse(p), gpc: GStore.validGpc(Store.effGpc(p)) ? Store.effGpc(p) : "", gender: g.gender || "", age: g.age || "" } };
    });
    const body = `
      <div class="infobox">${UI.icon.info}<div>· 선택한 상품 ${rows.length}건의 Google 상품 카테고리·사용여부·성별·연령대를 수정합니다.<br>· [적용]은 아래 목록의 입력값만 바꾸고, [상품 피드 반영]을 눌러야 저장과 전송이 이루어집니다.</div></div>
      <div class="bulkbar"><b>일괄 변경</b>
        <select class="select select--sm" id="b-use"><option value="">사용여부</option><option value="on">사용</option><option value="off">사용안함</option></select>
        ${sel("b-gender", C().GENDERS).replace('<option value="">선택</option>', '<option value="">성별</option>')}
        ${sel("b-age", C().AGES).replace('<option value="">선택</option>', '<option value="">연령대</option>')}
        <button type="button" class="btn btn--line btn--sm" data-act="apply">적용</button></div>
      <div class="mtable-wrap mtable-wrap--wide"><table class="mtable mtable--prod">
        <thead><tr><th>사용여부</th><th>상태</th><th>상품정보</th><th>쇼핑몰 카테고리</th><th>Google 상품 카테고리</th><th>성별</th><th>연령대</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr data-i="${i}"><td><label class="switch"><input type="checkbox" class="m-use"/><i></i></label></td><td>${C().stTag(GStore.status(r.p))}</td><td><div class="pinfo pinfo--sm">${C().thumb(r.p)}<div class="pinfo__name">${UI.esc(r.p.name)}</div></div></td><td>${C().catPath(r.p)}</td><td><div class="m-gpc"></div></td><td>${sel("m-gender", C().GENDERS)}</td><td>${sel("m-age", C().AGES)}</td></tr>`).join("")}</tbody></table></div>`;
    const m = UI.modal({ title: "선택 상품 카테고리 매칭", size: "xl", body, footer: '<button type="button" class="btn btn--line btn--lg" data-act="cancel">취소</button><button type="button" class="btn btn--dark btn--lg" data-act="save">상품 피드 반영</button>' });
    const syncs = [];
    m.el.querySelectorAll("tbody tr").forEach((tr) => {
      const r = rows[+tr.dataset.i];
      const use = tr.querySelector(".m-use");
      const gs = tr.querySelector(".m-gender");
      const as = tr.querySelector(".m-age");
      const dd = UI.dropdown(tr.querySelector(".m-gpc"), { items, value: r.cur.gpc, placeholder: "카테고리를 선택해주세요", minListWidth: 420, onChange: (v) => { r.cur.gpc = v; sync(); } });
      function sync() {
        const ap = Store.isApparel(r.cur.gpc);
        use.checked = r.cur.use;
        dd.setDisabled(!r.cur.use);
        if (ap) { restoreOpts(gs, C().GENDERS, r.cur.gender); restoreOpts(as, C().AGES, r.cur.age); }
        else { gs.innerHTML = as.innerHTML = '<option value="">해당없음</option>'; }
        gs.disabled = as.disabled = !(r.cur.use && ap);
      }
      use.addEventListener("change", () => { r.cur.use = use.checked; sync(); });
      gs.addEventListener("change", () => (r.cur.gender = gs.value));
      as.addEventListener("change", () => (r.cur.age = as.value));
      sync();
      syncs.push(sync);
    });
    m.el.querySelector('[data-act="apply"]').addEventListener("click", () => {
      const u = m.el.querySelector("#b-use").value;
      const ge = m.el.querySelector(".b-gender").value;
      const ag = m.el.querySelector(".b-age").value;
      rows.forEach((r) => {
        if (u) r.cur.use = u === "on";
        if (Store.isApparel(r.cur.gpc)) { if (ge) r.cur.gender = ge; if (ag) r.cur.age = ag; } // 성별·연령대는 의류 GPC 상품에만 적용
      });
      syncs.forEach((f) => f());
      UI.toast("입력값을 바꿨습니다. [상품 피드 반영]을 눌러야 저장됩니다.", "info");
    });
    m.el.querySelector('[data-act="cancel"]').addEventListener("click", () => m.close(true));
    m.el.querySelector('[data-act="save"]').addEventListener("click", async () => {
      if (rows.some((r) => r.cur.use && !r.cur.gpc)) return UI.alert("상품 피드를 사용하려면 Google 상품 카테고리를 선택해 주세요.");
      const res = GStore.saveProducts(rows.map((r) => ({ id: r.p.id, use: r.cur.use, gpc: r.cur.gpc || null, gender: Store.isApparel(r.cur.gpc) ? r.cur.gender : null, age: Store.isApparel(r.cur.gpc) ? r.cur.age : null })));
      await UI.alert("선택한 상품이 상품 피드에 반영되었습니다.");
      m.close(true);
      view.sel.clear();
      App.render();
      UI.toast(`반영 결과 — 반영대기 ${res.queued}건${res.restricted ? ` · 노출제한 ${res.restricted}건` : ""}${res.unused ? ` · 사용안함 ${res.unused}건` : ""}`, "info");
    });
  }

  /* ---------------- 동기화 이력 (재시도 버튼 없음, POL-076) ---------------- */
  function openHistory() {
    const f = { days: 30, result: "" };
    const m = UI.modal({ title: "동기화 이력", size: "lg", body: '<div id="hist"></div>', footer: '<button type="button" class="btn btn--dark btn--lg" data-act="close">닫기</button>' });
    const box = m.el.querySelector("#hist");
    function paint() {
      const list = GStore.s.history.filter((h) => (h.at == null || -h.at <= f.days) && (!f.result || h.result === f.result));
      box.innerHTML = `
        <div class="hist-filter"><select class="select select--sm" id="h-days">${[[7, "최근 7일"], [30, "최근 30일"], [90, "최근 90일"]].map((o) => `<option value="${o[0]}" ${o[0] === f.days ? "selected" : ""}>${o[1]}</option>`).join("")}</select>
          <select class="select select--sm" id="h-res"><option value="">결과 전체</option>${["성공", "일부 실패", "실패", "진행 중"].map((r) => `<option ${r === f.result ? "selected" : ""}>${r}</option>`).join("")}</select></div>
        <div class="mtable-wrap"><table class="mtable"><thead><tr><th>일시</th><th>유형</th><th>결과</th><th>대상</th><th>성공</th><th>실패</th><th>상세</th></tr></thead>
        <tbody>${list.length ? list.map((h, i) => `<tr><td>${h.atStr}</td><td>${h.type}</td><td>${h.result}</td><td>${h.target}</td><td>${h.ok}</td><td>${h.fail}</td><td>${h.fail ? `<button type="button" class="btn btn--line btn--sm" data-h="${GStore.s.history.indexOf(h)}">상세</button>` : "-"}</td></tr>`).join("") : '<tr><td colspan="7" class="table__empty">조회된 이력이 없습니다.</td></tr>'}</tbody></table></div>`;
      box.querySelector("#h-days").addEventListener("change", (e) => { f.days = +e.target.value; paint(); });
      box.querySelector("#h-res").addEventListener("change", (e) => { f.result = e.target.value; paint(); });
      box.querySelectorAll("[data-h]").forEach((b) => b.addEventListener("click", () => openFail(GStore.s.history[+b.dataset.h])));
    }
    paint();
    m.el.querySelector('[data-act="close"]').addEventListener("click", () => m.close(true));
  }
  function openFail(h) {
    const ps = (h.failIds || []).map((id) => GStore.products().find((p) => p.id === id)).filter(Boolean);
    const body = `<p class="sec__lead">${h.atStr} ${h.type} 실패 상품 ${h.fail}건입니다. 실패 상품은 반영대기로 남아 다음 전송에서 다시 보냅니다.</p>
      <table class="mtable"><thead><tr><th>상품정보</th><th>실패 사유</th></tr></thead><tbody>${ps.map((p) => `<tr><td class="td-left">${UI.esc(p.name)}</td><td class="td-left">${UI.esc(h.cause || window.GMOCK.failReasons[p.id] || "Merchant API 일시 오류. 다음 전송에서 다시 보냅니다.")}</td></tr>`).join("")}</tbody></table>`;
    const m = UI.modal({ title: "동기화 실패 상세", size: "md", body, footer: '<button type="button" class="btn btn--dark btn--lg" data-act="close">닫기</button>' });
    m.el.querySelector('[data-act="close"]').addEventListener("click", () => m.close(true));
  }

  return { render };
})();
