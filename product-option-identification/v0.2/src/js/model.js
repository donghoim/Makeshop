// 옵션코드 목업 상태 모델: 발급·유지·종료 규칙만 담당합니다(화면 없음).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OptModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let idc = 1000;
  const nid = (p) => p + (++idc);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const pad = (n) => String(n).padStart(9, '0'); // 순번 9자리, 0 채움. 999999999를 넘으면 자릿수가 늘어납니다.
  const seqOf = (code) => (code ? Number(String(code).split('-').pop()) : Infinity);
  const splitList = (t) => String(t || '').split(',').map((s) => s.trim()).filter(Boolean);
  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

  // 옵션값 문자열을 다시 읽을 때 기존 옵션값 id를 이어 받습니다.
  // 1) 같은 이름은 같은 id. 저장 전 팝업 안에서 지웠다가 다시 넣은 이름은 팝업을 열 때의 id(origVals)를 되살립니다.
  // 2) 위치로 맞추지 않습니다. 글자가 다른 값은 이름을 바꿨더라도 새 옵션값(새 코드)입니다.
  function reconcile(oldVals, texts, prices, origVals) {
    const used = new Set();
    const pool = [...oldVals, ...(origVals || []).filter((o) => !oldVals.some((x) => x.id === o.id))];
    const out = texts.map((t) => {
      const hit = pool.find((o) => o.text === t && !used.has(o.id));
      if (hit) { used.add(hit.id); return { ...hit }; }
      return null;
    });
    out.forEach((v, i) => {
      if (v) return;
      out[i] = { id: nid('v'), text: texts[i], price: 0 };
    });
    out.forEach((v, i) => { v.price = Number(prices[i]) || 0; });
    return out;
  }

  function setOptionValues(opt, valuesText, pricesText, origVals) {
    const texts = splitList(valuesText);
    if (new Set(texts).size !== texts.length) throw Error('같은 옵션값이 중복되었습니다. 옵션값을 확인해 주세요.');
    opt.vals = reconcile(opt.vals || [], texts, splitList(pricesText), origVals);
    return opt;
  }

  // 조합옵션 재조합: 조합에 쓰는 옵션명 구성이 같으면 같은 조합(옵션값 id 묶음)의 행과 옵션코드를 유지합니다.
  // orig(팝업을 열 때의 상태)를 함께 보므로 저장 전에 지웠다 다시 만든 조합도 원래 행·코드를 되살립니다.
  // keep: 재조합 확인창 선택. true(기존 데이터 유지)는 같은 조합의 재고·상태·관리코드 등을 유지하고,
  // false(초기화)는 같은 조합도 재고 0·상태 판매로 초기화합니다. 옵션코드는 어느 쪽이든 유지합니다.
  // 옵션가격은 어느 쪽이든 옵션 설정에 입력한 값으로 다시 계산합니다.
  const RESET = { stock: 0, status: '판매', stop: 0, mcode: '', memo: '' };
  function recombine(base, orig, keep) {
    if (keep === undefined) keep = true;
    const opts = base.opts.filter((o) => o.combo && o.vals.length);
    if (!opts.length) throw Error('조합할 옵션을 선택해 주세요. (조합 체크 후 옵션값 입력)');
    const sig = opts.map((o) => o.id).join('|');
    const sameStructure = sig === base.sig;
    let combos = [[]];
    opts.forEach((o) => { combos = combos.flatMap((c) => o.vals.map((v) => [...c, v])); });
    const rows = combos.map((c) => {
      const key = c.map((v) => v.id).join('_');
      const labels = c.map((v) => v.text);
      const old = (sameStructure && base.rows.find((r) => r.key === key)) || (orig && sig === orig.sig && orig.rows.find((r) => r.key === key));
      const price = c.reduce((a, v) => a + (v.price || 0), 0);
      if (old) return keep ? { ...old, labels, price } : { ...old, ...RESET, labels, price };
      return { id: nid('r'), key, labels, price, ...RESET, code: '' };
    });
    return { ...base, sig, heads: opts.map((o) => o.name), rows, composed: rows.map((r) => r.key) };
  }

  // 저장 전 확인: 마지막 재조합 이후 조합에 쓰는 옵션 구성·옵션값이 바뀌었으면 재조합이 필요합니다.
  // 조합 목록에서 행을 직접 지운 것은 허용합니다(composed는 재조합 직후의 전체 조합).
  const comboSig = (opts) => opts.filter((o) => o.combo && o.vals.length).map((o) => o.id).join('|');
  function comboKeys(opts) {
    let keys = [''];
    opts.filter((o) => o.combo && o.vals.length).forEach((o) => { keys = keys.flatMap((k) => o.vals.map((v) => (k ? k + '_' : '') + v.id)); });
    return keys;
  }
  function needsRecombine(base) {
    if (!base.rows.length) return false;
    if (comboSig(base.opts) !== base.sig) return true;
    const composed = new Set(base.composed || base.rows.map((r) => r.key));
    const now = comboKeys(base.opts);
    return now.some((k) => !composed.has(k)) || base.rows.some((r) => !now.includes(r.key));
  }

  // 개별옵션 구성: 개별 옵션값마다 1행, 같은 옵션값 id는 기존 행 유지.
  const pairOf = (name, value) => name + '\u0001' + value;
  const indivPairs = (opts) => opts.filter((o) => o.use !== 'N').flatMap((o) => o.vals.map((v) => pairOf(o.name, v.text)));
  function composeIndiv(indiv, origRows) {
    const pairs = indivPairs(indiv.opts);
    // 서로 다른 개별옵션 항목이라도 옵션명·옵션값이 같으면 같은 판매 단위가 되므로 막습니다(POL-045).
    if (new Set(pairs).size !== pairs.length) throw Error('같은 개별 옵션명과 옵션값이 중복되었습니다. 옵션명이나 옵션값을 확인해 주세요.');
    const rows = [], used = new Set();
    indiv.opts.filter((o) => o.use !== 'N').forEach((o) => o.vals.forEach((v) => {
      const key = o.id + '_' + v.id;
      // 개별옵션은 옵션 항목과 옵션값 글자가 모두 같을 때만 유지(현행 동작). 기존 행 하나는 한 번만 이어 받습니다.
      const same = (r) => r.name === o.name && r.value === v.text && !used.has(r.id);
      const old = indiv.rows.find(same) || (origRows || []).find(same);
      if (old) used.add(old.id);
      rows.push(old ? { ...old, key, name: o.name, value: v.text } : { id: nid('i'), key, name: o.name, value: v.text, price: v.price || 0, stock: 0, status: '판매', code: '' });
    }));
    if (!rows.length) throw Error('개별 옵션명과 옵션값을 입력해 주세요.');
    return { ...indiv, rows, composed: pairs };
  }
  // 저장 전 확인: 마지막 구성 이후 옵션명·옵션값·사용 여부가 바뀌었으면 다시 구성해야 합니다. 행 직접 삭제는 허용합니다.
  function needsRecompose(indiv) {
    if (!indiv.rows.length) return false;
    const composed = new Set(indiv.composed || indiv.rows.map((r) => pairOf(r.name, r.value)));
    const now = indivPairs(indiv.opts);
    return now.some((k) => !composed.has(k)) || indiv.rows.some((r) => !now.includes(pairOf(r.name, r.value)));
  }

  // 하이브리드: 저장 전 팝업 안에서 지웠다 같은 옵션명·옵션값으로 다시 넣은 값은 팝업을 열 때의 값(id·코드)을 되살립니다.
  function restoreHybrid(h, origH) {
    const ids = new Set(h.groups.flatMap((g) => g.values.map((v) => v.id)));
    h.groups.forEach((g) => g.values.forEach((v, i) => {
      if (v.code || !origH) return;
      for (const og of origH.groups) {
        if (og.name !== g.name) continue;
        const ov = og.values.find((x) => x.text === v.text.trim() && !ids.has(x.id));
        if (ov) { ids.add(ov.id); g.values[i] = { ...v, id: ov.id, code: ov.code }; return; }
      }
    }));
    return h;
  }

  // 옵션코드가 있는 행은 순번 오름차순, 없는 행은 뒤에 원래 순서대로.
  function sortByCode(rows) {
    return rows.map((r, i) => ({ r, i })).sort((a, b) => (seqOf(a.r.code) - seqOf(b.r.code)) || (a.i - b.i)).map((x) => x.r);
  }

  const kindOf = (p) => (p.optionUse === 'H' ? 'hybrid' : p.optionUse === 'Y' && p.mode === 'combo' ? 'combo' : 'simple');
  const typeSig = (p) => p.optionUse + (p.optionUse === 'Y' ? ':' + p.mode : '');
  function issue(p) { p.maxSeq = (p.maxSeq || 0) + 1; return 'M' + p.uid + '-' + pad(p.maxSeq); }

  // 코드가 없는 판매 단위에 번호를 부여합니다. 다음 번호는 이 상품에서 쓴 가장 큰 번호 + 1입니다(지운 번호 재사용 없음). 보정 전 상품(assigned=false)은 발급하지 않습니다.
  function assign(p) {
    if (!p.assigned) return p;
    const kind = kindOf(p);
    if (kind === 'combo') sortByCode(p.base.rows).forEach((r) => { if (!r.code) r.code = issue(p); });
    if (kind === 'simple' && !p.simple.code) p.simple.code = issue(p);
    if (kind === 'hybrid') p.hybrid.groups.forEach((g) => g.values.forEach((v) => { if (!v.code) v.code = issue(p); }));
    if (p.indivUse === 'Y') p.indiv.rows.forEach((r) => { if (!r.code) r.code = issue(p); });
    return p;
  }

  function validate(d) {
    if (!String(d.name || '').trim()) throw Error('기본 상품명을 입력해 주세요.');
    if (!(Number(d.price) >= 0) || String(d.price).trim() === '') throw Error('판매가격을 입력해 주세요.');
    if (d.optionUse === 'Y' && d.mode === 'combo' && !d.base.rows.length) throw Error('기본옵션을 등록해 주세요. [옵션등록/수정]에서 옵션을 조합한 뒤 저장해 주세요.');
    if (d.optionUse === 'H' && !d.hybrid.groups.some((g) => g.values.length)) throw Error('하이브리드 옵션을 등록해 주세요.');
    if (d.indivUse === 'Y' && !d.indiv.rows.length) throw Error('개별옵션을 등록해 주세요.');
    return true;
  }

  // scope: 'all'(상품 저장) | 'base'(기본옵션·하이브리드 팝업 저장) | 'indiv'(개별옵션 팝업 저장)
  function commit(saved, draft, scope, newUid) {
    const isNew = !saved;
    const next = isNew ? clone(draft) : clone(saved);
    if (isNew) Object.assign(next, { uid: newUid, state: 'active', assigned: true, maxSeq: 0, created: now() });
    if (scope === 'all' || scope === 'base') {
      const changed = !isNew && typeSig(saved) !== typeSig(draft);
      Object.assign(next, { optionUse: draft.optionUse, mode: draft.mode, base: clone(draft.base), hybrid: clone(draft.hybrid), simple: clone(draft.simple) });
      const k = kindOf(next);
      // 구조 변경(옵션 유형 전환)이면 기존 코드는 종료하고 새로 발급합니다.
      if (k !== 'combo' || changed) next.base.rows.forEach((r) => { r.code = ''; });
      if (k !== 'hybrid' || changed) next.hybrid.groups.forEach((g) => g.values.forEach((v) => { v.code = ''; }));
      if (k !== 'simple' || changed) next.simple.code = '';
    }
    if (scope === 'all' || scope === 'indiv') {
      const was = !isNew && saved.indivUse === 'Y';
      next.indivUse = draft.indivUse;
      next.indiv = clone(draft.indiv);
      if (next.indivUse !== 'Y' || !was) next.indiv.rows.forEach((r) => { r.code = ''; });
    }
    if (scope === 'all') Object.assign(next, { name: draft.name, price: draft.price, stock: draft.stock });
    next.updated = now();
    return assign(next);
  }

  // 현재 사용 중인 옵션코드 목록(검색·표시용).
  function codesOf(p) {
    const out = [];
    const k = kindOf(p);
    if (k === 'combo') p.base.rows.forEach((r) => r.code && out.push({ code: r.code, label: r.labels.join(' / ') }));
    if (k === 'simple' && p.simple.code) out.push({ code: p.simple.code, label: '기본 품목' });
    if (k === 'hybrid') p.hybrid.groups.forEach((g) => g.values.forEach((v) => v.code && out.push({ code: v.code, label: g.name + ': ' + v.text })));
    if (p.indivUse === 'Y') p.indiv.rows.forEach((r) => r.code && out.push({ code: r.code, label: '[개별] ' + r.name + ': ' + r.value }));
    return out;
  }

  const newOpt = () => ({ id: nid('o'), name: '', req: true, combo: true, use: 'Y', oneclick: false, scode: '', valuesText: '', pricesText: '', vals: [] });
  const newIndivOpt = () => ({ id: nid('io'), name: '', use: 'Y', valuesText: '', pricesText: '', vals: [] });
  const newGroup = () => ({ id: nid('g'), name: '', min: '', max: '', values: [newHybridValue()] });
  const newHybridValue = () => ({ id: nid('h'), text: '', price: 0, stock: 0, status: '판매', stop: 0, memo: '', min: 1, max: '', code: '' });
  const emptyProduct = () => ({ uid: null, name: '', price: '', stock: 0, state: 'draft', assigned: true, maxSeq: 0, optionUse: 'N', mode: 'combo',
    base: { opts: [], sig: '', heads: [], rows: [] }, simple: { code: '' }, hybrid: { stockUse: 'Y', groups: [] }, indivUse: 'N', indiv: { opts: [], rows: [] } });

  return { clone, nid, splitList, setOptionValues, recombine, needsRecombine, composeIndiv, needsRecompose, restoreHybrid, sortByCode, kindOf, assign, validate, commit, codesOf, seqOf,
    newOpt, newIndivOpt, newGroup, newHybridValue, emptyProduct };
});
