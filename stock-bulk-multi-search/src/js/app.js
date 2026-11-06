/* 재고 일괄 관리 목업 — 원본 요청 상품번호 복수 검색·검색된 상품 엑셀다운 조건 일치
   정책 번호는 사양 정의서 14장 정책 원장(POL) 기준입니다. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const PER = 10;
  const ARTICLE = [["soldout", "품절상품"], ["tempout", "일시품절상품"], ["safe", "확인요청상품"], ["stop", "판매중지상품"], ["not_use_stock", "재고사용안함상품"], ["sale", "판매상품"]];
  const FIELDS = [["brandname", "상품명"], ["keyword", "키워드"], ["brandcode", "상품코드"], ["branduid", "상품번호"], ["barcode", "상품 바코드"]];
  const SORTS = [["brandname", "제품명순"], ["moddate", "수정일순"], ["sellprice", "가격순"], ["production", "제조사순"], ["quantity", "수량순"], ["date", "진열순"]];
  const GUIDE = [
    ["red", "옵션 개별 재고를 설정한 상품은 일괄 수정이 가능하지않습니다."],
    ["", "항목 선택에서 “품절상품” 선택 후 검색 하시면 다른 조건과 함께 품절된 상품만 노출됩니다."],
    ["", "항목 선택에서 “일시품절상품” 선택 후 재고 개수에 임의의 숫자를 입력하고 검색을 하시면 해당 숫자 이하의 일시품절 상품만 조회됩니다."],
    ["", "항목 선택에서 “확인요청수량/판매중지수량” 선택 후 기간을 선택하시면 해당 기간 중 “확인요청수량/판매중지수량”에 도달하였던 상품이 조회됩니다."],
    ["", "항목 선택에서 “판매상품” 선택 후 재고 개수에 임의의 숫자를 입력하고 검색을 하시면 해당 숫자 이하의 판매중인 상품만 조회됩니다."],
    ["", "“검색 포함 전체 옵션 노출”을 체크하시면 검색된 옵션이 포함된 해당 상품의 전체 옵션이 노출됩니다."],
    ["new", "상품검색에서 “상품번호” 선택 시 쉼표(,)로 구분해 여러 상품을 한 번에 검색할 수 있습니다."],
    ["", "옵션재고는 옵션재고수정 팝업창에서 저장 버튼을 누르면 바로 적용됩니다."],
    ["", "재고수정에서 수량 입력 후 \"+,-\"를 선택하여 수정버튼 클릭하면, 현재의 상품 재고에 입력한 수량 만큼 \"+,-\"됩니다."],
    ["", "수정 중 상품 주문으로 재고 수량에 변동이 생기면, 현재 재고의 수량과 관계없이 변동된 수량에서 \"+,-\"됩니다."],
    ["", "재고수정에서 수량 입력 후 \"=\"을 선택하면, 재고수정에 입력한 수량과 상품 재고 수량이 동일하게 변경됩니다."],
    ["", "재고사용안함 상품은 \"새창\"버튼을 클릭하여, 상품수정팝업창에서 재고수정이 가능합니다."],
    ["", "재고사용안함 상품 중 \"판매/일시 품절\" 상태를 검색할 경우, '항목에 따른 선택'의 [재고 개수]를 삭제해야 상태에 맞는 상품이 검색됩니다."],
  ];

  let S;
  function init() {
    S = {
      mode: S ? S.mode : "tobe",
      products: clone(window.MOCK.products),
      form: { searchType: "CATEGORY", display: "ALL", xcode: "", mcode: "", article: "soldout", stockN: "10", yesbrand: "brandname", brandname: "", allOpt: false },
      query: null, page: 1, sort: "brandname", checked: new Set(),
    };
  }

  /* ---------- 검색 규칙 ---------- */
  // POL-001 반각·전각 쉼표 구분 / POL-002 공백 제거 / POL-003 빈 값 제외 / POL-004 숫자 아닌 값 제외 / POL-008 중복 제거
  function parseUids(text, mode) {
    if (mode === "asis") { const m = String(text).trim().match(/^\d+/); return m ? [+m[0]] : []; } // 현행: 앞쪽 숫자 하나만 사용
    const out = [];
    String(text).split(/[,，]/).map((v) => v.trim()).filter((v) => v !== "" && /^\d+$/.test(v)).forEach((v) => { if (!out.includes(+v)) out.push(+v); });
    return out;
  }
  const total = (p) => (p.options.length ? p.options.reduce((a, o) => a + (+o.s || 0), 0) : +p.stock || 0);
  function baseMatch(p, q) {
    if (q.display === "Y" && p.display !== "YES") return false;
    if (q.display === "N" && p.display !== "NO") return false;
    if (q.mcode) { if (!p.cat.includes("> " + q.mcode)) return false; }
    const t = total(p);
    switch (q.article) {
      case "soldout": if (t !== 0) return false; break;
      case "tempout": case "safe": case "stop": return false; // 예시 데이터에 해당 상태 상품 없음
      case "not_use_stock": if (p.stockUse) return false; break;
      case "sale": if (!(t > 0 && (q.stockN === "" || t <= +q.stockN))) return false; break;
    }
    return true;
  }
  function keywordMatch(p, q, uids, forExcel) {
    const v = q.brandname.trim();
    if (v === "" && q.yesbrand !== "branduid") return true;
    switch (q.yesbrand) {
      case "brandname": return p.name.includes(v);
      case "keyword": return p.keyword.split(",").some((k) => k.includes(v));
      case "brandcode":
        if (forExcel && S.mode === "asis") return p.code.startsWith(v) || String(p.uid) === v; // 현행 엑셀: 상품번호 일치까지 포함
        return p.code.startsWith(v);
      case "branduid":
        if (v === "") return true;
        if (forExcel && S.mode === "asis") return true; // 현행 엑셀: 상품번호 조건 누락
        return uids.includes(p.uid);
      case "barcode": return p.barcode === v;
    }
    return true;
  }
  function run(q, forExcel) {
    const uids = q.yesbrand === "branduid" ? parseUids(q.brandname, S.mode) : [];
    const list = S.products.filter((p) => baseMatch(p, q) && keywordMatch(p, q, uids, forExcel));
    const key = q.sort || "brandname";
    list.sort((a, b) => (key === "quantity" ? total(a) - total(b) : key === "brandname" ? a.name.localeCompare(b.name, "ko") : b.uid - a.uid));
    return list;
  }

  /* ---------- 화면 ---------- */
  const opt = (arr, cur) => arr.map(([v, t]) => '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + t + "</option>").join("");
  function articleCell(f) {
    if (f.article === "soldout") return "전체 품절 상품 노출";
    if (f.article === "tempout" || f.article === "sale") return '재고개수: <input type="text" id="f-stockN" class="w72" style="width:44px" value="' + esc(f.stockN) + '"> 이하';
    if (f.article === "safe" || f.article === "stop") return '<input type="text" class="w72" value="2026-11-04" readonly> ~ <input type="text" class="w72" value="2026-11-04" readonly>';
    return "재고사용안함 상품 노출";
  }
  function render() {
    const f = S.form, q = S.query;
    const mcats = window.MOCK.categories[0].children;
    let rows = q ? run(q, false) : [];
    const pages = Math.max(1, Math.ceil(rows.length / PER));
    if (S.page > pages) S.page = pages;
    const view = rows.slice((S.page - 1) * PER, S.page * PER);
    const guide = GUIDE.filter(([c]) => c !== "new" || S.mode === "tobe");
    $("main").innerHTML =
      '<div class="location"><b>›</b> 상품 &gt; 일괄 관리 &gt; 재고 일괄 관리</div>' +
      '<div class="page_title"><div class="page_title_text">재고 일괄 관리</div><button type="button" class="manual" data-act="noop">매뉴얼</button></div>' +
      '<div class="tab" id="tab-search">상품/옵션 재고 수량 검색</div>' +
      '<table class="control_panel" id="panel"><tbody>' +
      '<tr><th>검색</th><td>' + [["CATEGORY", "대분류별 상품"], ["MAIN", "메인진열 상품"], ["VIRTUAL", "가상 대분류별 상품"]].map(([v, t]) => '<label><input type="radio" name="stype" value="' + v + '"' + (f.searchType === v ? " checked" : "") + "> " + t + "</label>").join(" ") + "</td></tr>" +
      '<tr><th>진열 여부</th><td><select id="f-display" class="w72">' + opt([["ALL", "전체"], ["Y", "진열"], ["N", "미진열"]], f.display) + "</select></td></tr>" +
      '<tr><th>상품 분류 선택</th><td><select id="f-xcode" class="w150">' + opt([["", "대분류를 선택해주세요."], ["ALL", "전체 상품"], ["---", "분류미지정상품"], ["004", "메이크샵"]], f.xcode) + '</select> <select id="f-mcode" class="w150">' + opt([["", "중분류를 선택해주세요."]].concat(f.xcode === "004" ? mcats.map((c) => [c.name, c.name]) : []), f.mcode) + '</select> <select class="w150"><option>소분류를 선택해주세요.</option></select></td></tr>' +
      '<tr><th>항목 선택</th><td style="padding:0"><table style="width:100%;border-collapse:collapse"><tr><td style="border:0;padding:4px 10px;width:200px"><select id="f-article" class="w96">' + opt(ARTICLE, f.article) + '</select></td><th style="border-top:0;border-bottom:0;width:118px">항목에 따른 선택</th><td style="border:0;padding:4px 10px" id="article-cell">' + articleCell(f) + "</td></tr></table></td></tr>" +
      '<tr><th>상품검색</th><td><select id="f-yesbrand" class="w72" style="width:84px">' + opt(FIELDS, f.yesbrand) + '</select> <input type="text" id="f-brandname" class="w180" value="' + esc(f.brandname) + '"> <label><input type="checkbox" id="f-allopt"' + (f.allOpt ? " checked" : "") + "> 검색 포함 전체 옵션 노출</label></td></tr>" +
      "</tbody></table>" +
      '<div class="btn_area"><button type="button" class="btn-search" data-act="search">조건 검색</button></div>' +
      '<div class="list_title"><h2>상품/옵션 재고 관리</h2><div class="tools">' +
      '<button type="button" class="btn20" data-act="noop">엑셀 샘플 양식 다운</button><button type="button" class="btn20" data-act="noop">엑셀로 등록</button>' +
      '<button type="button" class="btn20" id="btn-excel" data-act="excel"' + (q ? "" : " disabled") + ">검색된 상품 엑셀다운</button>" +
      '<button type="button" class="ico-help" data-act="noop" aria-label="도움말">?</button><select class="sort" id="f-sort">' + opt(SORTS, S.sort) + "</select></div></div>" +
      '<table class="gray_default_table" id="product_list"><colgroup><col style="width:41px"><col style="width:51px"><col><col style="width:50px"><col style="width:50px"><col style="width:130px"><col style="width:170px"></colgroup><thead><tr><th><input type="checkbox" id="chk-all" aria-label="전체 선택"></th><th>이미지</th><th>제품명</th><th>진열<br>여부</th><th>현재<br>재고</th><th>재고수정</th><th>옵션별 재고</th></tr></thead><tbody>' +
      (view.length ? view.map(rowHtml).join("") : '<tr><td colspan="7" class="empty">조건에 맞는 검색 결과가 없습니다.</td></tr>') +
      "</tbody></table>" +
      (view.length ? '<div class="list_bottom"><label><input type="checkbox" data-act="chk-page"> 현재 페이지 상품 선택</label><span>선택 상품 진열여부 설정 : <select id="bulk-display"><option value="">선택</option><option value="YES">진열</option><option value="NO">미진열</option></select> <button type="button" class="sbtn" data-act="bulk-display">적용</button></span></div>' +
        '<div class="paging" id="paging"><button type="button" data-page="' + (S.page - 1) + '"' + (S.page === 1 ? " disabled" : "") + ">‹ 이전</button>" + Array.from({ length: pages }, (_, i) => '<button type="button" data-page="' + (i + 1) + '"' + (i + 1 === S.page ? ' class="on"' : "") + ">" + (i + 1) + "</button>").join("") + '<button type="button" data-page="' + (S.page + 1) + '"' + (S.page === pages ? " disabled" : "") + ">다음 ›</button></div>" +
        '<div class="ctrl-btn"><button type="button" class="btn-prd-del" data-act="del">상품삭제</button></div>' : "") +
      '<ul class="guide" id="guide">' + guide.map(([c, t]) => '<li class="' + c + '">' + esc(t) + "</li>").join("") + "</ul>";
    const all = $("chk-all");
    if (all) all.checked = view.length > 0 && view.every((p) => S.checked.has(p.uid));
  }
  function rowHtml(p) {
    const t = total(p), hasOpt = p.options.length > 0;
    const edit = hasOpt ? "" : '<span class="stock-edit"><input type="text" inputmode="numeric" data-edit="' + p.uid + '" aria-label="재고수정 수량"><select data-op="' + p.uid + '"><option>+</option><option>-</option><option>=</option></select><button type="button" class="sbtn" data-act="stock-save" data-uid="' + p.uid + '">수정</button></span>';
    const optCell = hasOpt ? '<div class="optrow">' + p.options.map((o) => "<b>" + esc(o.v) + '</b> : <span class="' + (o.s ? "" : "zero") + '">' + o.s + "</span>").join("<br>") + '</div><button type="button" class="sbtn" style="margin-top:3px" data-act="opt-pop" data-uid="' + p.uid + '">옵션재고수정</button>' : "";
    return '<tr data-uid="' + p.uid + '"><td><input type="checkbox" data-chk="' + p.uid + '"' + (S.checked.has(p.uid) ? " checked" : "") + ' aria-label="' + esc(p.name) + ' 선택"></td><td><span class="thumb">IMG</span></td>' +
      '<td class="l"><span class="newwin" data-act="noop">새창</span>' + esc(p.name) + ' <span class="uid">(' + p.uid + ')</span><div class="loc">위치 : ' + esc(p.cat) + "</div></td>" +
      "<td>" + p.display + "</td><td>" + t + "</td><td>" + edit + "</td><td>" + optCell + "</td></tr>";
  }

  /* ---------- 모달·토스트 ---------- */
  let toastTimer;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200); }
  function modal(title, body, foot) {
    $("pop").innerHTML = '<div class="overlay" data-act="close-bg"><div class="win" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="hd">' + esc(title) + '<button type="button" data-act="close" aria-label="닫기">×</button></div><div class="bd">' + body + '</div><div class="ft">' + (foot || '<button type="button" class="sbtn" data-act="close">닫기</button>') + "</div></div></div>";
    const first = $("pop").querySelector("input,button"); if (first) first.focus();
  }
  function closeModal() { $("pop").innerHTML = ""; }
  function excelPreview() {
    const q = S.query; const screen = run(q, false), file = run(q, true);
    const extra = file.filter((p) => !screen.includes(p));
    const lines = [];
    file.forEach((p) => { if (p.options.length) p.options.forEach((o) => lines.push([p, o.v, o.s])); else lines.push([p, "", p.stock]); });
    modal("검색된 상품 엑셀다운",
      '<div class="review">검토용 미리보기입니다. 실제 화면에서는 이 창 없이 엑셀(xml) 파일을 바로 내려받습니다.</div>' +
      "<p style=\"margin:0 0 8px\">화면 목록 <b>" + screen.length + "</b>개 · 파일에 들어가는 상품 <b id=\"xl-count\">" + file.length + "</b>개 · 행 " + lines.length + "개</p>" +
      (extra.length ? '<p style="margin:0 0 8px;color:#d33" id="xl-extra">화면에 없는 상품 ' + extra.length + "개가 파일에 들어갑니다(현행 동작).</p>" : "") +
      '<table id="xl-table"><thead><tr><th>product_uid</th><th>상품명</th><th>옵션 조합 값</th><th>옵션별 재고</th></tr></thead><tbody>' +
      lines.map(([p, v, s]) => "<tr" + (extra.includes(p) ? ' style="background:#fff1f1"' : "") + "><td>" + p.uid + '</td><td class="l">' + esc(p.name) + "</td><td>" + esc(v) + "</td><td>" + s + "</td></tr>").join("") +
      "</tbody></table><p class=\"note\">파일 형식(xml)·열·정렬은 현행과 같습니다.</p>",
      '<button type="button" class="btn-search" style="width:auto;padding:0 28px 0 14px" data-act="xl-done">내려받기</button> <button type="button" class="sbtn" data-act="close">닫기</button>');
  }
  function optPopup(uid) {
    const p = S.products.find((x) => x.uid === uid);
    modal("옵션재고수정",
      '<p style="margin:0 0 8px"><b>' + esc(p.name) + "</b> (" + p.uid + ")</p><table><thead><tr><th>옵션</th><th>현재 재고</th><th>변경 재고</th></tr></thead><tbody>" +
      p.options.map((o, i) => '<tr><td class="l">' + esc(o.v) + "</td><td>" + o.s + '</td><td><input type="text" inputmode="numeric" data-ostock="' + i + '" value="' + o.s + '" style="width:60px;text-align:right" aria-label="' + esc(o.v) + ' 변경 재고"></td></tr>').join("") +
      '</tbody></table><p class="note" id="opt-err" style="color:#d33" hidden>재고는 0 이상의 숫자로 입력해 주세요.</p>',
      '<button type="button" class="btn-search" style="width:auto;padding:0 28px 0 14px" data-act="opt-save" data-uid="' + uid + '">저장</button> <button type="button" class="sbtn" data-act="close">닫기</button>');
  }

  /* ---------- 이벤트 ---------- */
  function readForm() {
    const f = S.form, g = (id) => $(id);
    const r = document.querySelector('input[name="stype"]:checked'); if (r) f.searchType = r.value;
    f.display = g("f-display").value; f.xcode = g("f-xcode").value; f.mcode = g("f-mcode").value; f.article = g("f-article").value;
    if (g("f-stockN")) f.stockN = g("f-stockN").value;
    f.yesbrand = g("f-yesbrand").value; f.brandname = g("f-brandname").value; f.allOpt = g("f-allopt").checked;
  }
  function doSearch() { readForm(); S.query = Object.assign({}, S.form, { sort: S.sort }); S.page = 1; S.checked.clear(); render(); }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act],[data-page],[data-mode]");
    if (!t) return;
    if (t.dataset.mode) { S.mode = t.dataset.mode; document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b === t)); if (S.query) S.query = Object.assign({}, S.query); render(); toast(S.mode === "tobe" ? "개선 후 동작으로 보고 있습니다." : "현행 동작으로 보고 있습니다."); return; }
    if (t.dataset.page) { const n = +t.dataset.page; if (n >= 1) { S.page = n; render(); } return; }
    const act = t.dataset.act;
    if (act === "close-bg" && e.target !== t) return;
    switch (act) {
      case "search": doSearch(); break;
      case "excel": if (S.query) excelPreview(); break;
      case "xl-done": closeModal(); toast("검색된 상품 엑셀 파일을 내려받았습니다(목업)."); break;
      case "close": case "close-bg": closeModal(); break;
      case "noop": toast("목업에서는 동작하지 않는 기능입니다."); break;
      case "reset": init(); closeModal(); render(); toast("예시 데이터를 처음 상태로 되돌렸습니다."); break;
      case "opt-pop": optPopup(+t.dataset.uid); break;
      case "opt-save": {
        const p = S.products.find((x) => x.uid === +t.dataset.uid);
        const ins = [...document.querySelectorAll("[data-ostock]")];
        const bad = ins.filter((i) => !/^\d+$/.test(i.value.trim()));
        ins.forEach((i) => { i.style.borderColor = bad.includes(i) ? "#d33" : ""; });
        if (bad.length) { $("opt-err").hidden = false; return; }
        ins.forEach((i) => { p.options[+i.dataset.ostock].s = +i.value.trim(); });
        closeModal(); render(); toast("옵션재고를 저장했습니다."); break;
      }
      case "stock-save": {
        const uid = +t.dataset.uid, p = S.products.find((x) => x.uid === uid);
        const inp = document.querySelector('[data-edit="' + uid + '"]'), op = document.querySelector('[data-op="' + uid + '"]').value;
        const v = inp.value.trim();
        if (!/^\d+$/.test(v)) { inp.classList.add("err"); toast("재고수정 수량은 숫자로 입력해 주세요."); inp.focus(); return; }
        p.stock = op === "=" ? +v : op === "+" ? p.stock + +v : p.stock - +v;
        render(); toast(p.name + " 재고를 " + p.stock + "개로 수정했습니다."); break;
      }
      case "bulk-display": {
        const v = $("bulk-display").value;
        if (!S.checked.size) { toast("진열여부를 바꿀 상품을 선택해 주세요."); return; }
        if (!v) { toast("진열여부를 선택해 주세요."); return; }
        S.products.forEach((p) => { if (S.checked.has(p.uid)) p.display = v; });
        render(); toast("선택한 상품 " + S.checked.size + "개의 진열여부를 바꿨습니다."); break;
      }
      case "chk-page": { const on = t.checked; document.querySelectorAll("[data-chk]").forEach((c) => { c.checked = on; S.checked[on ? "add" : "delete"](+c.dataset.chk); }); break; }
      case "del": toast(S.checked.size ? "목업에서는 상품을 삭제하지 않습니다." : "삭제할 상품을 선택해 주세요."); break;
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.id === "f-xcode" || el.id === "f-article") { readForm(); if (el.id === "f-xcode") S.form.mcode = ""; render(); return; }
    if (el.id === "f-sort") { S.sort = el.value; if (S.query) S.query.sort = S.sort; render(); return; }
    if (el.id === "chk-all") { document.querySelectorAll("[data-chk]").forEach((c) => { c.checked = el.checked; S.checked[el.checked ? "add" : "delete"](+c.dataset.chk); }); return; }
    if (el.dataset.chk) { S.checked[el.checked ? "add" : "delete"](+el.dataset.chk); return; }
  });
  document.addEventListener("input", (e) => { if (e.target.dataset.edit) e.target.classList.remove("err"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("pop").innerHTML) closeModal();
    if (e.key === "Enter" && e.target.id === "f-brandname") doSearch();
  });

  init(); render();
  window.StockApp = {
    set(form) { Object.assign(S.form, form); render(); },
    search(form) { if (form) Object.assign(S.form, form); render(); doSearch(); },
    mode(m) { S.mode = m; document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === m)); render(); },
    excel: excelPreview, optPopup, render, parseUids,
  };
})();
