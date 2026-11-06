// 목업 예시 데이터. 기존 상품은 배포 시 일괄 발급이 끝난 상태를 가정합니다.
(function () {
  const v = (id, text, price) => ({ id, text, price: price || 0 });
  const opt = (id, name, vals, extra) => ({ id, name, req: true, combo: true, use: 'Y', oneclick: false, scode: '', vals,
    valuesText: vals.map((x) => x.text).join(','), pricesText: vals.map((x) => x.price).join(','), ...(extra || {}) });
  const row = (id, key, labels, code, extra) => ({ id, key, labels, price: 0, stock: 10, status: '판매', stop: 0, mcode: '', memo: '', code, ...(extra || {}) });
  const base0 = () => ({ opts: [], sig: '', heads: [], rows: [] });
  const hybrid0 = () => ({ stockUse: 'Y', groups: [] });
  const indiv0 = () => ({ opts: [], rows: [] });

  window.OPT_MOCK = {
    nextUid: 1100007001,
    products: [
      { uid: '1100006925', name: '소프트 코튼 오버핏 셔츠', price: 42000, stock: 0, state: 'active', assigned: true, maxSeq: 6, optionUse: 'Y', mode: 'combo',
        created: '2026-07-10 08:50:43', updated: '2026-09-02 14:12:05', display: '진열',
        base: { sig: 'o1|o2', heads: ['색상', '사이즈'],
          opts: [opt('o1', '색상', [v('v1', '블랙'), v('v2', '화이트')]), opt('o2', '사이즈', [v('v3', 'S'), v('v4', 'M'), v('v5', 'L', 1000)])],
          rows: [
            row('r1', 'v1_v3', ['블랙', 'S'], '1100006925-0001', { stock: 24, mcode: 'SH-BK-S' }),
            row('r2', 'v1_v4', ['블랙', 'M'], '1100006925-0002', { stock: 18, mcode: 'SH-BK-M' }),
            row('r5', 'v1_v5', ['블랙', 'L'], '1100006925-0005', { stock: 0, price: 1000, status: '품절', mcode: 'SH-BK-L' }),
            row('r3', 'v2_v3', ['화이트', 'S'], '1100006925-0003', { stock: 30, mcode: 'SH-WH-S' }),
            row('r4', 'v2_v4', ['화이트', 'M'], '1100006925-0004', { stock: 12, mcode: 'SH-WH-M' }),
            row('r6', 'v2_v5', ['화이트', 'L'], '1100006925-0006', { stock: 7, price: 1000, mcode: 'SH-WH-L' })] },
        simple: { code: '' }, hybrid: hybrid0(), indivUse: 'N', indiv: indiv0() },

      { uid: '1100006926', name: '에센셜 캔버스 숄더백', price: 35000, stock: 100, state: 'active', assigned: true, maxSeq: 1, optionUse: 'Y', mode: 'nocombo',
        created: '2026-07-11 10:02:11', updated: '2026-08-21 09:40:00', display: '진열',
        base: { sig: '', heads: [], rows: [], opts: [opt('o11', '색상', [v('v11', '베이지'), v('v12', '블랙')], { combo: false })] },
        simple: { code: '1100006926-0001' }, hybrid: hybrid0(), indivUse: 'N', indiv: indiv0() },

      { uid: '1100006927', name: '데일리 코튼 양말 3종', price: 9900, stock: 0, state: 'active', assigned: true, maxSeq: 5, optionUse: 'H', mode: 'combo',
        created: '2026-07-15 16:20:00', updated: '2026-09-10 11:05:41', display: '진열',
        base: base0(), simple: { code: '' },
        hybrid: { stockUse: 'Y', groups: [
          { id: 'g1', name: '색상', min: '', max: '', values: [
            { id: 'h3', text: '그레이', price: 0, stock: 0, status: '품절', stop: 0, memo: '', min: 1, max: '', code: '1100006927-0003' },
            { id: 'h1', text: '화이트', price: 0, stock: 40, status: '판매', stop: 0, memo: '', min: 1, max: '', code: '1100006927-0001' },
            { id: 'h2', text: '블랙', price: 0, stock: 25, status: '판매', stop: 0, memo: '', min: 1, max: '', code: '1100006927-0002' }] },
          { id: 'g2', name: '길이', min: '', max: '', values: [
            { id: 'h4', text: '단목', price: 0, stock: 60, status: '판매', stop: 0, memo: '', min: 1, max: '', code: '1100006927-0004' },
            { id: 'h5', text: '장목', price: 500, stock: 35, status: '판매', stop: 0, memo: '', min: 1, max: '', code: '1100006927-0005' }] }] },
        indivUse: 'N', indiv: indiv0() },

      { uid: '1100006928', name: '스테인리스 진공 텀블러 500ml', price: 24000, stock: 80, state: 'active', assigned: true, maxSeq: 5, optionUse: 'N', mode: 'combo',
        created: '2026-08-01 09:00:00', updated: '2026-09-18 17:30:12', display: '진열',
        base: base0(), simple: { code: '1100006928-0001' }, hybrid: hybrid0(), indivUse: 'Y',
        indiv: { opts: [
          { id: 'io1', name: '각인', use: 'Y', vals: [v('iv1', '각인 없음'), v('iv2', '각인 추가', 3000)], valuesText: '각인 없음,각인 추가', pricesText: '0,3000' },
          { id: 'io2', name: '포장', use: 'Y', vals: [v('iv3', '기본 포장'), v('iv4', '선물 포장', 2000)], valuesText: '기본 포장,선물 포장', pricesText: '0,2000' }],
          rows: [
            { id: 'i1', key: 'io1_iv1', name: '각인', value: '각인 없음', price: 0, stock: 999, status: '판매', code: '1100006928-0002' },
            { id: 'i2', key: 'io1_iv2', name: '각인', value: '각인 추가', price: 3000, stock: 50, status: '판매', code: '1100006928-0003' },
            { id: 'i3', key: 'io2_iv3', name: '포장', value: '기본 포장', price: 0, stock: 999, status: '판매', code: '1100006928-0004' },
            { id: 'i4', key: 'io2_iv4', name: '포장', value: '선물 포장', price: 2000, stock: 30, status: '판매', code: '1100006928-0005' }] } },

      { uid: '1100006929', name: '빈티지 워싱 데님 팬츠', price: 59000, stock: 0, state: 'active', assigned: false, maxSeq: 0, optionUse: 'Y', mode: 'combo',
        created: '2025-11-03 13:11:09', updated: '2026-06-30 10:10:10', display: '진열',
        base: { sig: 'o21', heads: ['사이즈'], opts: [opt('o21', '사이즈', [v('v21', '28'), v('v22', '30')])],
          rows: [row('r21', 'v21', ['28'], '', { stock: 8, mcode: 'DN-28' }), row('r22', 'v22', ['30'], '', { stock: 10, mcode: 'DN-30' })] },
        simple: { code: '' }, hybrid: hybrid0(), indivUse: 'N', indiv: indiv0() },

      { uid: '1100006901', name: '린넨 반팔 셔츠', price: 38000, stock: 0, state: 'deleted', assigned: true, maxSeq: 2, optionUse: 'Y', mode: 'combo',
        created: '2026-04-02 10:00:00', updated: '2026-09-30 18:00:00', display: '미진열',
        base: { sig: 'o31', heads: ['색상'], opts: [opt('o31', '색상', [v('v31', '아이보리'), v('v32', '네이비')])],
          rows: [row('r31', 'v31', ['아이보리'], '1100006901-0001', { stock: 4 }), row('r32', 'v32', ['네이비'], '1100006901-0002', { stock: 6 })] },
        simple: { code: '' }, hybrid: hybrid0(), indivUse: 'N', indiv: indiv0() }
    ],
    // 재입고 알림 신청 내역(옵션 단위)
    alerts: [
      { uid: '1100006925', code: '1100006925-0005', option: '블랙 / L', requests: 3, unsent: 3, note: '' },
      { uid: '1100006925', code: '1100006925-0003', option: '화이트 / S', requests: 1, unsent: 0, note: '' },
      { uid: '1100006927', code: '1100006927-0003', option: '색상: 그레이', requests: 2, unsent: 2, note: '10월 입고 예정' }
    ]
  };
})();
