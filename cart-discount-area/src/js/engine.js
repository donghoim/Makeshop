/* 장바구니 할인 계산 엔진 (정책서 4.3~4.12 기준, 절사는 원 단위 반올림으로 단순화) */
(function (g) {
  var D = g.CART_DATA;

  function rateOf(base, rule) {
    if (!rule) return 0;
    var a = rule.type === 'rate' ? Math.round(base * rule.v / 100) : rule.v;
    if (rule.max) a = Math.min(a, rule.max);
    return Math.max(0, Math.min(a, base));
  }

  /* 상품 할인 1차(리바이·기간·신상품 중 1개) → 2차(대량 구매) → 3차(상품별 그룹) */
  function productDiscount(it) {
    var base = it.price + (it.optDisc ? it.optAdd : 0);
    var p = it.pd || {};
    var d1 = base - rateOf(base, p.first);
    var d2 = p.bulk && it.qty >= p.bulk.minQty ? d1 - rateOf(d1, p.bulk) : d1;
    var d3 = d2 - rateOf(d2, p.group);
    return (base - d3) * it.qty;
  }

  function issuerMatch(c, supplier, cartType) {
    if (c.issuer === 'HQSUP') return cartType.indexOf('int2') === 0 ? true : supplier === 'HQ';
    return c.issuer === supplier;
  }

  function unitKeyOf(it, cartType) {
    return D.CART_TYPES[cartType].unit === 'all' ? 'ALL' : it.supplier;
  }

  /* 상품 쿠폰 적용 가능 판정 */
  function productEligible(c, line, cartType) {
    if (c.kind !== 'P' || !line.couponOk) return false;
    if (!issuerMatch(c, line.supplier, cartType)) return false;
    if (c.targets && c.targets.indexOf(line.id) < 0) return false;
    return line.goods >= (c.min || 0);
  }
  function productInScope(c, line, cartType) {
    return c.kind === 'P' && line.couponOk && issuerMatch(c, line.supplier, cartType) && !(c.targets && c.targets.indexOf(line.id) < 0);
  }

  function cartBaseItems(c, unitLines, cartType) {
    return unitLines.filter(function (l) { return l.couponOk && issuerMatch(c, l.supplier, cartType); });
  }
  function cartEligible(c, unitLines, cartType) {
    if (c.kind !== 'C') return false;
    var items = cartBaseItems(c, unitLines, cartType);
    if (!items.length) return false;
    var goods = items.reduce(function (s, l) { return s + l.goods; }, 0);
    return goods >= (c.min || 0);
  }
  function cartInScope(c, unitLines, cartType) {
    return c.kind === 'C' && cartBaseItems(c, unitLines, cartType).length > 0;
  }

  function applySeq(base, list) {
    var rest = base, total = 0;
    list.forEach(function (c) { var a = rateOf(rest, c); rest -= a; total += a; });
    return total;
  }

  /* 토글 ON: 중복 사용 가능 쿠폰만으로 최저 결제 금액 조합 (단독 쿠폰 1개 + 중복 쿠폰) */
  function autoSelectP(lines, coupons, cartType, sel, used) {
    /* 할인액이 큰 (쿠폰, 상품) 조합부터 배정: 상품당 단독 쿠폰 1개, 쿠폰당 1개 상품 */
    var pairs = [];
    lines.forEach(function (l) {
      sel.P[l.id] = { single: null, dups: [] };
      coupons.forEach(function (c) {
        if (c.dupType || !c.dupAllowed || !productEligible(c, l, cartType)) return;
        pairs.push({ c: c, l: l, a: rateOf(l.afterPD, c) });
      });
    });
    pairs.sort(function (x, y) { return y.a - x.a; });
    pairs.forEach(function (p) {
      if (p.a <= 0 || used[p.c.id] || sel.P[p.l.id].single) return;
      used[p.c.id] = true; sel.P[p.l.id].single = p.c.id;
    });
    coupons.forEach(function (c) {
      if (!c.dupType || c.kind !== 'P') return;
      var target = null, tA = 0;
      lines.forEach(function (l) {
        if (!productEligible(c, l, cartType)) return;
        var a = rateOf(l.afterPD, c);
        if (a > tA) { tA = a; target = l; }
      });
      if (target) { sel.P[target.id].dups.push(c.id); used[c.id] = true; }
    });
  }

  function autoSelectC(units, coupons, cartType, sel, used) {
    Object.keys(units).forEach(function (k) {
      var best = null, bestA = 0, dups = [];
      coupons.forEach(function (c) {
        if (c.kind !== 'C' || used[c.id] || !cartEligible(c, units[k], cartType)) return;
        if (c.dupType) { dups.push(c.id); used[c.id] = true; return; }
        if (!c.dupAllowed) return;
        var base = cartBaseItems(c, units[k], cartType).reduce(function (s, l) { return s + l.afterPC; }, 0);
        var a = rateOf(base, c);
        if (a > bestA) { bestA = a; best = c; }
      });
      if (best) used[best.id] = true;
      sel.C[k] = { single: best ? best.id : null, dups: dups };
    });
  }

  function byId(id) { return D.COUPONS.filter(function (c) { return c.id === id; })[0]; }

  /* state: { cartType, items:[{...item, checked}], coupons:[...], toggle, manualSel:{P:{},C:{}}, shipBasis } */
  function compute(state) {
    var cartType = state.cartType;
    var all = state.items.map(function (it) {
      var goods = (it.price + it.optAdd) * it.qty;
      var pd = productDiscount(it);
      return { id: it.id, supplier: it.supplier, checked: it.checked, couponOk: it.couponOk !== false, goods: goods, pd: pd, afterPD: goods - pd, src: it };
    });
    var lines = all.filter(function (l) { return l.checked; });
    var coupons = state.loggedIn === false ? [] : state.coupons;

    var units = {};
    lines.forEach(function (l) { var k = unitKeyOf(l, cartType); (units[k] = units[k] || []).push(l); });

    /* 1차: 상품 쿠폰 선택 결정 (자동 또는 직접 선택) */
    lines.forEach(function (l) { l.afterPC = l.afterPD; });
    var sel, used = {};
    if (state.toggle) {
      sel = { P: {}, C: {} };
      autoSelectP(lines, coupons, cartType, sel, used);
    } else {
      sel = JSON.parse(JSON.stringify(state.manualSel || { P: {}, C: {} }));
      sel.P = sel.P || {}; sel.C = sel.C || {};
    }
    var released = [];
    /* 상품 쿠폰 계산 (사용 조건 미충족 쿠폰은 자동 해제) */
    lines.forEach(function (l) {
      var s = sel.P[l.id] || { single: null, dups: [] };
      var list = [];
      if (s.single) {
        var c = byId(s.single);
        if (c && productEligible(c, l, cartType)) list.push(c); else { released.push(s.single); s.single = null; }
      }
      s.dups = s.dups.filter(function (id) {
        var c = byId(id);
        var ok = c && productEligible(c, l, cartType) && !(list[0] && !list[0].dupAllowed);
        if (ok) list.push(c); else released.push(id);
        return ok;
      });
      sel.P[l.id] = s;
      l.pc = applySeq(l.afterPD, list);
      l.afterPC = l.afterPD - l.pc;
    });
    /* 장바구니 쿠폰 계산 (자동 적용은 상품 쿠폰 적용 후 금액 기준) */
    if (state.toggle) autoSelectC(units, coupons, cartType, sel, used);
    var unitResults = {};
    Object.keys(units).forEach(function (k) {
      var s = sel.C[k] || { single: null, dups: [] };
      var applied = [];
      if (s.single) {
        var c = byId(s.single);
        if (c && cartEligible(c, units[k], cartType)) applied.push(c); else { released.push(s.single); s.single = null; }
      }
      s.dups = s.dups.filter(function (id) {
        var c = byId(id);
        var ok = c && cartEligible(c, units[k], cartType) && !(applied[0] && !applied[0].dupAllowed);
        if (ok) applied.push(c); else released.push(id);
        return ok;
      });
      sel.C[k] = s;
      var cc = 0;
      applied.forEach(function (c) {
        var base = cartBaseItems(c, units[k], cartType).reduce(function (sum, l) { return sum + l.afterPC; }, 0) - cc;
        cc += rateOf(Math.max(0, base), c);
      });
      var goods = units[k].reduce(function (s2, l) { return s2 + l.goods; }, 0);
      unitResults[k] = { cc: cc, goods: goods };
    });

    /* 배송비: 공급사 묶음별, 할인 전(기본) 또는 최종 주문금액 기준 */
    var ship = 0, groupShip = {};
    var suppliers = {};
    lines.forEach(function (l) { (suppliers[l.supplier] = suppliers[l.supplier] || []).push(l); });
    Object.keys(suppliers).forEach(function (sp) {
      var rule = D.SHIPPING[sp];
      var basis = suppliers[sp].reduce(function (s2, l) { return s2 + (state.shipBasis === 'after' ? l.afterPC : l.goods); }, 0);
      var fee = basis >= rule.freeOver ? 0 : rule.fee;
      groupShip[sp] = fee; ship += fee;
    });

    var goodsSum = lines.reduce(function (s2, l) { return s2 + l.goods; }, 0);
    var pdSum = lines.reduce(function (s2, l) { return s2 + l.pd; }, 0);
    var pcSum = lines.reduce(function (s2, l) { return s2 + l.pc; }, 0);
    var ccSum = Object.keys(unitResults).reduce(function (s2, k) { return s2 + unitResults[k].cc; }, 0);
    var totalGoods = goodsSum + ship;
    var totalDisc = Math.min(pdSum + pcSum + ccSum, totalGoods);

    /* 적용 가능한 할인 존재 여부 (토글 비활성화 판정) */
    var anyCoupon = coupons.some(function (c) {
      if (c.kind === 'P') return lines.some(function (l) { return productEligible(c, l, cartType); });
      return Object.keys(units).some(function (k) { return cartEligible(c, units[k], cartType); });
    });
    var applicable = pdSum > 0 || anyCoupon;

    return {
      lines: lines, all: all, units: units, unitResults: unitResults, groupShip: groupShip, sel: sel, released: released,
      goodsSum: goodsSum, ship: ship, totalGoods: totalGoods, pdSum: pdSum, pcSum: pcSum, ccSum: ccSum,
      totalDisc: totalDisc, final: Math.max(0, totalGoods - totalDisc), applicable: applicable,
      showDisc: totalDisc > 0, showOrderNotice: pcSum + ccSum > 0
    };
  }

  /* 모달 목록: 해당 적용 단위에서 보유 쿠폰을 적용 가능/불가로 나눔 */
  function modalLists(state, result, kind, key) {
    var cartType = state.cartType;
    var coupons = state.loggedIn === false ? [] : state.coupons;
    var usedElsewhere = {};
    Object.keys(result.sel.P).forEach(function (k) { if (!(kind === 'P' && k === key)) { var s = result.sel.P[k]; if (s.single) usedElsewhere[s.single] = true; s.dups.forEach(function (d) { usedElsewhere[d] = true; }); } });
    Object.keys(result.sel.C).forEach(function (k) { if (!(kind === 'C' && k === key)) { var s = result.sel.C[k]; if (s.single) usedElsewhere[s.single] = true; s.dups.forEach(function (d) { usedElsewhere[d] = true; }); } });
    var singles = [], dups = [], na = [];
    coupons.forEach(function (c) {
      if (c.kind !== kind) return;
      var inScope, ok;
      if (kind === 'P') {
        var line = result.lines.filter(function (l) { return l.id === key; })[0];
        if (!line) return;
        inScope = productInScope(c, line, cartType); ok = productEligible(c, line, cartType);
      } else {
        var u = result.units[key] || [];
        inScope = cartInScope(c, u, cartType); ok = cartEligible(c, u, cartType);
      }
      if (!inScope) return;
      if (!ok) { na.push(c); return; }
      var entry = { c: c, usedElsewhere: !!usedElsewhere[c.id] };
      (c.dupType ? dups : singles).push(entry);
    });
    return { singles: singles, dups: dups, na: na };
  }

  g.CartEngine = { compute: compute, modalLists: modalLists, byId: byId, rateOf: rateOf, unitKeyOf: unitKeyOf };
})(window);
