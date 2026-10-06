/* ==========================================================================
   SCR 3-4 · 상품 피드 탭 (미연동 / 연동완료) + 3-4-2 선택 상품 카테고리 매칭
   ========================================================================== */
const FeedPage = (function () {
  const TABS = ["전체", "활동중", "검토중", "미승인", "노출제한", "사용안함", "미전송"];
  const SIZES = [20, 30, 50, 70, 100];
  const GENDERS = [["unisex", "남녀공용"], ["male", "남성"], ["female", "여성"]];
  const AGES = [["all ages", "전연령"], ["adult", "성인"], ["teen", "청소년"], ["kids", "어린이"], ["toddler", "유아"], ["infant", "영아"], ["newborn", "신생아"]];
  const view = { tab: "전체", q: "", page: 1, size: 20, sel: new Set() };

  /* ---------------- 썸네일 (mock 이미지) ---------------- */
  const PALETTE = ["#d9c3a5", "#9fb4c7", "#c7a0a0", "#a3b18a", "#b8a1c9", "#e0b77c", "#8fa3a8", "#c9b79c"];
  function thumb(p) {
    if (p.r && p.r.noImage) return `<span class="thumb thumb--none">No<br>Image</span>`;
    const c = PALETTE[p.id % PALETTE.length];
    const ch = UI.esc(p.name.replace(/^\[[^\]]*\]\s*/, "").charAt(0));
    return `<span class="thumb" style="background:linear-gradient(135deg, ${c}, #fff)">${ch}</span>`;
  }
  function priceText(p) {
    if (p.r && p.r.priceText) return '<span class="muted">가격문의</span>';
    return UI.fmt(p.price);
  }
  function gpcText(p) {
    const g = Store.gpc(Store.effGpc(p));
    return g ? `<span class="ellipsis" title="${UI.esc(g.path)}">${UI.esc(g.path)}</span>` : '<span class="muted">미설정</span>';
  }
  const stCls = (st) => "st st--" + st;

  function render(root, params) {
    const s = Store.s;
    if (params && params.tab && TABS.includes(params.tab)) {
      view.tab = params.tab;
      view.page = 1;
      view.sel.clear();
    }
    if (!s.connected) {
      root.appendChild(
        App.emptyState({
          title: "비즈니스 자산 연동 후 상품 피드를 사용할 수 있습니다.",
          desc: "페이스북 채널 연동이 완료되면 상품 카탈로그가<br>자동으로 생성되고 Meta에 상품 피드가 연동됩니다.",
          btn: "비즈니스 자산 설정하기",
          note: "연결 관리 탭에서 비즈니스 자산 설정하기 버튼을 클릭해 카탈로그, Facebook 페이지, 픽셀 등을 연동하면 상품 피드가 자동으로 활성화됩니다.",
          onClick: App.gotoConnectAndStart,
        })
      );
      return;
    }
    root.appendChild(
      App.banner(
        "상품 피드",
        "메이크샵 상품을 Meta 제품 카탈로그와 연동하고 관리하는 공간입니다. 쇼핑 채널 및 광고 운영에 필요한 상품 데이터를 Meta로 전달하며, 상품 연동 상태·동기화 현황·오류 여부 등을 확인할 수 있습니다.<br>카탈로그 생성 이후 상품의 등록·수정·삭제 등 변경 사항이 자동으로 업데이트되며, 최신 상품 정보가 Meta 채널에 지속적으로 반영됩니다."
      )
    );
    // 2. 상품 피드 등록 현황
    const a = window.MOCK.account;
    const summary = App.section(
      "상품 피드 등록 현황",
      `<button type="button" class="btn btn--line btn--sm" data-ext="Meta Catalog 바로가기" data-url="https://business.facebook.com/commerce/catalogs/${a.catalogId}/products?business_id=${a.businessId}">Meta Catalog 바로가기</button>`,
      ConnectPage.statusBar(Store.counts(s.products), s.lastUpdate, true) +
        (!s.categorySaved ? `<p class="note note--warn">${UI.icon.info}<span>상품 카테고리 매칭 전입니다. 연결 관리 &gt; 상품 카테고리 매칭에서 카테고리를 매칭하면 상품이 미전송 상태로 저장되어 Meta로 전송할 수 있습니다.</span></p>` : "")
    );
    summary.querySelector(".sec__toggle").remove();
    ConnectPage.bindExt(summary);
    root.appendChild(summary);
    // 3. 상품 피드 목록
    const listSec = App.section("상품 피드 목록", "", '<div id="feed-list"></div>', { cls: "sec--list" });
    root.appendChild(listSec);
    paintList(listSec.querySelector("#feed-list"));
  }

  function filtered() {
    const q = view.q.trim().toLowerCase();
    return Store.s.products.filter((p) => !q || p.name.toLowerCase().includes(q));
  }

  function paintList(box) {
    const base = filtered();
    const c = Store.counts(base);
    const rows = view.tab === "전체" ? base : base.filter((p) => Store.status(p) === view.tab);
    const pages = Math.max(1, Math.ceil(rows.length / view.size));
    if (view.page > pages) view.page = pages;
    const pageRows = rows.slice((view.page - 1) * view.size, view.page * view.size);
    const cols = columnsFor(view.tab);

    box.innerHTML = `
      <div class="list-tools">
        <div class="stabs" role="tablist">${TABS.map((t) => `<button type="button" role="tab" class="stab ${t === view.tab ? "is-active" : ""}" data-tab="${t}" aria-selected="${t === view.tab}">${t} <b>${c[t]}</b></button>`).join("")}</div>
        <div class="list-tools__right">
          <form class="search" id="feed-search"><button type="submit" aria-label="검색">${UI.icon.search}</button><input type="search" placeholder="검색어를 입력해 주세요." value="${UI.esc(view.q)}" aria-label="상품명 검색" /></form>
          <select class="select" id="feed-size" aria-label="페이지당 노출 개수">${SIZES.map((n) => `<option value="${n}" ${n === view.size ? "selected" : ""}>${n}개씩 보기</option>`).join("")}</select>
        </div>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>${cols.map((k) => `<th class="col-${k}">${head(k)}</th>`).join("")}</tr></thead>
        <tbody>${pageRows.length ? pageRows.map((p) => `<tr>${cols.map((k) => `<td class="col-${k}">${cell(k, p)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="table__empty">표시할 상품이 없습니다.</td></tr>`}</tbody>
      </table></div>
      <div class="list-foot"><div class="list-foot__left"><button type="button" class="btn btn--line" data-act="bulk">선택 수정</button>${view.tab === "미전송" ? '<button type="button" class="btn btn--primary" data-act="send">선택 상품 Meta 전송</button><span class="muted small">1회 최대 100개 · 현재 페이지에서 선택한 상품만 전송됩니다.</span>' : ""}</div><div id="feed-pager"></div><div class="list-foot__right muted small">총 ${UI.fmt(rows.length)}건 · 선택 ${view.sel.size}건</div></div>`;

    box.querySelector("#feed-pager").appendChild(UI.pagination(rows.length, view.page, view.size, (p) => { view.page = p; view.sel.clear(); paintList(box); }));
    box.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { view.tab = b.dataset.tab; view.page = 1; view.sel.clear(); paintList(box); }));
    box.querySelector("#feed-search").addEventListener("submit", (e) => {
      e.preventDefault();
      view.q = e.target.querySelector("input").value;
      view.page = 1;
      view.sel.clear();
      paintList(box);
    });
    box.querySelector("#feed-search input").addEventListener("search", (e) => { if (!e.target.value) { view.q = ""; view.page = 1; paintList(box); } });
    box.querySelector("#feed-size").addEventListener("change", (e) => { view.size = +e.target.value; view.page = 1; view.sel.clear(); paintList(box); });
    // 체크박스 (현재 페이지 기준)
    const all = box.querySelector("#chk-all");
    const chks = [...box.querySelectorAll(".row-chk")];
    all.checked = chks.length > 0 && chks.every((x) => x.checked);
    all.addEventListener("change", () => { chks.forEach((x) => { x.checked = all.checked; all.checked ? view.sel.add(+x.value) : view.sel.delete(+x.value); }); paintFootCount(box, rows.length); });
    chks.forEach((x) => x.addEventListener("change", () => { x.checked ? view.sel.add(+x.value) : view.sel.delete(+x.value); all.checked = chks.every((y) => y.checked); paintFootCount(box, rows.length); }));
    box.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openProductModal([+b.dataset.detail], box)));
    box.querySelector('[data-act="bulk"]').addEventListener("click", async () => {
      const ids = pageRows.filter((p) => view.sel.has(p.id)).map((p) => p.id);
      if (!ids.length) return UI.alert("선택된 상품이 없습니다.");
      openProductModal(ids, box);
    });
    const send = box.querySelector('[data-act="send"]');
    if (send)
      send.addEventListener("click", async () => {
        const ids = pageRows.filter((p) => view.sel.has(p.id)).map((p) => p.id);
        if (!ids.length) return UI.alert("선택된 상품이 없습니다.");
        if (ids.length > 100) return UI.alert("1회 최대 100개 상품까지 전송할 수 있습니다.");
        const r = Store.transmit(ids);
        view.sel.clear();
        UI.toast(`Meta 전송 요청 완료 — 전송 ${r.sent}건(검토중)${r.restricted ? ` · 노출제한 ${r.restricted}건` : ""}${r.unused ? ` · 사용안함 ${r.unused}건` : ""}`, "success");
        App.render();
      });
    INFO.bind(box);
  }
  function paintFootCount(box, total) {
    box.querySelector(".list-foot__right").textContent = `총 ${UI.fmt(total)}건 · 선택 ${view.sel.size}건`;
  }

  function columnsFor(tab) {
    if (tab === "전체") return ["chk", "info", "status", "linked", "price", "gpc", "manage"];
    if (tab === "미승인" || tab === "노출제한") return ["chk", "info", "linked", "price", "reason", "manage"];
    if (tab === "사용안함") return ["chk", "info", "linked", "price", "manage"];
    return ["chk", "info", "linked", "price", "gpc", "manage"];
  }
  function head(k) {
    return {
      chk: '<input type="checkbox" id="chk-all" aria-label="현재 페이지 전체 선택" />',
      info: "상품정보",
      status: `승인상태 ${UI.qmark("approval")}`,
      linked: "연동 상품 수",
      price: "가격",
      gpc: "페이스북 카테고리",
      reason: `사유 ${UI.qmark("reason")}`,
      manage: "관리",
    }[k];
  }
  function cell(k, p) {
    const st = Store.status(p);
    switch (k) {
      case "chk": return `<input type="checkbox" class="row-chk" value="${p.id}" ${view.sel.has(p.id) ? "checked" : ""} aria-label="${UI.esc(p.name)} 선택" />`;
      case "info": return `<div class="pinfo">${thumb(p)}<div><div class="pinfo__name">${UI.esc(p.name)}</div><div class="pinfo__cat">${p.cat ? pathLabel(Store.cat(p.cat).path) : "분류 미지정"}</div></div></div>`;
      case "status": return `<span class="${stCls(st)}">${st}</span>`;
      case "linked": return UI.fmt(Store.linkedCount(p));
      case "price": return priceText(p);
      case "gpc": return gpcText(p);
      case "reason": return `<span class="reason">${UI.esc(Store.reason(p))}</span>`;
      case "manage": return `<button type="button" class="btn btn--line btn--sm" data-detail="${p.id}">상세</button>`;
    }
  }
  function pathLabel(path) {
    const lv = ["(대분류)", "(중분류)", "(소분류)"];
    return path.map((x, i) => `${lv[i] || ""} ${UI.esc(x)}`).join(" &gt; ");
  }

  /* ---------------- 3-4-2 선택 상품 카테고리 매칭 (상품별) ---------------- */
  function openProductModal(ids, listBox) {
    const items = window.MOCK.gpcList.map((g) => ({ value: g.id, label: g.path }));
    const rows = ids.map((id) => {
      const p = Store.s.products.find((x) => x.id === id);
      const g = Store.effGpc(p) || "";
      const ap = Store.isApparel(g);
      return { p, init: { useFeed: p.useFeed, gpc: g, gender: p.gender || (ap ? "unisex" : ""), age: p.age || (ap ? "all ages" : "") }, cur: null, locked: !!(p.r && p.r.sale) };
    });
    rows.forEach((r) => (r.cur = Object.assign({}, r.init)));
    const body = `
      <div class="graybox"><b>페이스북 제품 카테고리 매칭</b><ul>
        <li>제품 카테고리 매칭은 쇼핑몰의 상품 카테고리를 메타가 사용하는 표준 상품 분류 체계에 연결하는 것을 의미합니다.</li>
        <li>카테고리를 매칭하면 상품 정보를 보다 정확하게 전달할 수 있으며, 카탈로그 구성 및 광고 최적화에 도움이 됩니다. 또한 메타에서 상품을 올바르게 분류하여 노출할 수 있도록 지원합니다.</li>
        <li>사용여부를 통해 설정한 카테고리 매칭 정보를 상품 데이터 전송여부를 결정할 수 있습니다.</li>
        <li>연동된 상품 수는 옵션별 생성되는 개별 상품 수입니다. 색상, 사이즈 등의 옵션이 있는 경우 각 조합이 별도의 에디션으로 등록됩니다.</li></ul></div>
      <div class="mtable-wrap mtable-wrap--wide"><table class="mtable mtable--prod">
        <thead><tr><th>사용여부 ${UI.qmark("useFeed")}</th><th>승인상태 ${UI.qmark("approval")}</th><th>상품정보</th><th>연동 상품 수</th><th>쇼핑몰 카테고리</th><th>페이스북 카테고리</th><th>성별</th><th>연령대</th></tr></thead>
        <tbody>${rows
          .map(
            (r, i) => `<tr data-i="${i}" class="${r.locked ? "is-locked" : ""}">
            <td><label class="switch"><input type="checkbox" class="m-use" ${r.cur.useFeed ? "checked" : ""} ${r.locked ? "disabled" : ""} aria-label="사용여부"/><i></i></label></td>
            <td><span class="${stCls(Store.status(r.p))}">${Store.status(r.p)}</span></td>
            <td><div class="pinfo pinfo--sm">${thumb(r.p)}<div class="pinfo__name">${UI.esc(r.p.name)}${r.locked ? '<div class="row-hint">판매불가능 상품은 상품 피드 수정 대상에서 제외됩니다.</div>' : ""}</div></div></td>
            <td>${UI.fmt(Store.linkedCount(r.p))}</td>
            <td>${r.p.cat ? UI.esc(Store.catPath(r.p.cat)) : '<span class="muted">분류 미지정</span>'}</td>
            <td><div class="m-gpc"></div></td>
            <td><select class="select select--sm m-gender" aria-label="성별"><option value="">-</option>${GENDERS.map((g) => `<option value="${g[0]}">${g[1]}</option>`).join("")}</select></td>
            <td><select class="select select--sm m-age" aria-label="연령대"><option value="">-</option>${AGES.map((g) => `<option value="${g[0]}">${g[1]}</option>`).join("")}</select></td>
          </tr>`
          )
          .join("")}</tbody></table></div>`;
    const m = UI.modal({ title: "선택 상품 카테고리 매칭", size: "xl", body, footer: '<button type="button" class="btn btn--line btn--lg" data-act="cancel">취소</button><button type="button" class="btn btn--dark btn--lg" data-act="save">저장</button>' });
    m.el.querySelectorAll("tbody tr").forEach((tr) => {
      const r = rows[+tr.dataset.i];
      const use = tr.querySelector(".m-use");
      const gs = tr.querySelector(".m-gender");
      const as = tr.querySelector(".m-age");
      const dd = UI.dropdown(tr.querySelector(".m-gpc"), {
        items,
        value: r.cur.gpc,
        placeholder: "카테고리를 선택해주세요",
        minListWidth: 420,
        onChange: (v) => {
          r.cur.gpc = v;
          if (Store.isApparel(v)) {
            if (!r.cur.gender) r.cur.gender = "unisex";
            if (!r.cur.age) r.cur.age = "all ages";
          }
          sync();
        },
      });
      function sync() {
        const on = r.cur.useFeed && !r.locked;
        const ap = Store.isApparel(r.cur.gpc);
        dd.setDisabled(!on);
        gs.disabled = as.disabled = !(on && ap);
        gs.value = ap ? r.cur.gender : "";
        as.value = ap ? r.cur.age : "";
      }
      use.addEventListener("change", () => { r.cur.useFeed = use.checked; sync(); });
      gs.addEventListener("change", () => (r.cur.gender = gs.value));
      as.addEventListener("change", () => (r.cur.age = as.value));
      sync();
    });
    INFO.bind(m.el);
    m.el.querySelector('[data-act="cancel"]').addEventListener("click", () => m.close(true));
    m.el.querySelector('[data-act="save"]').addEventListener("click", async () => {
      const editable = rows.filter((r) => !r.locked);
      if (editable.some((r) => r.cur.useFeed && !r.cur.gpc)) return UI.alert("상품 피드를 사용하려면 페이스북 카테고리를 선택해 주세요.");
      const changed = editable.filter((r) => ["useFeed", "gpc", "gender", "age"].some((k) => r.cur[k] !== r.init[k]));
      const res = Store.saveProductSettings(changed.map((r) => Object.assign({ id: r.p.id }, r.cur)));
      await UI.alert("선택한 상품이 상품 피드에 반영되었습니다.");
      m.close(true);
      view.sel.clear();
      App.render();
      if (changed.length) UI.toast(`반영 결과 — Meta 전송 ${res.sent}건(검토중)${res.restricted ? ` · 노출제한 ${res.restricted}건` : ""}${res.unused ? ` · 사용안함 ${res.unused}건` : ""}`, "info");
    });
  }

  return { render };
})();
