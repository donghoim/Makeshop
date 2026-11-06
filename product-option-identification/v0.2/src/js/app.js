// 옵션코드 목업 화면: 전체 상품 관리·삭제 상품 조회·상품 등록/수정·옵션 팝업 3종·재고 일괄 관리·재입고 알림 관리
(function () {
  'use strict';
  const M = window.OptModel;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const won = (n) => Number(n || 0).toLocaleString('ko-KR');
  const HELP = '상품 저장이 완료되면 옵션코드가 자동으로 부여됩니다. 발급된 코드는 수정할 수 없으며, 운영자가 입력하는 관리코드와 다릅니다.';
  const help = (tip) => '<span class="help" tabindex="0" data-tip="' + esc(tip || HELP) + '">?</span>';
  const qhelp = '<span class="help" tabindex="0" data-tip="기존 화면의 도움말입니다.">?</span>';

  let db, alerts, nextUid, view = 'list', savedRef = null, draft = null, pop = null, toastTimer;
  const search = { list: { key: '상품명', val: '' }, del: { key: '상품명', val: '' }, stock: { key: '상품명', val: '', done: false }, restock: { key: '상품명', val: '' } };

  function init() {
    db = M.clone(window.OPT_MOCK.products);
    alerts = M.clone(window.OPT_MOCK.alerts);
    nextUid = window.OPT_MOCK.nextUid;
    Object.keys(search).forEach((k) => Object.assign(search[k], { key: '상품명', val: '', done: false }));
  }
  function toast(t) { clearTimeout(toastTimer); $('toast').textContent = t; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200); }
  const product = (uid) => db.find((p) => p.uid === uid);

  // 옵션코드 칸: 발급값은 읽기 전용 텍스트, 저장 전은 비활성 "자동생성", 보정 전 기존 상품은 빈 값
  function codeCell(code, p) {
    if (code) return '<span class="code">' + esc(code) + '</span>';
    if (p && p.state !== 'draft' && !p.assigned) return '';
    return '<input class="code-auto" placeholder="자동생성" disabled aria-label="옵션코드 자동생성 예정">';
  }
  function optionSummary(p) {
    const k = M.kindOf(p);
    let s = p.optionUse === 'N' ? '옵션 없음'
      : k === 'combo' ? (p.base.rows.length ? '조합옵션 ' + p.base.rows.length + '개' : '옵션 미등록')
      : k === 'hybrid' ? '하이브리드 ' + p.hybrid.groups.reduce((a, g) => a + g.values.length, 0) + '개'
      : '미조합 옵션';
    if (p.indivUse === 'Y') s += ' · 개별옵션 ' + p.indiv.rows.length + '개';
    return s;
  }
  const stockOf = (p) => {
    const k = M.kindOf(p);
    if (k === 'combo') return p.base.rows.reduce((a, r) => a + (+r.stock || 0), 0);
    if (k === 'hybrid') return p.hybrid.groups.reduce((a, g) => a + g.values.reduce((b, v) => b + (+v.stock || 0), 0), 0);
    return +p.stock || 0;
  };

  // ---------- 라우팅 ----------
  // 화면정의서에 내장될 때는 SPEC_MODE.hash로 이동합니다(iframe srcdoc에서는 location.hash를 쓰지 않음).
  const curHash = () => (window.SPEC_MODE ? window.SPEC_MODE.hash : location.hash);
  function nav(h) { if (window.SPEC_MODE) { window.SPEC_MODE.hash = '#' + h; route(); } else location.hash = h; }
  function route() {
    const h = curHash().replace('#', '') || 'list';
    const [v, uid] = h.split('/');
    view = ['list', 'del', 'reg', 'edit', 'stock', 'restock'].includes(v) ? v : 'list';
    if (view === 'edit') { savedRef = product(uid); if (!savedRef) { nav('list'); return; } draft = M.clone(savedRef); }
    else if (view === 'reg') { savedRef = null; draft = M.emptyProduct(); }
    pop = null;
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === (view === 'edit' ? 'list' : view)));
    const html = { list: () => renderList(false), del: () => renderList(true), reg: renderProduct, edit: renderProduct, stock: renderStock, restock: renderRestock }[view]();
    $('main').innerHTML = html;
    renderPop();
  }
  const head = (path, title, desc) => '<div class="page"><div class="crumb"><b>›</b>' + path + '</div><div class="ptitle"><h2>' + title + '</h2><p>' + desc + '</p></div>';

  // ---------- 전체 상품 관리 / 삭제 상품 조회 ----------
  const LIST_KEYS = ['상품명', '상품코드', '상품번호', '옵션코드', '바코드', '모델명', '사입명', '브랜드명', '제조사명', '원산지', '상품 검색어', '사입업체', '추가 상품명', '영문 상품명', '상품명+사입명', '매칭상품명', '피팅 모델명', '복합 검색', '스타일코드'];
  function keySelect(id, keys, cur) {
    return '<select id="' + id + '">' + keys.map((k) => '<option' + (k === cur ? ' selected' : '') + (k === '옵션코드' ? ' class="newopt"' : '') + '>' + k + '</option>').join('') + '</select>';
  }
  function matches(p, key, val) {
    const q = val.trim();
    if (!q) return true;
    if (key === '옵션코드') return M.codesOf(p).some((c) => c.code === q);
    if (key === '상품번호') return p.uid === q;
    return p.name.includes(q);
  }
  function renderList(del) {
    const s = search[del ? 'del' : 'list'];
    const rows = db.filter((p) => p.state === (del ? 'deleted' : 'active') && matches(p, s.key, s.val));
    return head('상품 &gt; 상품 관리 &gt; ' + (del ? '삭제 상품 조회' : '전체 상품 관리'), del ? '삭제 상품 조회' : '전체 상품 관리', del ? '삭제한 상품을 조회하고 복구할 수 있습니다.' : '상품 리스트를 검색/수정 하실 수 있습니다.') +
      '<span class="stab">상품리스트 검색</span><table class="ftable searchbox"><tbody>' +
      '<tr><th>상품 상태</th><td><label><input type="radio" name="pst" checked>전체</label><label><input type="radio" name="pst">진열</label><label><input type="radio" name="pst">미진열</label></td></tr>' +
      '<tr><th>분류선택</th><td><select><option>대분류를 선택해 주세요.</option></select> <select><option>중분류를 선택해 주세요.</option></select> <select><option>소분류를 선택해 주세요.</option></select></td></tr>' +
      '<tr><th>상품 검색</th><td>' + keySelect('skey', LIST_KEYS, s.key) + ' <input id="sval" style="width:260px" value="' + esc(s.val) + '" placeholder="' + (s.key === '옵션코드' ? '예: 1100006925-0005' : '') + '"></td></tr>' +
      '</tbody></table><div class="center"><button class="bbtn lg" data-act="search" data-s="' + (del ? 'del' : 'list') + '">검 색</button></div>' +
      '<div class="result-head"><span>총 <b>' + rows.length + '</b>개 상품</span>' + (s.val ? '<button class="sbtn" data-act="search-clear" data-s="' + (del ? 'del' : 'list') + '">검색 초기화</button>' : '') + '</div>' +
      '<table class="ltable"><thead><tr><th style="width:30px"><input type="checkbox"></th><th style="width:56px">이미지</th><th>상품명</th><th style="width:150px">옵션</th><th style="width:80px">판매가</th><th style="width:60px">재고</th><th style="width:100px">등록일</th><th style="width:96px">관리</th></tr></thead><tbody>' +
      (rows.length ? rows.map((p) => '<tr><td><input type="checkbox"></td><td><span class="noimg">No<br>Image</span></td><td class="l"><span class="badge' + (p.display === '진열' ? '' : ' off') + '">' + esc(p.display || '진열') + '</span><span class="uid">(' + p.uid + ')</span><br>' +
        (del ? '<b>' + esc(p.name) + '</b>' : '<span class="pname" data-act="edit" data-uid="' + p.uid + '">' + esc(p.name) + '</span>') + '</td><td class="sub">' + esc(optionSummary(p)) + '</td><td>' + won(p.price) + '</td><td>' + stockOf(p) + '</td><td class="sub">' + esc((p.created || '').slice(0, 10)) + '</td><td>' +
        (del ? '<button class="sbtn" data-act="restore" data-uid="' + p.uid + '">복구</button>' : '<button class="sbtn" data-act="edit" data-uid="' + p.uid + '">수정</button> <button class="sbtn red" data-act="delete" data-uid="' + p.uid + '">삭제</button>') + '</td></tr>').join('')
        : '<tr><td colspan="8" class="empty">검색된 상품이 없습니다.</td></tr>') + '</tbody></table></div>';
  }

  // ---------- 상품 등록 / 수정 ----------
  function baseSummary(p) {
    if (p.optionUse === 'H') { const n = p.hybrid.groups.reduce((a, g) => a + g.values.length, 0); return n ? '하이브리드 옵션 ' + p.hybrid.groups.length + '개 항목 · 옵션값 ' + n + '개' : '등록된 옵션이 없습니다.'; }
    if (p.mode === 'nocombo' && p.base.opts.length) return '미조합 옵션 (' + p.base.opts.map((o) => o.name).join(', ') + ')';
    if (p.base.rows.length) return '조합옵션 ' + p.base.rows.length + '개 (' + p.base.heads.join(' × ') + ')';
    return '등록된 옵션이 없습니다.';
  }
  function summaryBox(p) {
    const simple = M.kindOf(p) === 'simple';
    return '<div class="summary"><h3>등록상품 수정</h3>' +
      '<div>- 최초 등록 일시 : ' + esc(p.created) + '</div><div>- 최근 수정 일시 : ' + esc(p.updated || p.created) + '</div>' +
      '<div>- 최초 등록 : 관리자</div><div>- 최종 수정 : 관리자</div>' +
      '<div>- 상품분류 : 메이크샵(대) &gt; 상의(중)</div><div>- 상 품 코 드 : 004003000' + p.uid.slice(-3) + '</div>' +
      '<div>- 상 품 번 호 : ' + p.uid + '</div><div>- 상품 바코드 : </div>' +
      (simple ? '<div class="code-line">- 옵 션 코 드 : ' + (p.simple.code ? '<span class="code">' + esc(p.simple.code) + '</span>' : p.assigned ? '<input class="code-auto" placeholder="자동생성" disabled>' : '') + help() + '</div>' : '') +
      '</div>';
  }
  function renderProduct() {
    const p = draft, isEdit = view === 'edit';
    const radio = (name, val, label, cur) => '<label><input type="radio" name="' + name + '" value="' + val + '"' + (cur === val ? ' checked' : '') + '>' + label + '</label>';
    return head('상품 &gt; 상품 관리 &gt; ' + (isEdit ? '상품 수정' : '상품 등록'), isEdit ? '상품 수정' : '상품 등록', isEdit ? '등록된 상품 정보를 수정 하실 수 있습니다.' : '쇼핑몰에서 판매할 상품을 신규 등록 하실 수 있습니다.') +
      (isEdit ? '<div class="tabs" style="margin-bottom:10px"><span class="on">기본정보</span><span>노출설정</span><span>옵션/추가구성상품</span><span>관련상품</span><span>이미지</span><span>상세정보</span></div>' + summaryBox(savedRef)
        : '<div class="sec">상품 기본 정보</div><div class="tabs"><span class="on">기본상품 등록</span><span>세트상품 등록</span><span>묶음상품 등록</span></div>') +
      '<table class="ftable"><tbody>' +
      '<tr><th class="req">기본 상품명</th><td><input id="f-name" style="width:96%" value="' + esc(p.name) + '"></td></tr>' +
      '<tr><th class="req">가격설정</th><td>판매가격 <input id="f-price" type="number" min="0" style="width:120px" value="' + esc(p.price) + '"> 원 <span class="muted">쇼핑몰에 실제 판매할 가격</span></td></tr>' +
      '<tr><th class="req">재고설정</th><td>수량 <input id="f-stock" type="number" min="0" style="width:80px" value="' + esc(p.stock) + '"> 개 <div class="note">- 옵션별 재고를 사용하면 옵션 팝업의 재고가 적용됩니다.</div></td></tr>' +
      '</tbody></table>' +
      '<div class="sec">기본옵션설정 <small>스마트픽업과 동시에 사용할 수 없습니다.</small></div><table class="ftable"><tbody>' +
      '<tr><th>기본옵션 사용여부 ' + qhelp + '</th><td>' + radio('ouse', 'Y', '기본 옵션 사용함', p.optionUse) + radio('ouse', 'H', '하이브리드 옵션 사용함', p.optionUse) + radio('ouse', 'M', '다중 상품 옵션 불러오기', p.optionUse) + radio('ouse', 'N', '사용안함', p.optionUse) + '</td></tr>' +
      (p.optionUse !== 'N' ? '<tr><th>기본옵션 선택</th><td><button class="bbtn" data-act="open-' + (p.optionUse === 'H' ? 'hybrid' : 'base') + '">옵션등록/수정</button><span class="muted">' + esc(baseSummary(p)) + '</span></td></tr>' : '') +
      '</tbody></table>' +
      '<div class="sec">개별옵션설정</div><table class="ftable"><tbody>' +
      '<tr><th>개별옵션 사용여부 ' + qhelp + '</th><td>' + radio('iuse', 'Y', '사용함', p.indivUse) + radio('iuse', 'N', '사용안함', p.indivUse) + '</td></tr>' +
      (p.indivUse === 'Y' ? '<tr><th>개별옵션 선택</th><td><button class="bbtn" data-act="open-indiv">옵션등록/수정</button><span class="muted">' + (p.indiv.rows.length ? '개별옵션 ' + p.indiv.rows.length + '개' : '등록된 옵션이 없습니다.') + '</span></td></tr>' : '') +
      '</tbody></table><p class="err" id="perr" hidden></p>' +
      '<div class="center"><button class="bbtn lg" data-act="save-product">' + (isEdit ? '상품수정' : '상품등록') + '</button>' + (isEdit ? '<button class="bbtn lg gray" data-act="go-list">목록</button>' : '') + '</div></div>';
  }
  function syncFields() {
    if (!$('f-name') || !draft) return;
    draft.name = $('f-name').value; draft.price = $('f-price').value; draft.stock = $('f-stock').value;
  }
  function saveProduct() {
    syncFields();
    try { M.validate(draft); } catch (e) { $('perr').textContent = e.message; $('perr').hidden = false; return; }
    if (view === 'reg') {
      const p = M.commit(null, draft, 'all', String(nextUid++));
      p.display = '진열';
      db.unshift(p);
      toast('상품이 등록되었습니다. 상품 수정 화면에서 발급된 옵션코드를 확인할 수 있습니다.');
      nav('edit/' + p.uid);
    } else {
      const p = M.commit(savedRef, draft, 'all');
      replace(p);
      toast('상품이 수정되었습니다.');
      render();
    }
  }
  function replace(p) {
    const i = db.findIndex((x) => x.uid === p.uid);
    db[i] = p; savedRef = p;
    const keep = { name: draft.name, price: draft.price, stock: draft.stock };
    draft = Object.assign(M.clone(p), keep);
  }
  // 팝업 저장: 기존 상품은 바로 저장·발급, 신규 상품은 상품등록 때 발급
  function applyPopup(scope) {
    if (savedRef) { replace(M.commit(savedRef, draft, scope)); toast('저장되었습니다.'); }
    else toast('옵션이 적용되었습니다. 상품등록을 완료하면 옵션코드가 발급됩니다.');
    pop = null; render();
  }

  // ---------- 기본옵션 팝업(neoproduct_option.html) ----------
  function openBase() {
    syncFields();
    pop = { type: 'base', mode: draft.optionUse === 'Y' ? draft.mode : 'combo', base: M.clone(draft.base), orig: M.clone(draft.base), err: '' };
    render();
  }
  function renderBase() {
    const w = pop, b = w.base, p = draft;
    const optRows = b.opts.map((o, i) => '<tr><td><span class="ibtn" style="display:inline-block">↕</span></td>' +
      '<td><input type="checkbox" data-o="' + i + '" data-k="req"' + (o.req ? ' checked' : '') + '></td><td><input type="checkbox" data-o="' + i + '" data-k="combo"' + (o.combo ? ' checked' : '') + '></td>' +
      '<td class="w110"><input data-o="' + i + '" data-k="name" value="' + esc(o.name) + '"></td><td style="width:34%"><input data-o="' + i + '" data-k="valuesText" value="' + esc(o.valuesText) + '" placeholder="예: 블랙,화이트"></td>' +
      '<td style="width:26%"><div style="display:flex;gap:3px"><input data-o="' + i + '" data-k="pricesText" value="' + esc(o.pricesText) + '" placeholder="예: 0,1000"><select><option>중복부과</option><option>단일부과</option></select></div></td>' +
      '<td class="w80"><input data-o="' + i + '" data-k="scode" value="' + esc(o.scode) + '"></td><td><select data-o="' + i + '" data-k="use"><option' + (o.use === 'Y' ? ' selected' : '') + '>Y</option><option' + (o.use === 'N' ? ' selected' : '') + '>N</option></select></td>' +
      '<td><input type="checkbox" data-o="' + i + '" data-k="oneclick"' + (o.oneclick ? ' checked' : '') + '></td><td><button class="ibtn minus" data-act="b-del" data-i="' + i + '">−</button></td></tr>').join('');
    const combined = w.mode === 'combo' && b.rows.length;
    const rows = M.sortByCode(b.rows);
    const st = (r) => '<select data-r="' + r.id + '" data-k="status">' + ['판매', '품절', '숨김'].map((x) => '<option' + (r.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>';
    return '<div class="win"><button class="win-x" data-act="pop-close" aria-label="닫기">✕</button><div class="ptop">상품옵션 등록/수정</div><div class="pbody">' +
      '<div class="sec">옵션 설정<span class="r"><button class="sbtn" data-act="noop">다중 상품 옵션 불러오기</button> <button class="sbtn" data-act="noop">다른 상품 옵션 정보가져오기</button></span></div>' +
      '<table class="ptable"><thead><tr><th style="width:28px"></th><th>필수</th><th>조합</th><th>옵션명</th><th>옵션값</th><th>옵션가격 ' + qhelp + '</th><th>재고관리 코드</th><th>사용</th><th>원클릭</th><th><button class="ibtn" data-act="b-add" aria-label="옵션 항목 추가">+</button></th></tr></thead><tbody>' +
      (optRows || '<tr><td colspan="10" class="empty">항목이 없습니다. 옵션 항목을 추가해 주세요.</td></tr>') + '</tbody></table>' +
      '<div class="rowtools"><span><select style="width:190px"><option>저장옵션 선택</option></select> <button class="sbtn" data-act="noop">옵션적용</button> <button class="sbtn" data-act="noop">저장옵션관리</button></span><span><input style="width:130px"> <button class="sbtn" data-act="noop">현재옵션저장</button> <button class="sbtn" data-act="b-add">옵션 항목 추가</button></span></div>' +
      '<ul class="pnote"><li>전체 옵션 개수는 30개까지 설정 가능하며, 조합은 10개까지 가능합니다.</li><li>설정된 순서대로 옵션이 노출됩니다.</li><li>옵션값과 옵션가격의 구분자는 콤마(,)입니다. (옵션값의 콤마(,) 개수와 옵션가격의 콤마(,) 개수는 일치해야 합니다.)</li><li>조합된 옵션 사용 여부는 "옵션 재조합"으로 조합을 다시 하거나 조합된 옵션상에서 설정하시기 바랍니다.</li></ul>' +
      '<div class="center">' + (combined ? '<button class="bbtn" data-act="b-combine">옵션 재조합</button>' : '<button class="bbtn" data-act="b-combine">선택된 옵션 조합하기</button><button class="bbtn" data-act="b-nocombo">조합 없이 옵션 적용</button>') + '</div>' +
      (w.mode === 'nocombo' && b.opts.length ? '<div class="msg-ok">조합 없이 옵션이 적용되었습니다. 미조합 옵션은 상품 단위로 재고를 관리합니다. 옵션코드는 상품 수정 화면 상단 요약에서 확인할 수 있습니다.</div>' : '') +
      (combined ? '<hr class="sep"><div class="optset"><div><b>옵션 출력 방식 선택</b> <label><input type="radio" name="otype">일체형(옵션 항목이 하나의 선택박스에 출력)</label> <label><input type="radio" name="otype" checked>분리형(옵션항목이 다수의 선택박스에 출력)</label></div>' +
        '<div><b>옵션 재고 관리 선택</b> <label><input type="radio" name="ostk">재고 사용 안함</label> <label><input type="radio" name="ostk" checked>재고 사용</label></div><div><b>옵션별 주문한도 설정</b> <label><input type="radio" name="olim" checked>미사용</label> <label><input type="radio" name="olim">사용</label></div></div>' +
        '<div class="sec" style="margin-top:4px">옵션 조합 확인 및 관리<span class="r"><button class="sbtn" data-act="noop">조합 옵션 기본 설정</button></span></div>' +
        '<div class="bulkbar">일괄처리: 선택항목의 <select id="bulk-k"><option value="price">옵션가격</option><option value="stock">재고</option><option value="status">상태</option></select><input id="bulk-v" style="width:180px"><button class="sbtn" data-act="b-bulk">적용</button></div>' +
        '<div class="listwrap"><table class="ptable" style="border-top:0"><thead><tr><th style="width:30px"><input type="checkbox" data-act="chk-all"></th>' + b.heads.map((h) => '<th>' + esc(h) + '</th>').join('') +
        '<th>옵션가격</th><th>재고 ' + qhelp + '</th><th>상태 ' + qhelp + '</th><th class="blue">판매중지수량 ' + qhelp + '</th><th>주문 ' + qhelp + '</th><th class="blue">확인요청수량 ' + qhelp + '</th><th class="code-col">옵션코드 ' + help() + '</th><th>관리코드 ' + qhelp + '</th><th>비고 ' + qhelp + '</th></tr></thead><tbody>' +
        rows.map((r) => '<tr' + (!r.code && p.assigned ? ' class="new-row"' : '') + '><td><input type="checkbox" class="rowchk" data-id="' + r.id + '"></td>' + r.labels.map((l) => '<td class="l">' + esc(l) + '</td>').join('') +
          '<td><input type="number" class="w80" data-r="' + r.id + '" data-k="price" value="' + esc(r.price) + '"></td><td><input type="number" class="w60" data-r="' + r.id + '" data-k="stock" value="' + esc(r.stock) + '"></td><td>' + st(r) + '</td>' +
          '<td><select><option>사용</option></select> 0</td><td>0</td><td><select><option>사용</option></select> 0</td><td class="code-col">' + codeCell(r.code, p) + '</td>' +
          '<td><input class="w110" data-r="' + r.id + '" data-k="mcode" value="' + esc(r.mcode) + '"></td><td><input class="w110" data-r="' + r.id + '" data-k="memo" value="' + esc(r.memo) + '"></td></tr>').join('') +
        '</tbody></table></div><div class="rowtools"><span><button class="sbtn red" data-act="b-delrows">선택옵션삭제</button> <button class="sbtn" data-act="b-addrow">옵션추가</button> <button class="sbtn" data-act="noop">항목숨기기</button></span></div>' +
        '<ul class="pnote"><li>설정된 순서대로 옵션이 노출됩니다.</li><li>옵션항목 추가/수정/삭제를 원하는경우, <span style="color:#e60012">[통합옵션 매뉴얼 필독]</span></li></ul>' : '') +
      (w.err ? '<p class="err">' + esc(w.err) + '</p>' : '') +
      '<div class="center"><button class="bbtn" data-act="b-save">저 장</button><button class="bbtn" data-act="noop">미리보기</button><button class="bbtn" data-act="pop-close">닫 기</button></div></div></div>';
  }
  // 저장 직전 검증: 입력 중 오류가 남았거나(중복 옵션값) 재조합 후 옵션값을 바꿨으면 저장하지 않습니다.
  function checkOpts(opts, origOpts, rows) {
    for (const o of opts) M.setOptionValues(o, o.valuesText, o.pricesText, (origOpts.find((x) => x.id === o.id) || {}).vals);
    const ids = new Set(opts.flatMap((o) => o.vals.map((v) => v.id)));
    if (rows.some((r) => r.key.split('_').some((k) => !ids.has(k)))) throw Error('옵션값이 바뀌었습니다. [옵션 재조합]을 눌러 주세요.');
  }
  function saveBase() {
    const w = pop;
    try { checkOpts(w.base.opts, w.orig.opts, w.mode === 'combo' ? w.base.rows : []); } catch (err) { w.err = err.message; return render(); }
    if (w.mode === 'combo' && !w.base.rows.length) { w.err = '[선택된 옵션 조합하기]로 옵션을 조합해 주세요.'; return render(); }
    if (w.mode === 'nocombo' && !w.base.opts.some((o) => o.vals.length)) { w.err = '옵션명과 옵션값을 입력해 주세요.'; return render(); }
    draft.optionUse = 'Y'; draft.mode = w.mode; draft.base = w.base;
    applyPopup('base');
  }

  // ---------- 하이브리드 옵션 팝업(neoproduct_hybrid_option.html) ----------
  function openHybrid() {
    syncFields();
    const h = M.clone(draft.hybrid);
    if (!h.groups.length) h.groups.push(M.newGroup());
    pop = { type: 'hybrid', h, orig: M.clone(draft.hybrid), err: '' };
    render();
  }
  function renderHybrid() {
    const h = pop.h, p = draft, stk = h.stockUse === 'Y';
    const groups = h.groups.map((g, gi) => '<tr><td style="text-align:center"><div class="mv"><button data-act="h-up" data-g="' + gi + '"' + (gi === 0 ? ' disabled' : '') + ' aria-label="위로">▲</button><button data-act="h-down" data-g="' + gi + '"' + (gi === h.groups.length - 1 ? ' disabled' : '') + ' aria-label="아래로">▼</button></div></td>' +
      '<td style="text-align:center"><input type="checkbox" class="gsel" data-g="' + gi + '"></td><td><div class="gname"><button class="rbtn" data-act="h-addval" data-g="' + gi + '" aria-label="옵션값 추가">+</button><span>옵션명</span><input data-g="' + gi + '" data-k="name" value="' + esc(g.name) + '"><span>구매조건 설정 &nbsp;최소 <input style="width:50px"> 이상, 최대 <input style="width:50px"> 이하</span></div>' +
      '<table class="vtable"><thead><tr><th rowspan="2"></th><th rowspan="2">옵션값</th><th rowspan="2">옵션 이미지</th><th colspan="2">구매제한</th><th rowspan="2">옵션가격</th>' + (stk ? '<th rowspan="2">재고</th><th rowspan="2">상태</th><th rowspan="2">판매중지 수량</th><th rowspan="2">주문</th><th rowspan="2">확인요청 수량</th>' : '') + '<th rowspan="2" class="code-col">옵션코드 ' + help() + '</th><th rowspan="2" style="width:22%">비고</th></tr><tr><th>최소</th><th>최대</th></tr></thead><tbody>' +
      g.values.map((v, vi) => '<tr' + (!v.code && p.assigned ? ' class="new-row"' : '') + '><td><button class="rbtn minus" data-act="h-delval" data-g="' + gi + '" data-v="' + vi + '" aria-label="옵션값 삭제">−</button></td>' +
        '<td><input style="width:110px" data-g="' + gi + '" data-v="' + vi + '" data-k="text" value="' + esc(v.text) + '"></td><td><span class="noimg" style="width:24px;height:22px;display:inline-grid;place-items:center;background:#eee;color:#aaa;font-size:8px">no img</span> <input style="width:90px"> <button class="hsm">찾아보기</button></td>' +
        '<td><input style="width:44px" value="' + esc(v.min) + '"></td><td><input style="width:44px" value="' + esc(v.max) + '"></td><td><input type="number" style="width:70px" data-g="' + gi + '" data-v="' + vi + '" data-k="price" value="' + esc(v.price) + '"></td>' +
        (stk ? '<td><input type="number" style="width:56px" data-g="' + gi + '" data-v="' + vi + '" data-k="stock" value="' + esc(v.stock) + '"></td><td><select data-g="' + gi + '" data-v="' + vi + '" data-k="status">' + ['판매', '품절', '숨김'].map((x) => '<option' + (v.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></td><td><select><option>사용</option></select> 0</td><td>0</td><td><select><option>사용</option></select> 0</td>' : '') +
        '<td class="code-col">' + codeCell(v.code, p) + '</td><td><input style="width:100%" data-g="' + gi + '" data-v="' + vi + '" data-k="memo" value="' + esc(v.memo) + '"></td></tr>').join('') +
      '</tbody></table></td></tr>').join('');
    return '<div class="win hybrid"><button class="win-x" data-act="pop-close" aria-label="닫기">✕</button><div class="htop">make#</div><div class="hbody"><h2>상품옵션 등록/수정</h2>' +
      '<div class="hsec">옵션 조건 설정<span class="r"><button class="hsm" data-act="noop">다른 상품 옵션 정보 가져오기</button></span></div>' +
      '<table class="htable"><tbody><tr><th>상품 구매조건 설정</th><td>최소 <input style="width:50px"> 이상, 최대 <input style="width:50px"> 이하</td></tr>' +
      '<tr><th>다중이미지 설정</th><td><label><input type="radio" name="hmi">사용함</label> &nbsp; <label><input type="radio" name="hmi" checked>사용안함</label></td></tr>' +
      '<tr><th>옵션재고 설정</th><td><label><input type="radio" name="hstk" value="Y"' + (stk ? ' checked' : '') + '>사용함</label> &nbsp; <label><input type="radio" name="hstk" value="N"' + (!stk ? ' checked' : '') + '>사용안함</label></td></tr></tbody></table>' +
      '<div class="hsec">옵션설정<span class="r"><button class="hsm" data-act="h-delsel">✕ 선택 옵션 삭제</button><button class="hsm" data-act="h-addgroup">옵션항목 추가</button></span></div>' +
      '<table class="hgrid"><thead><tr><th style="width:44px">이동</th><th style="width:40px">선택</th><th>상세설정</th></tr></thead><tbody>' + groups + '</tbody></table>' +
      '<div style="text-align:right;margin-top:6px"><button class="hsm blue" data-act="noop">일괄적용</button></div>' +
      '<ul class="pnote"><li>옵션명 50byte, 옵션값 200byte까지 입력가능합니다.</li><li>이미지 용량은 1mb까지 등록 가능합니다.</li></ul>' +
      (pop.err ? '<p class="err">' + esc(pop.err) + '</p>' : '') +
      '<div class="center"><button class="hbtn" data-act="h-save">저장</button><button class="hbtn sub" data-act="noop">미리보기</button></div></div></div>';
  }
  function saveHybrid() {
    const h = pop.h;
    for (const g of h.groups) {
      if (!g.name.trim()) { pop.err = '옵션명을 입력해 주세요.'; return render(); }
      const texts = g.values.map((v) => v.text.trim());
      if (!texts.length || texts.some((t) => !t)) { pop.err = '옵션값을 입력해 주세요.'; return render(); }
      if (new Set(texts).size !== texts.length) { pop.err = '같은 옵션값이 중복되었습니다. 옵션값을 확인해 주세요.'; return render(); }
    }
    M.restoreHybrid(h, pop.orig);
    draft.optionUse = 'H'; draft.hybrid = h;
    applyPopup('base');
  }

  // ---------- 개별옵션 팝업(neoproduct_option.html?type=indi) ----------
  function openIndiv() {
    syncFields();
    pop = { type: 'indiv', ind: M.clone(draft.indiv), orig: M.clone(draft.indiv), err: '' };
    render();
  }
  function renderIndiv() {
    const ind = pop.ind, p = draft;
    const optRows = ind.opts.map((o, i) => '<tr><td class="w110"><input data-io="' + i + '" data-k="name" value="' + esc(o.name) + '"></td><td style="width:42%"><input data-io="' + i + '" data-k="valuesText" value="' + esc(o.valuesText) + '" placeholder="예: 기본 포장,선물 포장"></td>' +
      '<td style="width:40%"><input data-io="' + i + '" data-k="pricesText" value="' + esc(o.pricesText) + '" placeholder="예: 0,2000"></td><td><select data-io="' + i + '" data-k="use"><option' + (o.use === 'Y' ? ' selected' : '') + '>Y</option><option' + (o.use === 'N' ? ' selected' : '') + '>N</option></select></td>' +
      '<td><button class="ibtn minus" data-act="i-del" data-i="' + i + '">−</button></td></tr>').join('');
    const rows = M.sortByCode(ind.rows);
    return '<div class="win"><button class="win-x" data-act="pop-close" aria-label="닫기">✕</button><div class="ptop">개별옵션 등록/수정</div><div class="pbody">' +
      '<div class="sec">개별 옵션 설정 <small>(개별 옵션 개수는 10개 까지 가능)</small><span class="r"><button class="sbtn" data-act="noop">다른 상품 옵션 정보가져오기</button></span></div>' +
      '<table class="ptable"><thead><tr><th>개별 옵션명</th><th>옵션값</th><th>옵션가격 ' + qhelp + '</th><th>사용</th><th><button class="ibtn" data-act="i-add" aria-label="개별 옵션 항목 추가">+</button></th></tr></thead><tbody>' +
      (optRows || '<tr><td colspan="5" class="empty">항목이 없습니다. 옵션 항목을 추가해 주세요.</td></tr>') + '</tbody></table>' +
      '<div class="rowtools"><span><select style="width:190px"><option>저장옵션 선택</option></select> <button class="sbtn" data-act="noop">옵션적용</button> <button class="sbtn" data-act="noop">저장옵션관리</button></span><span><input style="width:130px"> <button class="sbtn" data-act="noop">현재옵션저장</button> <button class="sbtn" data-act="i-add">개별 옵션 항목 추가</button></span></div>' +
      '<ul class="pnote"><li>옵션명은 50바이트, 옵션값은 각각 200바이트까지 입력 가능합니다.</li><li>옵션값과 옵션가격의 구분자는 콤마(,)입니다.</li></ul>' +
      '<div class="center"><button class="bbtn" data-act="i-compose">' + (ind.rows.length ? '옵션 재조합' : '옵션 구성하기') + '</button></div>' +
      (ind.rows.length ? '<hr class="sep"><div class="optset"><div><b>옵션 재고 관리 선택</b> <label><input type="radio" name="istk">재고 사용 안함</label> <label><input type="radio" name="istk" checked>재고 사용</label></div></div>' +
        '<div class="sec" style="margin-top:4px">옵션 조합 확인 및 관리<span class="r"><button class="sbtn" data-act="noop">조합 옵션 기본 설정</button></span></div>' +
        '<div class="bulkbar">일괄처리: 선택항목의 <select id="bulk-k"><option value="price">옵션가격</option><option value="stock">재고</option><option value="status">상태</option></select><input id="bulk-v" style="width:180px"><button class="sbtn" data-act="i-bulk">적용</button></div>' +
        '<div class="listwrap"><table class="ptable" style="border-top:0"><thead><tr><th style="width:30px"><input type="checkbox" data-act="chk-all"></th><th>개별 옵션명</th><th>개별 옵션값</th><th>개별 옵션가격</th><th>재고</th><th>상태</th><th class="code-col">옵션코드 ' + help() + '</th></tr></thead><tbody>' +
        rows.map((r) => '<tr' + (!r.code && p.assigned ? ' class="new-row"' : '') + '><td><input type="checkbox" class="rowchk" data-id="' + r.id + '"></td><td class="l">' + esc(r.name) + '</td><td class="l">' + esc(r.value) + '</td>' +
          '<td><input type="number" class="w80" data-ir="' + r.id + '" data-k="price" value="' + esc(r.price) + '"></td><td><input type="number" class="w60" data-ir="' + r.id + '" data-k="stock" value="' + esc(r.stock) + '"></td>' +
          '<td><select data-ir="' + r.id + '" data-k="status">' + ['판매', '품절', '숨김'].map((x) => '<option' + (r.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></td><td class="code-col">' + codeCell(r.code, p) + '</td></tr>').join('') +
        '</tbody></table></div><div class="rowtools"><span><button class="sbtn red" data-act="i-delrows">선택옵션삭제</button></span></div>' : '') +
      (pop.err ? '<p class="err">' + esc(pop.err) + '</p>' : '') +
      '<div class="center"><button class="bbtn" data-act="i-save">저 장</button><button class="bbtn" data-act="noop">미리보기</button><button class="bbtn" data-act="pop-close">닫 기</button></div></div></div>';
  }
  function saveIndiv() {
    if (!pop.ind.rows.length) { pop.err = '[옵션 구성하기]로 개별옵션을 구성해 주세요.'; return render(); }
    try { checkOpts(pop.ind.opts, pop.orig.opts, pop.ind.rows.map((r) => ({ key: r.key.split('_')[1] }))); } catch (err) { pop.err = err.message; return render(); }
    draft.indivUse = 'Y'; draft.indiv = pop.ind;
    applyPopup('indiv');
  }

  function renderPop() {
    const box = $('pop');
    if (!pop) { box.innerHTML = ''; document.body.style.overflow = ''; return; }
    const prev = box.querySelector('.win');
    const top = prev ? prev.scrollTop : 0;
    box.innerHTML = '<div class="overlay">' + { base: renderBase, hybrid: renderHybrid, indiv: renderIndiv }[pop.type]() + '</div>';
    box.querySelector('.win').scrollTop = top;
    document.body.style.overflow = 'hidden';
  }

  // ---------- 재고 일괄 관리 ----------
  const STOCK_KEYS = ['상품명', '키워드', '상품코드', '상품번호', '옵션코드', '상품 바코드', '스타일코드'];
  function renderStock() {
    const s = search.stock;
    const rows = s.done ? db.filter((p) => p.state === 'active' && matches(p, s.key, s.val)) : [];
    return head('상품 &gt; 일괄 관리 &gt; 재고 일괄 관리', '재고 일괄 관리', '상품 및 옵션의 재고 수량을 대분류별 또는 메인상품별로 확인 후 수정이 가능합니다.') +
      '<span class="stab">상품/옵션 재고 수량 검색</span><table class="ftable searchbox"><tbody>' +
      '<tr><th>검색</th><td><label><input type="radio" name="sk" checked>대분류별 상품</label><label><input type="radio" name="sk">메인진열 상품</label><label><input type="radio" name="sk">가상 대분류별 상품</label></td></tr>' +
      '<tr><th>진열 여부</th><td><select><option>전체</option></select></td></tr>' +
      '<tr><th>상품 분류 선택</th><td><select><option>대분류를 선택해주세요.</option></select> <select><option>중분류를 선택해주세요.</option></select> <select><option>소분류를 선택해주세요.</option></select></td></tr>' +
      '<tr><th>항목 선택</th><td><select><option>전체 상품</option><option>품절상품</option></select></td></tr>' +
      '<tr><th>상품검색</th><td>' + keySelect('skey', STOCK_KEYS, s.key) + ' <input id="sval" style="width:230px" value="' + esc(s.val) + '"> <label><input type="checkbox">검색 포함 전체 옵션 노출</label></td></tr>' +
      '</tbody></table><div class="center"><button class="bbtn lg" data-act="search" data-s="stock">조건 검색</button></div>' +
      '<div class="sec">상품/옵션 재고 관리<span class="r"><button class="sbtn" data-act="noop">엑셀 샘플 양식 다운</button> <button class="sbtn" data-act="noop">엑셀로 등록</button> <button class="sbtn" data-act="noop">검색된 상품 엑셀다운</button></span></div>' +
      '<table class="ltable"><thead><tr><th style="width:30px"><input type="checkbox"></th><th style="width:56px">이미지</th><th>제품명</th><th style="width:60px">진열 여부</th><th style="width:60px">현재 재고</th><th style="width:170px">재고수정</th><th style="width:80px">옵션별 재고</th></tr></thead><tbody>' +
      (rows.length ? rows.map((p) => '<tr><td><input type="checkbox"></td><td><span class="noimg">No<br>Image</span></td><td class="l"><b>' + esc(p.name) + '</b> <span class="uid">(' + p.uid + ')</span><div class="sub">' + esc(optionSummary(p)) + '</div></td><td>' + esc(p.display) + '</td><td>' + stockOf(p) + '</td>' +
        '<td><select><option>+</option><option>-</option><option>=</option></select> <input type="number" style="width:60px"> <button class="sbtn" data-act="noop">수정</button></td><td><button class="sbtn" data-act="noop">옵션별 재고</button></td></tr>').join('')
        : '<tr><td colspan="7" class="empty">조건에 맞는 검색 결과가 없습니다.</td></tr>') + '</tbody></table>' +
      '<ul class="pnote" style="margin-top:12px"><li style="color:#e60012">옵션 개별 재고를 설정한 상품은 일괄 수정이 가능하지않습니다.</li><li>"검색 포함 전체 옵션 노출"을 체크하시면 검색된 옵션이 포함된 해당 상품의 전체 옵션이 노출됩니다.</li></ul></div>';
  }

  // ---------- 재입고 알림 관리 ----------
  const RESTOCK_KEYS = ['상품명', '상품코드', '상품번호', '옵션코드', '키워드', '스타일코드', '상품 특이사항'];
  function optionStock(p, code) {
    const k = M.kindOf(p);
    if (k === 'combo') { const r = p.base.rows.find((x) => x.code === code); return r ? r.stock : 0; }
    if (k === 'hybrid') { for (const g of p.hybrid.groups) { const v = g.values.find((x) => x.code === code); if (v) return v.stock; } }
    return p.stock;
  }
  function renderRestock() {
    const s = search.restock, q = s.val.trim();
    const rows = alerts.filter((a) => { const p = product(a.uid); if (!p || p.state !== 'active') return false;
      if (!q) return true; if (s.key === '옵션코드') return a.code === q && M.codesOf(p).some((c) => c.code === q); if (s.key === '상품번호') return p.uid === q; return p.name.includes(q); });
    const r2 = (label, inner) => '<tr><th>' + label + '</th><td>' + inner + '</td></tr>';
    return '<div class="page mpage"><div class="mhead"><h2>재입고 알림 관리</h2><span>상품 &gt; 부가 기능 &gt; 재입고 알림 관리</span></div><h3>상품검색</h3>' +
      '<table class="mtable"><tbody>' + r2('상품 조건', '<label><input type="radio" name="rc" checked>재입고 알림 신청 리스트</label><label><input type="radio" name="rc">일시품절</label><label><input type="radio" name="rc">일시품절+재입고 알림 상품</label>') +
      r2('상품 수량', '<label><input type="radio" name="rq" checked>전체</label><label><input type="radio" name="rq">무제한</label>') + r2('진열 여부', '<label><input type="radio" name="rd" checked>전체</label><label><input type="radio" name="rd">노출</label><label><input type="radio" name="rd">미노출</label>') +
      r2('상품 분류', '<select><option>대분류</option></select> <select><option>중분류</option></select> <select><option>소분류</option></select>') +
      r2('검색어', keySelect('skey', RESTOCK_KEYS, s.key) + ' <input id="sval" style="width:320px" value="' + esc(s.val) + '">') + '</tbody></table>' +
      '<div class="center"><button class="mbtn" data-act="search" data-s="restock">검색</button></div>' +
      '<div class="result-head"><h3 style="margin:0">검색결과</h3><span><select><option>10개씩 보기</option></select> <button class="sbtn" data-act="noop">엑셀다운로드</button></span></div>' +
      '<table class="ltable mlist"><thead><tr><th style="width:30px"><input type="checkbox"></th><th style="width:56px">이미지</th><th>상품명</th><th style="width:76px">상품가격</th><th style="width:90px">특이사항</th><th style="width:60px">상품수량</th><th style="width:56px">신청(명)</th><th style="width:66px">알림 미발송</th><th style="width:76px">신청자 리스트</th></tr></thead><tbody>' +
      (rows.length ? rows.map((a) => { const p = product(a.uid); return '<tr><td><input type="checkbox"></td><td><span class="noimg">No<br>Image</span></td><td class="l"><b>' + esc(p.name) + '</b><div class="sub">옵션: ' + esc(a.option) + '</div></td><td>' + won(p.price) + '</td><td class="sub">' + esc(a.note) + '</td><td>' + optionStock(p, a.code) + '</td><td>' + a.requests + '</td><td>' + a.unsent + '</td><td><button class="sbtn" data-act="noop">보기</button></td></tr>'; }).join('')
        : '<tr><td colspan="9" class="empty">리스트가 없습니다.</td></tr>') + '</tbody></table><div style="margin-top:8px"><button class="sbtn" data-act="noop">선택삭제</button></div></div>';
  }

  // ---------- 이벤트 ----------
  function rowById(list, id) { return list.find((r) => r.id === id); }
  function checkedIds() { return [...document.querySelectorAll('#pop .rowchk:checked')].map((c) => c.dataset.id); }
  function bulk(list) {
    const ids = checkedIds(), k = $('bulk-k').value, v = $('bulk-v').value;
    if (!ids.length) return toast('일괄 적용할 옵션을 선택해 주세요.');
    list.filter((r) => ids.includes(r.id)).forEach((r) => { r[k] = k === 'status' ? (['판매', '품절', '숨김'].includes(v) ? v : r.status) : Number(v) || 0; });
    render();
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const a = t.dataset.act;
    if (a === 'chk-all') { t.closest('table').querySelectorAll('.rowchk').forEach((c) => { c.checked = t.checked; }); return; }
    e.preventDefault();
    const i = +t.dataset.i, gi = +t.dataset.g;
    switch (a) {
      case 'reset': init(); pop = null; if (curHash() === '#list') route(); else nav('list'); toast('예시 데이터를 처음 상태로 되돌렸습니다.'); break;
      case 'noop': toast('목업에서는 동작하지 않는 기존 기능입니다.'); break;
      case 'search': { const s = search[t.dataset.s]; s.key = $('skey').value; s.val = $('sval').value.trim(); s.done = true; render(); break; }
      case 'search-clear': Object.assign(search[t.dataset.s], { key: '상품명', val: '' }); render(); break;
      case 'edit': nav('edit/' + t.dataset.uid); break;
      case 'go-list': nav('list'); break;
      case 'delete': product(t.dataset.uid).state = 'deleted'; toast('상품을 삭제했습니다. 삭제 상품 조회에서 복구할 수 있습니다.'); render(); break;
      case 'restore': product(t.dataset.uid).state = 'active'; toast('상품을 복구했습니다. 삭제 전 옵션코드가 그대로 유지됩니다.'); render(); break;
      case 'save-product': saveProduct(); break;
      case 'open-base': openBase(); break;
      case 'open-hybrid': openHybrid(); break;
      case 'open-indiv': openIndiv(); break;
      case 'pop-close': pop = null; render(); break;
      // 기본옵션
      case 'b-add': pop.base.opts.push(M.newOpt()); pop.err = ''; render(); break;
      case 'b-del': pop.base.opts.splice(i, 1); render(); break;
      case 'b-combine': try { pop.base = M.recombine(pop.base, pop.orig); pop.mode = 'combo'; pop.err = ''; } catch (err) { pop.err = err.message; } render(); break;
      case 'b-nocombo': if (!pop.base.opts.some((o) => o.vals.length)) { pop.err = '옵션명과 옵션값을 입력해 주세요.'; } else { pop.mode = 'nocombo'; pop.err = ''; } render(); break;
      case 'b-bulk': bulk(pop.base.rows); break;
      case 'b-delrows': { const ids = checkedIds(); if (!ids.length) { toast('삭제할 옵션을 선택해 주세요.'); break; } pop.base.rows = pop.base.rows.filter((r) => !ids.includes(r.id)); render(); break; }
      case 'b-addrow': toast('옵션값은 위 옵션 설정에 추가한 뒤 [옵션 재조합]을 눌러 주세요.'); break;
      case 'b-save': saveBase(); break;
      // 하이브리드
      case 'h-up': case 'h-down': { const gs = pop.h.groups, j = a === 'h-up' ? gi - 1 : gi + 1; [gs[gi], gs[j]] = [gs[j], gs[gi]]; render(); break; }
      case 'h-addgroup': pop.h.groups.push(M.newGroup()); render(); break;
      case 'h-addval': pop.h.groups[gi].values.push(M.newHybridValue()); render(); break;
      case 'h-delval': pop.h.groups[gi].values.splice(+t.dataset.v, 1); render(); break;
      case 'h-delsel': { const sel = [...document.querySelectorAll('#pop .gsel:checked')].map((c) => +c.dataset.g); if (!sel.length) { toast('삭제할 옵션을 선택해 주세요.'); break; } pop.h.groups = pop.h.groups.filter((_, k) => !sel.includes(k)); render(); break; }
      case 'h-save': saveHybrid(); break;
      // 개별옵션
      case 'i-add': pop.ind.opts.push(M.newIndivOpt()); render(); break;
      case 'i-del': pop.ind.opts.splice(i, 1); render(); break;
      case 'i-compose': try { pop.ind = M.composeIndiv(pop.ind, pop.orig.rows); pop.err = ''; } catch (err) { pop.err = err.message; } render(); break;
      case 'i-bulk': bulk(pop.ind.rows); break;
      case 'i-delrows': { const ids = checkedIds(); if (!ids.length) { toast('삭제할 옵션을 선택해 주세요.'); break; } pop.ind.rows = pop.ind.rows.filter((r) => !ids.includes(r.id)); render(); break; }
      case 'i-save': saveIndiv(); break;
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target, d = el.dataset, k = d.k;
    const val = el.type === 'checkbox' ? el.checked : el.value;
    // 상품 화면 라디오
    if (el.name === 'ouse') {
      syncFields();
      if (val === 'M') { toast('다중 상품 옵션 불러오기는 이번 범위에서 제외되어 목업에서 제공하지 않습니다.'); render(); return; }
      draft.optionUse = val; render(); return;
    }
    if (el.name === 'iuse') { syncFields(); draft.indivUse = val; render(); return; }
    if (el.name === 'hstk' && pop) { pop.h.stockUse = val; render(); return; }
    if (el.id === 'skey') { const s = $('sval'); if (s) s.placeholder = val === '옵션코드' ? '예: 1100006925-0005' : ''; return; }
    if (!pop || !k) return;
    try {
      if (d.o !== undefined) {
        const o = pop.base.opts[+d.o];
        o[k] = val;
        if (k === 'valuesText' || k === 'pricesText') M.setOptionValues(o, o.valuesText, o.pricesText, ((pop.orig.opts.find((x) => x.id === o.id) || {}).vals));
      } else if (d.r !== undefined) {
        const r = rowById(pop.base.rows, d.r); r[k] = el.type === 'number' ? Number(val) || 0 : val;
      } else if (d.io !== undefined) {
        const o = pop.ind.opts[+d.io];
        o[k] = val;
        if (k === 'valuesText' || k === 'pricesText') M.setOptionValues(o, o.valuesText, o.pricesText, ((pop.orig.opts.find((x) => x.id === o.id) || {}).vals));
      } else if (d.ir !== undefined) {
        const r = rowById(pop.ind.rows, d.ir); r[k] = el.type === 'number' ? Number(val) || 0 : val;
      } else if (d.g !== undefined) {
        const g = pop.h.groups[+d.g];
        if (d.v === undefined) g[k] = val;
        else g.values[+d.v][k] = el.type === 'number' ? Number(val) || 0 : val;
      }
      pop.err = '';
    } catch (err) { pop.err = err.message; render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pop) { pop = null; render(); }
    if (e.key === 'Enter' && e.target.id === 'sval') { const b = document.querySelector('[data-act="search"]'); if (b) b.click(); }
  });

  window.OptApp = { route, nav };
  window.addEventListener('hashchange', route);
  init();
  route();
})();
