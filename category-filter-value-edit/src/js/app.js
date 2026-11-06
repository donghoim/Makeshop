/* 분류 검색 필터 상세값 수정 목업 — 원본 요청
   정책 번호는 사양 정의서 14장 정책 원장(POL) 기준입니다. 저장은 화면 안에서만 반영되는 목업 동작입니다. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const HOST = "special138.makeshop.co.kr";
  const MAX = 30;
  const MSG = {
    empty: "필터 상세값을 입력해주세요.",
    dup: "중복된 필터 상세값이 있습니다. 다시 입력해주세요.",
    confirm: "필터 상세값을 수정하면 해당 필터를 사용하는 모든 상품에 변경 내용이 반영됩니다. 계속 진행하시겠습니까?",
  };
  const TIPS = {
    values: ["필터 상세값에 마우스를 올린 후 수정 아이콘을 클릭하면 명칭을 수정할 수 있으며, 값을 드래그하여 순서를 변경할 수 있습니다."],
    apply: () => [`선택한 상품 ${S.sel.size}개의 분류 검색 필터를 변경합니다.`],
    rename: ["필터값명 수정은 해당 값을 사용하는 모든 상품과 쇼핑몰 검색 필터에 반영됩니다.", "선택한 상품과 관계없이 해당 필터값을 사용하는 전체 상품에 반영됩니다."],
    add: () => [`선택한 상품 ${S.sel.size}개의 분류 검색 필터를 변경합니다.`],
    remove: () => ["선택한 상품에서 필터값 적용만 해제됩니다. 필터값 자체는 삭제되지 않습니다.", `선택한 상품 ${S.sel.size}개의 분류 검색 필터를 변경합니다.`],
  };
  const MODES = [["apply", "상품 적용값 변경"], ["rename", "필터값명 수정"], ["add", "필터값 추가"], ["remove", "필터값 적용 해제"]];
  const ICON_EDIT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.5 2.5l3 3L5 14H2v-3z"/><path d="M9 4l3 3"/></svg>';

  let S;
  function init() {
    S = { route: "setting", filters: clone(MOCK.filters), products: clone(MOCK.products), colorFilter: MOCK.colorFilter,
      edit: null, pop: null, dlg: null, sel: new Set(), cur: MOCK.products[0].no, pendingOrder: false };
    render();
  }

  /* ---------------- 공통 ---------------- */
  function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2200); }
  function filter(fid) { return (S.pop && S.pop.scopeValues && S.pop.fid === fid ? null : null) || S.filters.find((f) => f.id === fid); }
  function dialog(type, msg) {
    return new Promise((res) => {
      S.dlg = { type, msg, res };
      $("#dlg").innerHTML = `<div class="dlg-wrap"><div class="dlg" role="${type === "confirm" ? "alertdialog" : "alert"}"><div class="from">${HOST} 내용:</div><div class="msg">${esc(msg)}</div>
        <div class="bt">${type === "confirm" ? '<button type="button" class="pri" data-dlg="ok">확인</button><button type="button" data-dlg="cancel">취소</button>' : '<button type="button" class="pri" data-dlg="ok">확인</button>'}</div></div></div>`;
      $('#dlg [data-dlg="ok"]').focus();
    });
  }
  function closeDialog(ok) { if (!S.dlg) return; const r = S.dlg.res; S.dlg = null; $("#dlg").innerHTML = ""; r(ok); }
  function showTip(key, anchor) {
    hideTip();
    const t = TIPS[key]; const lines = typeof t === "function" ? t() : t;
    const el = document.createElement("div"); el.className = "tip"; el.id = "tip"; el.setAttribute("role", "tooltip");
    el.innerHTML = lines.map((l) => `<p>- ${esc(l)}</p>`).join("") + '<button type="button" class="cl" aria-label="닫기">✕</button>';
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    el.style.left = Math.max(8, r.left + window.scrollX - 10) + "px";
    el.style.top = r.bottom + window.scrollY + 8 + "px";
  }
  function hideTip() { const t = $("#tip"); if (t) t.remove(); }

  /* ---------------- 칩 ---------------- */
  function chipHtml(scope, f, v) {
    const ed = S.edit && S.edit.scope === scope && S.edit.vid === v.id && S.edit.fid === f.id;
    if (ed) return `<span class="chip editing" data-scope="${scope}" data-f="${f.id}" data-v="${v.id}"><input type="text" maxlength="${MAX}" value="${esc(S.edit.val)}" aria-label="필터 상세값 수정"><button type="button" class="ok" aria-label="확인">✓</button><button type="button" class="cc" aria-label="취소">✕</button></span>`;
    const main = scope === "main";
    const dot = main && f.id === S.colorFilter && v.c ? `<span class="dot" style="background:${v.c}"></span>` : "";
    return `<span class="chip" tabindex="0" data-scope="${scope}" data-f="${f.id}" data-v="${v.id}"${main ? ' draggable="true"' : ""}>${main ? '<span class="dr" aria-hidden="true">⋮⋮</span>' : ""}${dot}<span class="t">${esc(v.n)}</span><button type="button" class="ed" aria-label="${esc(v.n)} 수정">${ICON_EDIT}</button>${main ? "" : '<button type="button" class="x" aria-label="삭제">x</button>'}</span>`;
  }
  function valuesOf(scope, fid) { return scope === "pop" ? S.pop.values : S.filters.find((f) => f.id === fid).values; }
  function startEdit(scope, fid, vid) {
    const v = valuesOf(scope, fid).find((x) => x.id === vid); if (!v) return;
    S.edit = { scope, fid, vid, orig: v.n, val: v.n }; paint();
    const inp = $(".chip.editing input"); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
  function cancelEdit() { if (!S.edit) return; S.edit = null; paint(); }
  async function submitEdit() {
    if (!S.edit || S.dlg) return;
    const e = S.edit; const inp = $(".chip.editing input"); if (inp) e.val = inp.value;
    const val = e.val.trim();
    const list = valuesOf(e.scope, e.fid);
    if (!val) { await dialog("alert", MSG.empty); refocus(); return; }                       // POL-005
    if (list.some((x) => x.id !== e.vid && x.n === val)) { await dialog("alert", MSG.dup); refocus(); return; } // POL-007
    if (val === e.orig) { S.edit = null; paint(); return; }                                     // OPEN-001: 구현 확인 전 목업 동작
    const ok = await dialog("confirm", MSG.confirm);                                            // POL-008, POL-016
    if (!ok) { refocus(); return; }
    list.find((x) => x.id === e.vid).n = val; S.edit = null; paint();
    toast(e.scope === "main" ? `'${e.orig}' → '${val}' 저장됨 (즉시 저장 · 목업)` : `'${val}'(으)로 바뀜 · 하단 버튼을 눌러야 저장됩니다 (목업)`);
  }
  function refocus() { const i = $(".chip.editing input"); if (i) i.focus(); }

  /* ---------------- 검색 필터 설정 ---------------- */
  function settingHtml() {
    const shown = S.filters.filter((f) => f.show).length;
    const rows = S.filters.map((f) => `<tr data-row="${f.id}"><td><span class="mv" title="필터 순서 이동">↕</span></td><td>${esc(f.name)}</td>
      <td class="vals"><div class="chips" data-f="${f.id}">${f.values.map((v) => chipHtml("main", f, v)).join("")}</div></td>
      <td><button type="button" class="btn" data-act="manage" data-f="${f.id}">관리</button></td><td><span class="toggle${f.show ? "" : " off"}" data-act="toggle" data-f="${f.id}" role="switch" aria-checked="${f.show}"></span></td></tr>`).join("");
    return `<div class="page-head"><h2>검색 필터 설정</h2><span class="crumb">부가서비스 &gt; 부가서비스 &gt; 상품 &gt; 검색 필터 &gt; 검색 필터 설정</span></div>
      <h3 class="sec">분류 검색엔진 셋팅</h3>
      <table class="frm"><tr><th>분류 검색엔진 사용여부</th><td><label><input type="radio" name="se" checked>사용함</label><label><input type="radio" name="se">사용안함</label></td></tr>
      <tr><th>결과 노출 방법 설정<button type="button" class="qm" data-old>?</button></th><td><label><input type="radio" name="rs" checked>즉시 노출</label><label><input type="radio" name="rs">검색 버튼 노출</label></td></tr></table>
      <h3 class="sec">분류 검색 필터 설정</h3>
      <table class="frm"><tr><th>색상 코드 연동 설정<button type="button" class="qm" data-old>?</button></th><td><label><input type="radio" name="cc" checked>사용함</label><select class="sel" style="width:290px;margin-right:12px"><option>색상</option></select><label><input type="radio" name="cc">사용안함</label></td></tr></table>
      <h3 class="sec">분류 검색 필터<button type="button" class="qm" data-old>?</button></h3>
      <div class="fbox" id="filter-box"><div class="bar"><span>전체개수 : <em>${S.filters.length}개</em> &nbsp;&nbsp; 노출개수 : <em>${shown}개</em></span><button type="button" class="btn blue" data-act="create" id="btn-create">필터추가 +</button></div>
      <table class="ftbl" id="filter-table"><colgroup><col style="width:60px"><col style="width:110px"><col><col style="width:80px"><col style="width:80px"></colgroup>
      <thead><tr><th>이동</th><th>필터명</th><th id="th-values">필터 상세값<button type="button" class="qm" data-tip="values" id="tip-values">?</button></th><th>관리</th><th>노출여부</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="notice"><i>i</i>알림 ⌄</p>
      <div class="center" style="margin-top:22px"><button type="button" class="btn blue big" data-act="save-order" id="btn-save">저장</button></div>`;
  }

  /* ---------------- 검색 필터 일괄 관리 ---------------- */
  function bulkHtml() {
    const cur = S.products.find((p) => p.no === S.cur);
    const rows = S.products.map((p) => `<tr data-p="${p.no}" class="${p.no === S.cur ? "cur" : ""}"><td><input type="checkbox" data-chk="${p.no}" ${S.sel.has(p.no) ? "checked" : ""} aria-label="${esc(p.name)} 선택"></td><td>${p.no}</td><td><span class="img"></span></td><td class="nm">${esc(p.name)}</td></tr>`).join("");
    const st = S.filters.map((f) => { const ids = (cur.v[f.id] || []).filter((id) => f.values.some((x) => x.id === id)); const names = ids.map((id) => f.values.find((x) => x.id === id).n);
      return `<tr><td>${esc(f.name)}</td><td>${f.show ? "노출" : "미노출"}</td><td class="${names.length ? "" : "na"}">${names.length ? "[적용]" : "[미적용]"}</td><td class="v">${names.length ? esc(names.join(", ")) : "적용 중인 필터 값이 없습니다."}</td></tr>`; }).join("");
    return `<div class="page-head"><h2>검색 필터 일괄 관리 <span class="man">▦ 매뉴얼</span></h2><span class="crumb">부가서비스 &gt; 부가서비스 &gt; 상품 &gt; 검색 필터 &gt; 검색 필터 일괄 관리</span></div>
      <h3 class="sec">상품 검색</h3>
      <table class="frm"><tr><th>진열 상태</th><td><label><input type="radio" name="ds" checked>전체</label><label><input type="radio" name="ds">진열</label><label><input type="radio" name="ds">미진열</label></td></tr>
      <tr><th>분류 선택</th><td><select class="sel"><option>아우터</option></select> <select class="sel"><option>대분류전체</option></select> <select class="sel"><option></option></select></td></tr>
      <tr><th>상품 검색</th><td><select class="sel"><option>상품명</option></select> <input class="inp" style="width:360px" placeholder="입력하세요."></td></tr>
      <tr><th>분류 검색 필터</th><td><select class="sel"><option>필터를 선택해 주세요.</option></select> <select class="sel"><option>필터값을 선택해 주세요.</option></select></td></tr>
      <tr><th>상품 등록 기간</th><td><input class="inp" value="2026-10-01" style="width:110px"> ~ <input class="inp" value="2026-11-06" style="width:110px"> <button type="button" class="btn">어제</button><button type="button" class="btn blue">오늘</button><button type="button" class="btn">3일</button><button type="button" class="btn">7일</button><button type="button" class="btn">1달</button></td></tr></table>
      <div class="btnrow"><button type="button" class="btn big" data-act="noop">↻ 초기화</button><button type="button" class="btn blue big" data-act="noop">검색</button></div>
      <h3 class="sec">상품 리스트</h3>
      <div class="listhead"><span class="cnt">검색 결과 : <em>${S.products.length}</em>건</span><span><select class="sel" style="min-width:90px"><option>제품명순</option></select> <button type="button" class="btn" data-act="bulk" id="btn-bulk">일괄변경 ›</button></span></div>
      <div class="split"><table class="ptbl" id="product-table"><colgroup><col style="width:40px"><col style="width:110px"><col style="width:80px"><col></colgroup>
        <thead><tr><th><input type="checkbox" data-act="chk-all" aria-label="전체 선택" ${S.sel.size === S.products.length ? "checked" : ""}></th><th>상품번호</th><th>이미지</th><th>상품명</th></tr></thead><tbody>${rows}</tbody></table>
        <table class="stbl" id="status-table"><colgroup><col style="width:90px"><col style="width:100px"><col style="width:100px"><col></colgroup><thead><tr><th>필터명</th><th>필터 노출 여부</th><th>필터 적용 여부</th><th>필터 상세값</th></tr></thead><tbody>${st}</tbody></table></div>
      <div class="pager"><span>«</span><span>‹</span><span class="on">1</span><span>›</span><span>»</span></div>`;
  }

  /* ---------------- 팝업 ---------------- */
  function winHtml(title, url, body) {
    return `<div class="overlay"><div class="win" role="dialog" aria-label="${esc(title)}"><div class="tb"><span>◎ ${esc(title)} - Chrome</span><span class="sp"></span><span class="w">—▢</span><button type="button" class="cls" data-act="pop-close" aria-label="닫기">✕</button></div>
      <div class="ub">⇆ &nbsp;${HOST}/makeshop/newmanager/${url}</div><div class="bd">${body}</div></div></div>`;
  }
  function filterPopHtml() {
    const p = S.pop; const create = p.type === "create";
    const pf = { id: p.fid || 0 };
    const chips = p.values.map((v) => chipHtml("pop", pf, v)).join("");
    const cats = MOCK.categories.map(([n, c], i) => `<div class="cat"><span class="pl">+</span><span class="nm">${esc(n)} [${c}]<span><label><input type="radio" name="cat${i}" data-cat="${i}" value="N" ${p.cats[i] ? "" : "checked"}>노출안함</label><label><input type="radio" name="cat${i}" data-cat="${i}" value="Y" ${p.cats[i] ? "checked" : ""}>노출함</label></span></span></div>`).join("");
    const can = p.name.trim() && p.values.length > 0 && Object.values(p.cats).some(Boolean);
    const body = `<h2>분류 검색 필터 생성</h2>
      <table class="frm"><tr><th>필터명 <span style="color:#e02020">*</span></th><td><input class="inp" id="pop-name" maxlength="25" style="width:420px" placeholder="필터명을 입력하세요." value="${esc(p.name)}"><span class="cnt25">${p.name.length}/25</span></td></tr>
      <tr><th>노출여부 설정 <span style="color:#e02020">*</span></th><td><label><input type="radio" name="pshow" ${p.show ? "checked" : ""} data-pshow="1">노출함</label><label><input type="radio" name="pshow" ${p.show ? "" : "checked"} data-pshow="0">노출안함</label></td></tr>
      <tr><th>필터 상세값 <span style="color:#e02020">*</span></th><td><input class="inp" id="pop-add" maxlength="${MAX}" style="width:420px" placeholder="필터 상세값을 입력 후 엔터를 클릭해주세요."><div class="chips" id="pop-chips" style="margin-top:8px">${chips}</div></td></tr></table>
      <p class="notice"><i>i</i>알림 ⌄</p>
      <h3>필터 노출 분류 선택</h3><div class="catbox">${cats}</div><p class="notice"><i>i</i>알림 ⌄</p>
      <div class="foot">${create ? `<button type="button" class="btn big" data-act="pop-close">취소</button><button type="button" class="btn blue big" data-act="pop-register" id="btn-register" ${can ? "" : "disabled"}>등록</button>`
        : `<button type="button" class="btn big" data-act="noop">삭제</button><button type="button" class="btn blue big" data-act="pop-update" id="btn-update">수정</button>`}</div>`;
    return winHtml("분류 검색 필터 생성", "search_filter_pop.html" + (create ? "" : "?filter_id=" + p.fid), body);
  }
  function bulkPopHtml() {
    const p = S.pop; const f = S.filters.find((x) => x.id === +p.fid);
    const opts = (sel) => `<option value="">필터를 선택해주세요.</option>` + (f ? f.values.map((v) => `<option value="${v.id}" ${+sel === v.id ? "selected" : ""}>${esc(v.n)}</option>`).join("") : "");
    const row = (label, tip, inner) => `<tr><th>${label}${tip ? `<button type="button" class="qm" data-tip="${tip}" id="tip-${tip}">?</button>` : ""}</th><td>${inner}</td></tr>`;
    let rows = "";
    if (p.mode === "apply") rows = row("기존 필터값", "", `<select class="sel" style="width:100%" data-b="a">${opts(p.a)}</select>`) + row("변경할 필터값", "apply", `<select class="sel" style="width:100%" data-b="b">${opts(p.b)}</select>`);
    if (p.mode === "rename") rows = row("수정할 필터값", "", `<select class="sel" style="width:100%" data-b="a">${opts(p.a)}</select>`) + row("변경할 명칭", "rename", `<input class="inp" id="bulk-name" maxlength="${MAX}" style="width:100%" value="${esc(p.name)}">`);
    if (p.mode === "add") rows = row("추가할 필터값", "add", `<select class="sel" style="width:100%" data-b="a">${opts(p.a)}</select>`);
    if (p.mode === "remove") rows = row("적용 해제할 필터값", "remove", `<select class="sel" style="width:100%" data-b="a">${opts(p.a)}</select>`);
    const body = `<h2>상품 분류 검색 필터 일괄 변경</h2>
      <table class="frm" id="bulk-form"><tr><th>필터 선택</th><td><select class="sel" style="width:100%" data-b="fid"><option value="">필터를 선택해주세요.</option>${S.filters.map((x) => `<option value="${x.id}" ${+p.fid === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></td></tr>
      <tr id="row-mode"><th>작업 유형</th><td>${MODES.map(([k, l]) => `<label><input type="radio" name="bmode" data-mode="${k}" ${p.mode === k ? "checked" : ""}>${l}</label>`).join("")}</td></tr>${rows}</table>
      ${p.mode === "rename" ? "" : `<label class="chk-line" id="chk-moddate"><input type="checkbox" ${p.chk ? "checked" : ""} data-b="chk">선택한 상품의 수정일시를 변경합니다.</label>`}
      <div class="foot"><button type="button" class="btn big" data-act="pop-close">취소</button><button type="button" class="btn blue big" data-act="bulk-save" id="btn-bulk-save">저장</button></div>`;
    return winHtml("상품 분류 검색 필터 일괄 변경", "search_filter_modify_pop.html", body);
  }

  /* ---------------- 렌더 ---------------- */
  function render() {
    $$(".demo [data-route]").forEach((b) => b.classList.toggle("on", b.dataset.route === S.route));
    $("#main").innerHTML = S.route === "setting" ? settingHtml() : bulkHtml();
    $("#pop").innerHTML = !S.pop ? "" : S.pop.type === "bulk" ? bulkPopHtml() : filterPopHtml();
  }
  function paint() { // 입력 중 포커스를 잃지 않도록 필요한 부분만 다시 그림
    const ae = document.activeElement; const keep = ae && ae.id && ["pop-name", "pop-add", "bulk-name"].includes(ae.id) ? { id: ae.id, s: ae.selectionStart } : null;
    render(); hideTip();
    if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); try { el.setSelectionRange(keep.s, keep.s); } catch (e) {} } }
  }

  /* ---------------- 팝업 동작 ---------------- */
  function openCreate() { S.edit = null; S.pop = { type: "create", name: "", show: true, values: [], cats: {}, seq: 900 }; paint(); }
  function openManage(fid) {
    const f = S.filters.find((x) => x.id === fid); S.edit = null;
    S.pop = { type: "manage", fid, name: f.name, show: f.show, values: clone(f.values), cats: { 0: true, 1: true }, seq: 900 }; paint();
  }
  async function popAdd(val) {
    const p = S.pop; val = val.trim(); if (!val) return;
    if (p.values.some((x) => x.n === val)) { await dialog("alert", MSG.dup); $("#pop-add").focus(); return; } // POL-018
    p.values.push({ id: ++p.seq, n: val }); paint(); const a = $("#pop-add"); a.value = ""; a.focus();
  }
  function popRegister() {
    const p = S.pop; const id = Math.max(...S.filters.map((f) => f.id)) + 1;
    S.filters.push({ id, name: p.name.trim(), show: p.show, values: p.values.map((v, i) => ({ id: id * 10 + i + 1, n: v.n })) });
    S.pop = null; paint(); toast(`'${p.name.trim()}' 필터 등록 (목업)`);
  }
  function popUpdate() {
    const p = S.pop; const f = S.filters.find((x) => x.id === p.fid);
    const keep = new Set(p.values.map((v) => v.id));
    f.name = p.name.trim() || f.name; f.show = p.show; f.values = p.values.map((v) => ({ ...v }));
    S.products.forEach((pr) => { pr.v[f.id] = (pr.v[f.id] || []).filter((id) => keep.has(id)); });
    S.pop = null; paint(); toast("관리 팝업 변경 내용 저장 (목업)");
  }
  async function bulkSave() {
    const p = S.pop; const f = S.filters.find((x) => x.id === +p.fid);
    if (!f) { toast("필터를 선택해 주세요 (목업 안내)"); return; }
    if (!p.a) { toast("필터값을 선택해 주세요 (목업 안내)"); return; }
    const a = +p.a;
    if (p.mode === "rename") {
      const val = (($("#bulk-name") || {}).value || "").trim(); p.name = val;
      if (!val) { await dialog("alert", MSG.empty); return; }                                           // POL-026
      if (f.values.some((x) => x.id !== a && x.n === val)) { await dialog("alert", MSG.dup); return; }
      const v = f.values.find((x) => x.id === a); const before = v.n; v.n = val;                          // POL-025
      const used = S.products.filter((pr) => (pr.v[f.id] || []).includes(a)).length;
      S.pop = null; paint(); toast(`'${before}' → '${val}' · 이 값을 쓰는 상품 ${used}개 모두 반영 (목업)`); return;
    }
    const targets = S.products.filter((pr) => S.sel.has(pr.no)); let n = 0;
    targets.forEach((pr) => { const arr = pr.v[f.id] = pr.v[f.id] || [];
      if (p.mode === "apply") { if (!p.b) return; const i = arr.indexOf(a); if (i >= 0) { arr.splice(i, 1, +p.b); n++; } }  // POL-024
      if (p.mode === "add" && !arr.includes(a)) { arr.push(a); n++; }
      if (p.mode === "remove") { const i = arr.indexOf(a); if (i >= 0) { arr.splice(i, 1); n++; } }               // POL-028
    });
    if (p.mode === "apply" && !p.b) { toast("변경할 필터값을 선택해 주세요 (목업 안내)"); return; }
    S.pop = null; paint(); toast(`선택 상품 ${targets.length}개 중 ${n}개 변경 (목업)`);
  }

  /* ---------------- 이벤트 ---------------- */
  document.addEventListener("click", async (e) => {
    const t = e.target;
    const dl = t.closest("[data-dlg]"); if (dl) { closeDialog(dl.dataset.dlg === "ok"); return; }
    if (S.dlg) return;
    if (t.closest(".tip .cl")) { hideTip(); return; }
    const q = t.closest(".qm"); if (q) { if (q.dataset.tip) showTip(q.dataset.tip, q); else toast("기존 툴팁 (변경 없음)"); return; }
    if (!t.closest(".tip")) hideTip();
    const chip = t.closest(".chip");
    if (chip && t.closest(".ed")) { startEdit(chip.dataset.scope, +chip.dataset.f, +chip.dataset.v); return; }
    if (chip && t.closest(".ok")) { submitEdit(); return; }
    if (chip && t.closest(".cc")) { cancelEdit(); return; }
    if (chip && t.closest(".x")) { S.pop.values = S.pop.values.filter((v) => v.id !== +chip.dataset.v); paint(); return; } // POL-019
    const r = t.closest("[data-route]"); if (r) { S.route = r.dataset.route; S.pop = null; S.edit = null; paint(); return; }
    const a = t.closest("[data-act]"); if (!a) {
      const tr = t.closest("#product-table tbody tr"); if (tr && !t.matches("input")) { S.cur = +tr.dataset.p; paint(); }
      return; }
    const act = a.dataset.act;
    if (act === "reset") init();
    if (act === "noop") toast("기존 기능 (목업 미동작)");
    if (act === "create") openCreate();
    if (act === "manage") openManage(+a.dataset.f);
    if (act === "toggle") { const f = S.filters.find((x) => x.id === +a.dataset.f); f.show = !f.show; paint(); }
    if (act === "save-order") { S.pendingOrder = false; toast("순서·노출 설정 저장 (현행 하단 저장 · 목업)"); }
    if (act === "pop-close") { S.pop = null; S.edit = null; paint(); }
    if (act === "pop-register" && !a.disabled) popRegister();
    if (act === "pop-update") popUpdate();
    if (act === "bulk") { if (!S.sel.size) { toast("상품을 선택해 주세요 (목업 안내)"); return; } S.pop = { type: "bulk", fid: "", mode: "apply", a: "", b: "", name: "", chk: false }; paint(); }
    if (act === "bulk-save") bulkSave();
  });
  // 편집 영역 밖 누르면 편집 취소(POL-004). 다른 칩의 수정 아이콘도 여기서 기존 편집이 먼저 취소됨(POL-002)
  document.addEventListener("mousedown", (e) => {
    if (!S.edit || S.dlg) return;
    if (e.target.closest(".chip.editing") || e.target.closest(".dlg-wrap")) return;
    if (e.target.closest(".ed")) { S.edit = null; return; }
    cancelEdit();
  });
  document.addEventListener("keydown", (e) => {
    if (S.dlg) { if (e.key === "Enter") { e.preventDefault(); closeDialog(true); } if (e.key === "Escape") closeDialog(false); return; }
    if (e.target.closest && e.target.closest(".chip.editing") && e.key === "Enter") { e.preventDefault(); submitEdit(); return; }
    if (e.target.id === "pop-add" && e.key === "Enter") { e.preventDefault(); popAdd(e.target.value); }
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.closest(".chip.editing") && S.edit) S.edit.val = t.value;
    if (t.id === "pop-name") { S.pop.name = t.value; paint(); }
    if (t.id === "bulk-name") S.pop.name = t.value;
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.pshow != null) { S.pop.show = t.dataset.pshow === "1"; paint(); }
    if (t.dataset.cat != null) { S.pop.cats[t.dataset.cat] = t.value === "Y"; paint(); }
    if (t.dataset.mode) { S.pop.mode = t.dataset.mode; S.pop.a = ""; S.pop.b = ""; S.pop.name = ""; paint(); }
    if (t.dataset.b) { if (t.dataset.b === "chk") S.pop.chk = t.checked; else S.pop[t.dataset.b] = t.value; if (t.dataset.b === "fid") { S.pop.a = ""; S.pop.b = ""; } paint(); }
    if (t.dataset.chk) { const n = +t.dataset.chk; t.checked ? S.sel.add(n) : S.sel.delete(n); paint(); }
    if (t.dataset.act === "chk-all") { if (t.checked) S.products.forEach((p) => S.sel.add(p.no)); else S.sel.clear(); paint(); }
  });
  // 드래그 정렬(현행 유지, POL-012) — 편집 중인 칩·수정 아이콘에서는 시작하지 않음(POL-013)
  let drag = null;
  document.addEventListener("dragstart", (e) => {
    const c = e.target.closest && e.target.closest('.chip[data-scope="main"]');
    if (!c || c.classList.contains("editing") || (S.edit && +c.dataset.v === S.edit.vid)) { e.preventDefault(); return; }
    drag = { f: +c.dataset.f, v: +c.dataset.v }; c.classList.add("dragging"); e.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("mousedown", (e) => { const ed = e.target.closest(".chip .ed"); if (ed) { const c = ed.closest(".chip"); c.draggable = false; setTimeout(() => { if (c.isConnected && !c.classList.contains("editing")) c.draggable = true; }, 300); } }, true);
  document.addEventListener("dragover", (e) => {
    if (!drag) return; const c = e.target.closest && e.target.closest('.chip[data-scope="main"]');
    $$(".drop-before").forEach((x) => x.classList.remove("drop-before"));
    if (c && +c.dataset.f === drag.f) { e.preventDefault(); c.classList.add("drop-before"); }
  });
  document.addEventListener("drop", (e) => {
    if (!drag) return; const c = e.target.closest && e.target.closest('.chip[data-scope="main"]');
    if (c && +c.dataset.f === drag.f && +c.dataset.v !== drag.v) {
      e.preventDefault(); const f = S.filters.find((x) => x.id === drag.f);
      const mv = f.values.find((x) => x.id === drag.v); f.values = f.values.filter((x) => x.id !== drag.v);
      f.values.splice(f.values.findIndex((x) => x.id === +c.dataset.v), 0, mv); S.pendingOrder = true; paint(); toast("순서 변경됨 · 하단 [저장]을 눌러야 저장됩니다 (목업)");
    }
  });
  document.addEventListener("dragend", () => { drag = null; $$(".dragging,.drop-before").forEach((x) => x.classList.remove("dragging", "drop-before")); });

  /* ---------------- 화면정의서·캡처용 API ---------------- */
  window.FilterApp = {
    reset: init,
    go(route) { S.route = route; S.pop = null; S.edit = null; paint(); },
    hover(fid, vid, onIcon) { const c = $(`.chip[data-f="${fid}"][data-v="${vid}"]`); if (c) { c.classList.add("hover"); if (onIcon) c.classList.add("hover-ed"); } },
    edit(scope, fid, vid, val) { startEdit(scope, fid, vid); if (val != null) { S.edit.val = val; paint(); } },
    submit: submitEdit,
    ok() { closeDialog(true); }, cancel() { closeDialog(false); },
    tip(key) { const q = $(`[data-tip="${key}"]`); if (q) showTip(key, q); },
    dropDemo(fid, vid, beforeVid) { const a = $(`.chip[data-f="${fid}"][data-v="${vid}"]`), b = $(`.chip[data-f="${fid}"][data-v="${beforeVid}"]`); if (a) a.classList.add("dragging"); if (b) b.classList.add("drop-before"); },
    rename(fid, vid, n) { S.filters.find((f) => f.id === fid).values.find((v) => v.id === vid).n = n; paint(); },
    openCreate(preset) { openCreate(); Object.assign(S.pop, clone(preset || {})); paint(); },
    openManage,
    select(nos, cur) { S.sel = new Set(nos); if (cur) S.cur = cur; paint(); },
    openBulk(preset) { S.pop = Object.assign({ type: "bulk", fid: "", mode: "apply", a: "", b: "", name: "", chk: false }, preset || {}); paint(); },
    bulkSave,
  };

  $$(".demo [data-route]").forEach((b) => b.addEventListener("click", () => {}));
  init();
})();
