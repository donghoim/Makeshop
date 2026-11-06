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
  const pad = (n) => String(n).padStart(4, '0');
  const seqOf = (code) => (code ? Number(String(code).split('-').pop()) : Infinity);
  const splitList = (t) => String(t || '').split(',').map((s) => s.trim()).filter(Boolean);
  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

  // 옵션값 문자열을 다시 읽을 때 기존 옵션값 id를 이어 받습니다.
  // 1) 같은 이름은 같은 id. 저장 전 팝업 안에서 지웠다가 다시 넣은 이름은 팝업을 열 때의 id(origVals)를 되살립니다.
  // 2) 같은 자리의 기존 이름이 입력값에서 사라졌으면 이름 변경(같은 id)으로 봅니다. 값 추가와 함께 바꿔도 같습니다.
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
      const o = oldVals[i];
      if (o && !used.has(o.id) && !texts.includes(o.text)) { used.add(o.id); out[i] = { ...o, text: texts[i] }; }
      else out[i] = { id: nid('v'), text: texts[i], price: 0 };
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

  // 조합옵션 재조합: 조합에 쓰는 옵션명 구성이 같으면 같은 조합(옵션값 id 묶음)의 행을 그대로 유지합니다.
  // orig(팝업을 열 때의 상태)를 함께 보므로 저장 전에 지웠다 다시 만든 조합도 원래 행·코드를 되살립니다.
  function recombine(base, orig) {
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
      if (old) return { ...old, labels };
      return { id: nid('r'), key, labels, price: c.reduce((a, v) => a + (v.price || 0), 0), stock: 0, status: '판매', stop: 0, mcode: '', memo: '', code: '' };
    });
    return { ...base, sig, heads: opts.map((o) => o.name), rows };
  }

  // 개별옵션 구성: 개별 옵션값마다 1행, 같은 옵션값 id는 기존 행 유지.
  function composeIndiv(indiv, origRows) {
    const rows = [];
    indiv.opts.filter((o) => o.use !== 'N').forEach((o) => o.vals.forEach((v) => {
      const key = o.id + '_' + v.id;
      const old = indiv.rows.find((r) => r.key === key) || (origRows || []).find((r) => r.key === key);
      rows.push(old ? { ...old, name: o.name, value: v.text } : { id: nid('i'), key, name: o.name, value: v.text, price: v.price || 0, stock: 0, status: '판매', code: '' });
    }));
    if (!rows.length) throw Error('개별 옵션명과 옵션값을 입력해 주세요.');
    return { ...indiv, rows };
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
  function issue(p) { p.maxSeq = (p.maxSeq || 0) + 1; return p.uid + '-' + pad(p.maxSeq); }

  // 코드가 없는 판매 단위에 화면 표시 순서대로 발급합니다. 보정 전 상품(assigned=false)은 발급하지 않습니다.
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

  return { clone, nid, splitList, setOptionValues, recombine, composeIndiv, restoreHybrid, sortByCode, kindOf, assign, validate, commit, codesOf, seqOf,
    newOpt, newIndivOpt, newGroup, newHybridValue, emptyProduct };
});
