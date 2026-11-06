/* 상품 상세 최대할인가 목업 — 원본 요청
   정책 번호는 사양 정의서 14장 정책 원장(POL) 기준입니다.
   window.MaxApp: 화면정의서 브리지에서 호출하는 API */
(function () {
  "use strict";
  const M = window.MOCK;
  const AREAS = [
    ["productDc", "상품 할인"], ["groupDc", "상품 추가 할인"], ["productCoupon", "상품 쿠폰 할인"], ["orderCoupon", "장바구니 쿠폰 할인"],
    ["grade", "회원 등급 할인"], ["app", "앱 전용 할인"], ["reserve", "적립금 사용"], ["reserveSale", "적립금 즉시 할인"], ["payment", "결제수단별 프로모션"],
  ];
  const won = (n) => Math.round(n).toLocaleString("ko-KR") + "원";
  const minus = (n) => (n > 0 ? "-" : "") + won(n);
  const floor100 = (n) => Math.floor(n / 100) * 100;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let S;
  function fresh() {
    return {
      member: true, app: false, open: false, mobile: false,
      removed: {}, removeAll: false, couponFail: false, replaceText: false, reserveBlocked: false, zero: false,
      owned: Object.fromEntries(M.coupons.map((c) => [c.id, c.owned])),
      sel: new Set(), reserveUser: true, pay: null,
    };
  }

  /* ---------- 노출 판단 ---------- */
  function couponsIn(area) {
    if (S.couponFail) return [];
    return M.coupons.filter((c) => c.area === area); // 예시 쿠폰은 모두 다운로드 쿠폰(비회원·미보유 회원에게 받기로 노출, POL-027)
  }
  function paymentsVisible() {
    return M.payments.filter((p) => !p.rewardOnly && (S.member || !p.memberOnly)); // POL-054, POL-055
  }
  function visible(key) {
    if (S.removeAll || S.removed[key]) return false; // POL-010, POL-012
    if (key === "groupDc" || key === "grade" || key === "reserveSale") return S.member; // POL-015, POL-021
    if (key === "app") return S.app; // POL-042
    if (key === "productCoupon") return couponsIn("product").length > 0;
    if (key === "orderCoupon") return couponsIn("order").length > 0;
    if (key === "payment") return paymentsVisible().length > 0;
    return true;
  }
  const single = (c) => !c.dup;
  const isOn = (c) => S.sel.has(c.id);
  function nodupOn(area) { return couponsIn(area).find((c) => c.noDup && isOn(c)); }
  function couponDisabled(c) { const nd = nodupOn(c.area); return !!(nd && nd.id !== c.id); } // POL-034
  function reserveBlockedByCoupon() {
    return ["product", "order"].some((a) => visible(a === "product" ? "productCoupon" : "orderCoupon") && couponsIn(a).some((c) => c.noReserve && isOn(c)));
  }
  function reserveOwned() { return S.zero ? 200000 : M.reserve.owned; }
  function reserveUsable() { return S.member && !S.reserveBlocked && reserveOwned() > 0; } // POL-051

  /* ---------- 기본 선택 (POL-033, POL-046, POL-056) ---------- */
  function autoSelect() {
    S.sel.clear();
    const base = M.product.price * (1 - M.productDc.rate) * (S.member ? 1 - M.groupDc.rate : 1);
    ["product", "order"].forEach((a) => {
      if (!visible(a === "product" ? "productCoupon" : "orderCoupon")) return;
      const best = couponsIn(a).filter(single).sort((x, y) => cAmt(y, base) - cAmt(x, base))[0];
      if (best) S.sel.add(best.id);
    });
    S.reserveUser = true;
    S.pay = null;
    const r = calc();
    const sorted = r.payList.slice().sort((x, y) => y.amt - x.amt);
    S.payOrder = sorted.map((p) => p.id); // 정렬은 진입 시 차감액 기준으로 고정(POL-056)
    if (sorted.length) S.pay = sorted[0].id;
  }
  function cAmt(c, base) { return c.rate ? Math.round(base * c.rate) : c.amount; }

  /* ---------- 계산 (POL-009부터 POL-014까지, 영역별 POL) ---------- */
  function calc() {
    const P = M.product.price;
    let cur = P;
    const out = { lines: {}, payList: [] };
    const take = (key, amt) => { const eff = Math.max(0, Math.min(amt, cur)); cur -= eff; return eff; };
    if (visible("productDc")) out.lines.productDc = take("productDc", Math.round(P * M.productDc.rate));
    if (visible("groupDc")) out.lines.groupDc = take("groupDc", Math.round(cur * M.groupDc.rate));
    const base2 = cur;
    out.coupon = {};
    let pc = 0;
    if (visible("productCoupon")) couponsIn("product").forEach((c) => { const a = cAmt(c, base2); out.coupon[c.id] = a; if (isOn(c)) pc += a; });
    take("productCoupon", pc);
    const base3 = cur;
    let oc = 0;
    if (visible("orderCoupon")) couponsIn("order").forEach((c) => { const a = cAmt(c, base3); out.coupon[c.id] = a; if (isOn(c)) oc += a; });
    take("orderCoupon", oc);
    if (visible("reserveSale")) out.lines.reserveSale = take("reserveSale", Math.round(base3 * M.reserveSale.rate)); // POL-039
    if (visible("grade")) out.lines.grade = take("grade", Math.round(base3 * M.gradeDc.rate)); // POL-041
    if (visible("app")) out.lines.app = take("app", M.appDc.amount); // POL-043
    if (visible("reserve")) {
      const limit = S.zero ? reserveOwned() : floor100(base3 * M.reserve.limitRate);
      const use = S.member ? floor100(Math.min(reserveOwned(), limit)) : 0; // POL-045
      out.reserveUse = use;
      out.reserveOn = reserveUsable() && !reserveBlockedByCoupon() && S.reserveUser;
      if (out.reserveOn) take("reserve", use);
    }
    if (visible("payment")) {
      const pbase = cur; // OPEN-002: 주문서 기준 금액(목업은 보유 적립금 차감 후 금액)
      out.payList = paymentsVisible().map((p) => ({ id: p.id, name: p.name, amt: p.rate ? Math.round(pbase * p.rate) : Math.min(p.amount, pbase) }));
      const sp = out.payList.find((p) => p.id === S.pay);
      if (sp) take("payment", sp.amt);
    }
    out.final = Math.max(0, cur); // POL-007
    return out;
  }

  /* ---------- 렌더 ---------- */
  const row = (o) => `<div class="mb-row ${o.cls || ""}"${o.id ? ` data-row="${o.id}"` : ""}>${o.cb}<div class="nm">${o.nm}</div>${o.btn || ""}<div class="val">${o.val}</div></div>`;
  const cbAuto = '<span class="cb auto" aria-hidden="true"></span>';
  function render() {
    document.body.classList.toggle("is-mobile", S.mobile);
    const r = calc();
    const P = M.product.price;
    const dcPrice = P - Math.round(P * M.productDc.rate);
    let h = `<div class="tags">${M.product.tags.map((t) => `<span>${t}</span>`).join("")}</div>
      <h1 class="pname">${M.product.name}</h1><div class="peng">${M.product.eng}</div>`;
    if (S.replaceText) {
      h += `<div class="price-replace" id="price-replace">${M.product.replaceText}</div>`; // POL-003
    } else {
      h += `<div class="price-row" id="price-row"><b>${won(dcPrice)}</b><s>${won(P)}</s><span class="rate">20%</span>
        <span class="tools"><button class="btn-dark" data-act="noop">쿠폰받기 ⤓</button><span>♡</span><span>⇪</span></span></div>`;
      h += `<section class="mb" id="mb" aria-label="최대할인가">
        <div class="mb-sum"><div class="amt" id="mb-amt">${won(r.final)}<small>최대할인가</small></div>
        ${S.removeAll ? "" : `<button class="mb-toggle${S.open ? " on" : ""}" id="mb-toggle" data-act="toggle" aria-expanded="${S.open}">${S.open ? "닫기" : "자세히보기"}<i></i></button>`}</div>`;
      if (S.open && !S.removeAll) {
        h += `<div class="mb-detail" id="mb-detail">${AREAS.filter(([k]) => visible(k)).map(([k, t]) => `<div class="mb-area" data-area="${k}"><h4>${t}</h4>${areaBody(k, r)}</div>`).join("")}`;
        h += `<div class="mb-note">최종 결제 금액에 따라 최대할인가는 달라질 수 있습니다.</div></div>`;
      }
      h += `</section>`;
    }
    h += `<div class="opt"><div class="opt-line"><span>적립금</span><span>800원 (1%)</span></div><div class="opt-line"><span>배송비</span><span>3,000원 (50,000원 이상 무료)</span></div>
      <select aria-label="옵션 선택"><option>[필수] 색상 / 사이즈 선택</option></select>
      <div class="buy"><button data-act="noop">장바구니</button><button class="primary" data-act="noop">바로 구매</button></div></div>`;
    document.getElementById("info").innerHTML = h;
    renderDemo();
  }

  function areaBody(k, r) {
    if (k === "productDc") {
      return row({ cls: "auto", cb: cbAuto, nm: esc(M.productDc.name), val: minus(r.lines.productDc) }) +
        row({ cls: "auto", id: "bulk", cb: cbAuto, nm: esc(M.bulkDc.name), val: `<button class="btn-more" data-act="bulk">더보기 ∨</button>` }); // POL-017
    }
    if (k === "groupDc") return row({ cls: "auto", cb: cbAuto, nm: esc(M.groupDc.name), val: minus(r.lines.groupDc) });
    if (k === "productCoupon" || k === "orderCoupon") {
      const area = k === "productCoupon" ? "product" : "order";
      const list = couponsIn(area);
      const singles = list.filter(single), dups = list.filter((c) => c.dup);
      const one = (c) => {
        const dis = couponDisabled(c);
        const btn = S.member && S.owned[c.id] ? `<button class="btn-down done" disabled>발급완료</button>` : `<button class="btn-down" data-act="down" data-id="${c.id}">받기</button>`;
        return row({ id: c.id, cls: dis ? "mute" : "", cb: `<button class="cb${isOn(c) ? " on" : ""}${dis ? " dis" : ""}" data-act="coupon" data-id="${c.id}" aria-pressed="${isOn(c)}" aria-label="${esc(c.name)}"></button>`,
          nm: `${esc(c.name)}${c.noDup ? '<span class="tag-nodup">중복불가</span>' : ""}${c.cond ? `<small>(${esc(c.cond)})</small>` : ""}`, btn, val: minus(r.coupon[c.id]) });
      };
      return singles.map(one).join("") + (singles.length && dups.length ? '<div class="mb-sep"></div>' : "") + dups.map(one).join("");
    }
    if (k === "grade") return row({ cls: "auto", cb: cbAuto, nm: esc(M.gradeDc.name), val: minus(r.lines.grade) });
    if (k === "app") return row({ cls: "auto", cb: cbAuto, nm: esc(M.appDc.name), val: minus(r.lines.app) });
    if (k === "reserveSale") return row({ cls: "auto", cb: cbAuto, nm: esc(M.reserveSale.name), val: minus(r.lines.reserveSale) });
    if (k === "reserve") {
      const blocked = reserveBlockedByCoupon();
      const usable = reserveUsable() && !blocked;
      const h = row({ id: "reserve", cls: usable ? "" : "mute", cb: `<button class="cb${r.reserveOn ? " on" : ""}${usable ? "" : " dis"}" data-act="reserve" aria-pressed="${!!r.reserveOn}" aria-label="보유 적립금 사용"></button>`,
        nm: "보유 적립금 사용", val: usable ? minus(r.reserveUse) : won(r.reserveUse) });
      return h + (S.member && blocked ? '<div class="mb-warn" id="reserve-warn">선택한 쿠폰은 적립금과 함께 사용할 수 없습니다.</div>' : "");
    }
    if (k === "payment") {
      return r.payList.slice().sort((a, b) => (S.payOrder || []).indexOf(a.id) - (S.payOrder || []).indexOf(b.id)).map((p) => row({ id: p.id, cb: `<button class="cb${S.pay === p.id ? " on" : ""}" data-act="pay" data-id="${p.id}" aria-pressed="${S.pay === p.id}" aria-label="${esc(p.name)}"></button>`, nm: esc(p.name), val: minus(p.amt) })).join(""); // POL-056
    }
    return "";
  }

  /* ---------- 동작 ---------- */
  function toast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800); }
  function dialog(title, body) {
    const d = document.getElementById("dlg");
    d.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h5>${esc(title)}</h5>${body}<div class="acts"><button data-act="close">확인</button></div></div>`;
    d.hidden = false;
  }
  function clickCoupon(id) {
    const c = M.coupons.find((x) => x.id === id);
    if (couponDisabled(c)) return;
    if (isOn(c)) { S.sel.delete(id); render(); return; }
    if (single(c)) couponsIn(c.area).filter(single).forEach((x) => S.sel.delete(x.id)); // 단일 쿠폰은 영역당 1개
    if (c.noDup) couponsIn(c.area).forEach((x) => S.sel.delete(x.id)); // 중복 불가: 단독 선택
    S.sel.add(id);
    render(); // 보유 적립금 체크 상태(reserveUser)는 바꾸지 않음(POL-048)
  }
  function download(id) {
    const c = M.coupons.find((x) => x.id === id);
    if (!S.member) { dialog("알림", "<p>로그인 후 이용 가능합니다.</p><p style=\"color:#767676;font-size:12px\">확인을 누르면 로그인 화면으로 이동합니다(목업은 이동하지 않음).</p>"); return; } // POL-035
    if (c.appOnly && !S.app) { dialog("알림", "<p>해당 쿠폰은 (모바일 웹, 앱)에서 다운이 가능합니다.</p>"); return; }
    S.owned[id] = true; render(); toast("쿠폰이 발급되었습니다.");
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === "toggle") { S.open = !S.open; render(); }
    else if (act === "coupon") clickCoupon(id);
    else if (act === "down") download(id);
    else if (act === "reserve") { if (!reserveUsable() || reserveBlockedByCoupon()) return; S.reserveUser = !S.reserveUser; render(); } // POL-047
    else if (act === "pay") { S.pay = S.pay === id ? null : id; render(); } // POL-057
    else if (act === "bulk") dialog(M.bulkDc.name, `<p>수량에 따라 할인되며 최대할인가에는 반영되지 않습니다.</p><ul>${M.bulkDc.tiers.map((t) => `<li>${t}</li>`).join("")}</ul>`);
    else if (act === "close") document.getElementById("dlg").hidden = true;
    else if (act === "noop") toast("목업에서는 동작하지 않습니다.");
  });

  /* ---------- 시나리오 패널 ---------- */
  function renderDemo() {
    const d = document.getElementById("demo");
    const ck = (key, label, on) => `<label><input type="checkbox" data-demo="${key}"${on ? " checked" : ""}>${label}</label>`;
    d.innerHTML = `<div class="demo-head">목업 시나리오<button data-demo-fold>${d.classList.contains("closed") ? "펼치기" : "접기"}</button></div><div class="demo-body">
      <h6>방문자</h6><label><input type="radio" name="who" data-demo="member"${S.member ? " checked" : ""}>회원(일반회원)</label><label><input type="radio" name="who" data-demo="guest"${S.member ? "" : " checked"}>비회원</label>
      ${ck("app", "파워앱 접속", S.app)}${ck("mobile", "모바일 화면", S.mobile)}
      <h6>개별디자인에서 영역 지우기</h6>${AREAS.map(([k, t]) => ck("rm-" + k, t, S.removed[k])).join("")}${ck("removeAll", "상세 내역 전체", S.removeAll)}
      <h6>설정·상태</h6>${ck("reserveBlocked", "적립금 사용 조건 미충족", S.reserveBlocked)}${ck("couponFail", "쿠폰 조회 실패", S.couponFail)}${ck("zero", "0원 사례(적립금 20만 원, 한도 없음)", S.zero)}${ck("replaceText", "가격 대체 문구 상품", S.replaceText)}
      <button class="reset" data-demo-reset>처음 상태로</button></div>`;
  }
  document.addEventListener("change", (e) => {
    const k = e.target.dataset && e.target.dataset.demo;
    if (!k) return;
    const v = e.target.checked;
    if (k === "member") set({ member: true }); else if (k === "guest") set({ member: false });
    else if (k.startsWith("rm-")) { S.removed[k.slice(3)] = v; reinit(); }
    else set({ [k]: v });
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-demo-fold]")) { document.getElementById("demo").classList.toggle("closed"); renderDemo(); }
    if (e.target.closest("[data-demo-reset]")) { S = fresh(); autoSelect(); render(); }
  });
  function set(o) { Object.assign(S, o); if (!("mobile" in o)) reinit(); else render(); }
  function reinit() { const keepOpen = S.open; autoSelect(); S.open = keepOpen; render(); } // 설정이 바뀌면 진입 시 기본 선택부터 다시 계산(POL-013)

  /* ---------- 화면정의서 브리지 API ---------- */
  window.MaxApp = {
    reset() { S = fresh(); autoSelect(); render(); },
    open(v = true) { S.open = v; render(); },
    guest() { S.member = false; reinit(); },
    app() { S.app = true; reinit(); },
    mobile() { S.mobile = true; render(); },
    remove(...keys) { keys.forEach((k) => (S.removed[k] = true)); reinit(); },
    removeAll() { S.removeAll = true; reinit(); },
    flag(k) { S[k] = true; reinit(); },
    coupon(id) { clickCoupon(id); },
    down(id) { download(id); },
    reserve() { S.reserveUser = !S.reserveUser; render(); },
    pay(id) { S.pay = S.pay === id ? null : id; render(); },
    bulk() { document.querySelector('[data-act="bulk"]').click(); },
    state() { return S; },
  };
  S = fresh(); autoSelect(); render();
})();
