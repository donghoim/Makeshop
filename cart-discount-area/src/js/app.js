/* 장바구니 목업 렌더러: CartApp.mount(root, opts) — 프로토타입과 화면정의서가 함께 사용 */
(function (g) {
  var D = g.CART_DATA, E = g.CartEngine;

  function won(n) { return (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('ko-KR'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function buildState(opts) {
    var preset = D.PRESETS[opts.preset || 'base'];
    var cartType = opts.cartType || 'single';
    var ids = D.CART_TYPES[cartType].groups ? preset.intItems : preset.items;
    return {
      cartType: cartType, preset: opts.preset || 'base', tab: opts.tab || 'normal',
      items: ids.map(function (id) { var it = clone(D.ITEMS[id]); it.checked = true; return it; }),
      coupons: preset.coupons === 'all' ? D.COUPONS.slice() : [],
      loggedIn: opts.loggedIn !== false, toggle: true, manualSel: { P: {}, C: {} },
      shipBasis: opts.shipBasis || 'before', fold: { goods: false, disc: false }, modal: null, toast: null
    };
  }

  function couponValue(c) { return c.type === 'rate' ? c.v + '% 할인' : won(c.v) + '원 할인'; }

  function renderItem(l, it) {
    return '<div class="c-item" data-id="' + it.id + '">' +
      '<label class="c-chk"><input type="checkbox" data-act="check" data-id="' + it.id + '"' + (it.checked ? ' checked' : '') + ' aria-label="' + esc(it.name) + ' 선택"></label>' +
      '<div class="c-thumb" style="background:' + it.color + '"></div>' +
      '<div><div class="c-name">' + esc(it.name) + '</div><div class="c-opt">' + esc(it.opt) + ' ' + it.qty + '개</div>' +
      '<div class="c-price"><b>' + won(it.price + it.optAdd) + '원</b>' + (it.listPrice > it.price ? '<s>' + won(it.listPrice) + '원</s>' : '') + '</div></div>' +
      '<div class="c-reserve">적립금 ' + won(it.reserve) + '</div>' +
      '<div class="c-ship">[기본배송]조건 <i>?</i></div>' +
      '<div class="c-ctrl">' +
        '<div class="c-qty"><button data-act="qty" data-id="' + it.id + '" data-d="-1" aria-label="수량 감소">−</button><span>' + it.qty + '</span><button data-act="qty" data-id="' + it.id + '" data-d="1" aria-label="수량 증가">+</button></div>' +
        '<button class="c-btn" data-act="optchange">옵션변경</button>' +
        '<button class="c-btn line" data-act="pcoupon" data-id="' + it.id + '" data-mk="pcoupon-btn">상품쿠폰</button>' +
      '</div></div>';
  }

  function renderList(st, r) {
    if (!st.items.length) {
      return '<div class="c-listhead"><label class="c-chk"><input type="checkbox" disabled> 전체</label><button class="c-linkbtn">선택삭제</button></div>' +
        '<div class="c-empty" data-mk="empty">장바구니에 담긴 상품이 없습니다.</div>' + renderBottom(st, r);
    }
    var allChecked = st.items.every(function (i) { return i.checked; });
    var html = '<div class="c-listhead"><label class="c-chk" data-mk="chkall"><input type="checkbox" data-act="checkall"' + (allChecked ? ' checked' : '') + '> 전체</label><button class="c-linkbtn" data-act="delsel">선택삭제</button></div>';
    var ct = D.CART_TYPES[st.cartType];
    if (!ct.groups) {
      st.items.forEach(function (it) { html += renderItem(null, it); });
    } else {
      ['HQ', 'A'].forEach(function (sp) {
        var its = st.items.filter(function (i) { return i.supplier === sp; });
        if (!its.length) return;
        html += '<div class="c-group" data-group="' + sp + '"><div class="c-group-title">' + D.SHIPPING[sp].label + '</div>';
        its.forEach(function (it) { html += renderItem(null, it); });
        var lines = r.lines.filter(function (l) { return l.supplier === sp; });
        var goods = lines.reduce(function (s, l) { return s + l.goods; }, 0);
        var fee = r.groupShip[sp] || 0;
        html += '<div class="c-group-sum" data-mk="group-sum">' + won(goods) + '원 + 배송비 ' + won(fee) + '원 <b>총 합계 금액 ' + won(goods + fee) + '원</b></div>';
        html += '<div class="c-group-foot">' + (ct.unit === 'supplier' ? '<button class="c-btn dark lg" data-act="ccoupon" data-key="' + sp + '" data-mk="ccoupon-group">장바구니 쿠폰</button>' : '') + '</div></div>';
      });
    }
    return html + renderBottom(st, r);
  }

  function renderBottom(st, r) {
    var ct = D.CART_TYPES[st.cartType];
    var btns = '<button class="c-btn lg" data-act="estimate">견적서 출력</button>';
    if (st.tab === 'normal' && ct.unit === 'all') btns += '<button class="c-btn dark lg" data-act="ccoupon" data-key="ALL" data-mk="ccoupon-all">장바구니 쿠폰</button>';
    return '<div class="c-bottom"><ul class="c-notes" data-mk="notes"><li>지역별 배송정책에 따라 배송비가 변동될 수 있습니다.</li>' +
      (st.tab === 'normal' && st.loggedIn ? '<li>김메샵님은 일반회원입니다.</li>' : '') + '</ul><div class="c-bottom-btns">' + btns + '</div></div>';
  }

  function sub(lbl, amt, mk, note) {
    return '<div class="c-row sub"' + (mk ? ' data-mk="' + mk + '"' : '') + '><span class="lbl">' + lbl + '</span><span class="' + (note ? 'note' : 'amt') + '">' + amt + '</span></div>';
  }

  function renderPay(st, r) {
    if (st.tab === 'subs') {
      return '<div class="c-paybox" data-mk="paybox"><div class="c-payhead"><h3>결제 정보</h3></div>' +
        '<div class="c-row main"><span>총 상품 금액</span><span>0원</span></div><div class="c-row main"><span>배송비</span><span>0원</span></div>' +
        '<div class="c-final"><span>총 결제 금액</span><span class="amt">0<span class="won">원</span></span></div></div>' +
        '<button class="c-order" data-act="order">정기배송 신청</button><p class="c-subs-note" data-mk="subs-note">ⓘ 결제 예정금액은 현재 시점의 금액이며, 정기배송 자동결제 시점에는 금액이 변경될 수 있으니 쇼핑에 참고해 주세요.</p>';
    }
    var disabled = !r.applicable;
    var on = st.toggle && !disabled;
    var h = '<div class="c-paybox" data-mk="paybox"><div class="c-payhead"><h3>결제 정보</h3>' +
      '<button class="c-toggle" role="switch" aria-checked="' + on + '" data-act="toggle" data-mk="toggle"' + (disabled ? ' disabled' : '') + '>최대 할인 적용 <span class="sw"></span></button></div>';
    h += '<div data-mk="goods"><div class="c-row main"><span>총 상품 금액<button class="c-fold' + (st.fold.goods ? ' closed' : '') + '" data-act="fold" data-k="goods" data-mk="fold" aria-label="총 상품 금액 하위 항목 ' + (st.fold.goods ? '펼치기' : '접기') + '">︿</button></span><span>' + won(r.totalGoods) + '원</span></div>';
    if (!st.fold.goods) h += sub('상품 금액', won(r.goodsSum) + '원') + sub('배송비', won(r.ship) + '원');
    h += '</div>';
    if (r.showDisc) {
      h += '<div data-mk="disc"><div class="c-row main minus"><span>총 할인 금액<button class="c-fold' + (st.fold.disc ? ' closed' : '') + '" data-act="fold" data-k="disc" aria-label="총 할인 금액 하위 항목 ' + (st.fold.disc ? '펼치기' : '접기') + '">︿</button></span><span class="amt">' + won(-r.totalDisc) + '원</span></div>';
      if (!st.fold.disc) {
        h += '<div data-mk="disc-sub">';
        if (r.pdSum) h += sub('상품 할인', won(-r.pdSum) + '원', 'disc-pd');
        if (r.pcSum) h += sub('상품 쿠폰', won(-r.pcSum) + '원', 'disc-pc');
        if (r.ccSum) h += sub('장바구니 쿠폰', won(-r.ccSum) + '원', 'disc-cc');
        h += '</div>';
        if (r.showOrderNotice) h += '<div data-mk="order-notice">' + sub('주문 할인', '주문서에서 확인 가능', null, 1) + sub('보유 적립금', '주문서에서 확인 가능', null, 1) + sub('적립금 즉시 할인', '주문서에서 확인 가능', null, 1) + '</div>';
      }
      h += '</div>';
    }
    h += '<div class="c-final" data-mk="final"><span>최종 결제 금액</span><span class="amt">' + won(r.final) + '<span class="won">원</span></span></div></div>';
    h += '<div class="c-order-wrap"><button class="c-order" data-act="order" data-mk="order-btn">주문하기</button></div>';
    return h;
  }

  function renderModal(st, r) {
    var m = st.modal; if (!m) return '';
    var lists = E.modalLists(st, r, m.kind, m.key);
    var isP = m.kind === 'P';
    var single = m.single ? E.byId(m.single) : null;
    var dupLocked = single && !single.dupAllowed;
    var title = isP ? '상품쿠폰 적용' : '장바구니 쿠폰 적용';
    function cpRow(e, type) {
      var c = e.c, checked = type === 'radio' ? m.single === c.id : m.dups.indexOf(c.id) >= 0;
      var dis = e.usedElsewhere || (type === 'checkbox' && dupLocked);
      return '<label class="c-cp' + (dis ? ' disabled' : '') + '"><input type="' + type + '" name="cp-' + type + '" data-act="' + (type === 'radio' ? 'm-single' : 'm-dup') + '" value="' + c.id + '"' + (checked ? ' checked' : '') + (dis ? ' disabled' : '') + '>' +
        '<span class="val">' + couponValue(c) + '</span><span><div class="nm">' + esc(c.name) + '</div><div class="ds">' + esc(c.desc) + '</div>' +
        (c.dupAllowed ? '' : '<div class="ex">쿠폰 중복 사용 불가능</div>') +
        (e.usedElsewhere ? '<div class="ex">다른 ' + (isP ? '상품' : '묶음') + '에 적용 중인 쿠폰입니다.</div>' : '') +
        '<div class="ex">유효기간 : ' + esc(c.expire) + '</div></span></label>';
    }
    var h = '<div class="c-dim" data-act="m-dim"><div class="c-modal" role="dialog" aria-modal="true" aria-label="' + title + '" data-mk="modal">' +
      '<div class="c-modal-head"><h4>' + title + '</h4><button class="c-x" data-act="m-close" aria-label="닫기">×</button></div>' +
      '<div class="c-msec" data-mk="m-reg" style="margin-top:0"><h5>쿠폰 등록</h5><div class="c-reg"><input placeholder="쿠폰 번호 입력" data-act="m-code" value="' + esc(m.code || '') + '"' + (m.codeErr ? ' class="err"' : '') + '><button class="c-btn dark lg" data-act="m-reg">등록</button></div>' + (m.codeErr ? '<div class="c-reg-msg">' + m.codeErr + '</div>' : '') + '</div>' +
      '<div class="c-msec" data-mk="m-single"><h5>적용 쿠폰 선택</h5>' +
      '<label class="c-cp"><input type="radio" name="cp-radio" data-act="m-single" value=""' + (!m.single ? ' checked' : '') + '><span class="nm" style="grid-column:2/4">쿠폰 적용 안함</span></label>';
    lists.singles.forEach(function (e) { h += cpRow(e, 'radio'); });
    h += '</div><div class="c-msec" data-mk="m-dup"><h5>적용 중복 쿠폰 선택</h5>';
    if (!lists.dups.length) h += '<div class="c-nocp">적용 가능한 중복 쿠폰이 없습니다.</div>';
    lists.dups.forEach(function (e) { h += cpRow(e, 'checkbox'); });
    h += '</div><div class="c-msec" data-mk="m-na"><h5>적용 불가 쿠폰</h5>';
    if (!lists.na.length) h += '<div class="c-nocp">적용 불가 쿠폰이 없습니다.</div>';
    lists.na.forEach(function (c) { h += '<div class="c-cp na"><span class="val">' + couponValue(c) + '</span><span><div class="nm">' + esc(c.name) + '</div><div class="ds">' + esc(c.desc) + '</div></span></div>'; });
    h += '</div><ul class="c-mnotes" data-mk="m-notes"><li>쿠폰 별 결제수단이 다를 경우 쿠폰이용 및 결제수단이 제한되니 유의하여 사용해주세요.</li><li>쿠폰은 조건에 따라 적용이 되지 않을 수 있습니다.</li><li>적용불가 쿠폰은 마이페이지 - 보유쿠폰에서 상세조건 확인이 가능합니다.</li></ul>' +
      '<button class="c-apply" data-act="m-apply" data-mk="m-apply">쿠폰적용</button></div></div>';
    return h;
  }

  function mount(root, opts) {
    opts = opts || {};
    var st = buildState(opts), r;
    root.classList.add('cart-root');
    if (opts.live) root.classList.add('is-live');

    function measure() { root.classList.toggle('is-mobile', root.clientWidth < 768); }
    if (g.ResizeObserver) new ResizeObserver(measure).observe(root);

    function render() {
      measure();
      r = E.compute(st);
      if (!st.toggle) { st.manualSel = r.sel; }
      var normalCount = st.items.length;
      root.innerHTML =
        (opts.chrome === false ? '' : '<div class="c-topbar">3월 한정 선착순 1+1 이벤트, 20% 할인 쿠폰도 드려요</div><div class="c-header"><div class="c-logo">Shoply</div><div class="c-icons"><span>👜<i class="badge">' + normalCount + '</i></span><span>👤</span><span>☰</span></div></div><div class="c-gnb"><span>NEW</span><span>BEST</span><span>아우터</span><span>탑</span><span>원피스</span><span>팬츠</span><span>액세서리</span></div>') +
        '<div class="c-wrap"><h2 class="c-title">장바구니</h2>' +
        '<div class="c-tabs" role="tablist" data-mk="tabs"><button role="tab" data-act="tab" data-tab="normal" class="' + (st.tab === 'normal' ? 'on' : '') + '">일반구매<em>(' + normalCount + ')</em></button><button role="tab" data-act="tab" data-tab="subs" class="' + (st.tab === 'subs' ? 'on' : '') + '">정기배송<em>(0)</em></button></div>' +
        '<div class="c-body"><div class="c-list">' + (st.tab === 'subs' ? '<div class="c-listhead"><span></span><span></span></div><div class="c-empty">장바구니에 담긴 상품이 없습니다.</div>' + renderBottom(st, r) : renderList(st, r)) + '</div>' +
        '<aside class="c-pay">' + renderPay(st, r) + '</aside></div></div>' +
        renderModal(st, r) + (st.toast ? '<div class="c-toast" role="status">' + esc(st.toast) + '</div>' : '');
      if (opts.onRender) opts.onRender(st, r);
    }

    var toastTimer;
    function toast(msg) { st.toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(function () { st.toast = null; render(); }, 1800); }

    function openModal(kind, key) {
      var cur = (kind === 'P' ? r.sel.P[key] : r.sel.C[key]) || { single: null, dups: [] };
      st.modal = { kind: kind, key: key, single: cur.single, dups: cur.dups.slice(), code: '' };
      render();
    }
    function applyModal() {
      var m = st.modal;
      var base = st.toggle ? { P: {}, C: {} } : clone(st.manualSel || { P: {}, C: {} });
      base.P = base.P || {}; base.C = base.C || {};
      var single = m.single ? E.byId(m.single) : null;
      base[m.kind][m.key] = { single: m.single || null, dups: single && !single.dupAllowed ? [] : m.dups.slice() };
      st.manualSel = base; st.toggle = false; st.modal = null;
      render();
    }

    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act]'); if (!t || !root.contains(t)) return;
      var act = t.getAttribute('data-act'), id = t.getAttribute('data-id');
      if (act === 'm-dim' && ev.target !== t) return;
      switch (act) {
        case 'tab': st.tab = t.getAttribute('data-tab'); render(); break;
        case 'qty': st.items.forEach(function (i) { if (i.id === id) i.qty = Math.max(1, i.qty + +t.getAttribute('data-d')); }); render(); break;
        case 'delsel': st.items = st.items.filter(function (i) { return !i.checked; }); render(); break;
        case 'toggle': st.toggle = !st.toggle; st.manualSel = { P: {}, C: {} }; render(); break;
        case 'fold': var k = t.getAttribute('data-k'); st.fold[k] = !st.fold[k]; render(); break;
        case 'pcoupon': openModal('P', id); break;
        case 'ccoupon': openModal('C', t.getAttribute('data-key')); break;
        case 'm-close': case 'm-dim': st.modal = null; render(); break;
        case 'm-apply': applyModal(); break;
        case 'm-reg':
          var code = (root.querySelector('[data-act="m-code"]') || {}).value || '';
          st.modal.code = code;
          st.modal.codeErr = code.trim() ? null : '쿠폰 번호를 입력해 주세요.';
          if (code.trim()) { st.modal.codeErr = null; toast('목업: 쿠폰 등록은 주문서 쿠폰 등록과 같습니다.'); } else render();
          break;
        case 'optchange': toast('목업: 옵션 변경은 현행과 같습니다.'); break;
        case 'estimate': toast('목업: 견적서 출력은 현행과 같습니다.'); break;
        case 'order': toast('목업: 주문서로 이동합니다.'); break;
      }
    });
    root.addEventListener('change', function (ev) {
      var t = ev.target, act = t.getAttribute('data-act');
      if (act === 'check') { st.items.forEach(function (i) { if (i.id === t.getAttribute('data-id')) i.checked = t.checked; }); render(); }
      else if (act === 'checkall') { st.items.forEach(function (i) { i.checked = t.checked; }); render(); }
      else if (act === 'm-single') { st.modal.single = t.value || null; var c = t.value ? E.byId(t.value) : null; if (c && !c.dupAllowed) st.modal.dups = []; render(); }
      else if (act === 'm-dup') { var d = st.modal.dups; if (t.checked) d.push(t.value); else d.splice(d.indexOf(t.value), 1); render(); }
    });
    root.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && st.modal) { st.modal = null; render(); } });

    render();
    return {
      state: st, result: function () { return r; }, render: render,
      set: function (patch) { Object.keys(patch).forEach(function (k) { st[k] = patch[k]; }); render(); },
      openModal: openModal, applyModal: applyModal,
      selectInModal: function (single, dups) { st.modal.single = single; if (dups) st.modal.dups = dups; render(); }
    };
  }

  g.CartApp = { mount: mount, won: won };
})(window);
