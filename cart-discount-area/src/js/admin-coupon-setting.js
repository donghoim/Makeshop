/* 관리자 쿠폰 관리 > 쿠폰 기본 설정 모달 목업: AdminCouponSetting.mount(root, opts)
   기존 모달 구성은 현행 화면(2026-11-04 확인) 기준, 변경은 '최대 할인 자동 적용' 툴팁 추가 문구·링크만(POL-057) */
(function (g) {
  var TIP_BASE = ['쿠폰 최대 할인 적용의 경우 아래 케이스들은 적용이 불가능합니다.', '- 중복쿠폰 및 적립/배송비할인/배송비무료 쿠폰', '- 쿠폰 중복 사용 불가 쿠폰', '- 특정 결제수단 지정된 쿠폰', '- 회원 추가 혜택 적용불가 쿠폰', '- 쿠폰/적립금 동시사용 불가 쿠폰'];
  var TIP_ADD = '장바구니에 쿠폰·할인 영역이 적용된 상점은 이 설정에 따라 주문서의 쿠폰 적용 방식이 달라집니다.';
  var TIP_LINK = '장바구니 내 쿠폰 및 할인 영역 노출 방법';
  var TIP_URL = '#'; /* OPEN-004: 개별디자인 TIP 게시글 주소 확정 후 교체 */

  function radio(name, opts, val) {
    return opts.map(function (o) { return '<label class="a-rd"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === val ? ' checked' : '') + '> ' + o[1] + '</label>'; }).join('');
  }
  function help(id) { return ' <button type="button" class="a-help" data-tip="' + id + '" aria-label="도움말" aria-expanded="false">?</button>'; }

  function mount(root, opts) {
    opts = opts || {};
    var st = { maxAuto: opts.maxAuto || 'off', tip: opts.tipOpen ? 'maxauto' : null, toast: null };
    root.classList.add('admin-root');
    function render() {
      var tip = st.tip === 'maxauto' ? '<div class="a-tip" role="tooltip" id="tip-maxauto" data-mk="a-tip">' +
        '<div data-mk="a-tip-base">' + TIP_BASE.map(function (l) { return '<div>' + l + '</div>'; }).join('') + '</div>' +
        '<div class="a-tip-add" data-mk="a-tip-add">' + TIP_ADD + ' <a href="' + TIP_URL + '" target="_blank" rel="noopener" class="a-tip-link" data-act="tiplink" data-mk="a-tip-link">' + TIP_LINK + ' &gt;</a></div></div>' : '';
      root.innerHTML = '<div class="a-page"><div class="a-dim"></div><div class="a-modal" role="dialog" aria-modal="true" aria-label="쿠폰 기본 설정" data-mk="a-modal">' +
        '<button class="a-x" data-act="close" aria-label="닫기">×</button><h2>쿠폰 기본 설정</h2>' +
        '<h3>기본설정</h3><table class="a-tbl"><tbody>' +
        '<tr><th>스마트 쿠폰 사용 여부</th><td>' + radio('smart', [['on', '사용함'], ['off', '사용안함 ( <input type="checkbox" disabled> 미리보기)']], 'on') + '</td></tr>' +
        '<tr><th>쿠폰 사용 범위 설정</th><td><label class="a-rd"><input type="checkbox"> 전체</label><label class="a-rd"><input type="checkbox" checked> 상품</label><label class="a-rd"><input type="checkbox"> 장바구니</label></td></tr>' +
        '<tr data-mk="a-maxauto"><th>최대 할인 자동 적용' + help('maxauto') + '</th><td style="position:relative">' + radio('maxauto', [['on', '사용함'], ['off', '사용안함']], st.maxAuto) + tip + '</td></tr>' +
        '<tr><th>쿠폰존 정렬기본값 설정' + help('zone') + '</th><td>' + radio('zone', [['exp', '유효기간 순'], ['name', '쿠폰명 순'], ['new', '최신등록 순']], 'exp') + '</td></tr>' +
        '</tbody></table><div class="a-alert">! 알림 ⌄</div>' +
        '<h3>쿠폰 사용 설정</h3><table class="a-tbl"><tbody>' +
        '<tr><th>상품 중복 쿠폰</th><td><label class="a-rd"><input type="radio" name="pd" checked> 사용함 (상품당 최대 <input class="a-num" value="2" aria-label="상품당 최대 개수"> 개 중복 사용 가능)</label><label class="a-rd"><input type="radio" name="pd"> 사용안함</label></td></tr>' +
        '<tr><th>장바구니 중복 쿠폰</th><td><label class="a-rd"><input type="radio" name="cd"> 사용함 (주문당 최대 <input class="a-num" aria-label="주문당 최대 개수"> 개 중복 사용 가능)</label><label class="a-rd"><input type="radio" name="cd" checked> 사용안함</label></td></tr>' +
        '</tbody></table><div class="a-alert">! 알림 ⌄</div>' +
        '<h3>쿠폰 노출 설정</h3><table class="a-tbl"><tbody>' +
        '<tr><th>마이페이지 보유 쿠폰 노출 범위</th><td><label class="a-rd"><input type="checkbox" checked> 사용 가능 쿠폰</label><label class="a-rd"><input type="checkbox" checked> 예정 쿠폰</label></td></tr>' +
        '<tr><th>주문서 내 적용불가 쿠폰 노출 여부' + help('na') + '</th><td>' + radio('na', [['y', '노출함'], ['n', '노출안함']], 'y') + '</td></tr>' +
        '</tbody></table><div class="a-btns"><button class="a-btn" data-act="cancel">취소</button><button class="a-btn pri" data-act="save">저장</button></div></div>' +
        (st.toast ? '<div class="c-toast" role="status">' + st.toast + '</div>' : '') + '</div>';
      if (opts.onRender) opts.onRender(st);
    }
    var t;
    function toast(m) { st.toast = m; render(); clearTimeout(t); t = setTimeout(function () { st.toast = null; render(); }, 1800); }
    root.addEventListener('click', function (ev) {
      var h = ev.target.closest('[data-tip]');
      if (h) { var id = h.getAttribute('data-tip'); st.tip = id === 'maxauto' ? 'maxauto' : null; if (id !== 'maxauto') toast('목업: 다른 도움말은 현행과 같습니다.'); else render(); return; }
      var a = ev.target.closest('[data-act]'); if (!a) { if (st.tip && !ev.target.closest('.a-tip')) { st.tip = null; render(); } return; }
      var act = a.getAttribute('data-act');
      if (act === 'tiplink') { ev.preventDefault(); toast('목업: 개별디자인 TIP 게시글로 이동합니다(주소 확정 전).'); }
      else if (act === 'save') { if (opts.onSave) opts.onSave(st.maxAuto); toast('목업: 저장했습니다. 저장 동작은 현행과 같습니다.'); }
      else if (act === 'cancel' || act === 'close') toast('목업: 모달 닫기는 현행과 같습니다.');
    });
    root.addEventListener('change', function (ev) { if (ev.target.name === 'maxauto') st.maxAuto = ev.target.value; });
    root.addEventListener('mouseover', function (ev) { var h = ev.target.closest('[data-tip="maxauto"]'); if (h && st.tip !== 'maxauto' && opts.hover !== false) { st.tip = 'maxauto'; render(); } });
    root.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && st.tip) { st.tip = null; render(); } });
    render();
    return { state: st, render: render, set: function (p) { Object.keys(p).forEach(function (k) { st[k] = p[k]; }); render(); } };
  }
  g.AdminCouponSetting = { mount: mount, TIP_ADD: TIP_ADD, TIP_LINK: TIP_LINK };
})(window);
