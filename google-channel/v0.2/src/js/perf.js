/* ==========================================================================
   광고 성과 집계 (Mock) — 일 평균 지표 × 조회기간 운영일수(날짜별 변동 가중치)
   - Meta 광고 관리 탭과 같은 산식이라 통합 현황의 최근 7일 값이 채널 광고 화면 값과 같다 (POL-019)
   ========================================================================== */
const Perf = (function () {
  const DAY = 86400000;
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const w = (d, i) => 0.75 + ((Math.sin((d.getTime() / DAY) * 1.7 + i * 3.1) + 1) / 2) * 0.5;
  const md = (d) => `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  /** Meta 캠페인: spend·rev / Google 캠페인: cost·value 를 같은 키(spend, rev)로 돌려준다 */
  function rows(channel, from, to, filter) {
    const t = today0();
    const src = channel === "meta" ? window.MOCK.campaigns : window.GMOCK.campaigns;
    return src
      .map((c, i) => {
        if (filter && !filter(c)) return null;
        const s = addDays(t, c.s);
        const e = c.e == null ? null : addDays(t, c.e);
        const a = { c, name: c.name, type: c.type || c.objective, imp: 0, clk: 0, conv: 0, rev: 0, spend: 0, days: 0 };
        for (let d = new Date(Math.max(from, s)); d <= to && (!e || d <= e); d = addDays(d, 1)) {
          if (d > t) break;
          const k = w(d, i) * (d.getTime() === t.getTime() ? 0.45 : 1);
          a.imp += c.imp * k;
          a.clk += c.clk * k;
          a.conv += (c.buy != null ? c.buy : c.conv) * k;
          a.rev += (c.rev != null ? c.rev : c.value) * k;
          a.spend += (c.spend != null ? c.spend : c.cost) * k;
          a.days++;
        }
        ["imp", "clk", "conv", "rev", "spend"].forEach((x) => (a[x] = Math.round(a[x])));
        return a;
      })
      .filter((a) => a && a.days > 0);
  }
  function sum(list) {
    return list.reduce((s, a) => { ["imp", "clk", "conv", "rev", "spend"].forEach((k) => (s[k] += a[k])); return s; }, { imp: 0, clk: 0, conv: 0, rev: 0, spend: 0 });
  }
  /** 어제까지 최근 7일 (POL-019) */
  function last7() {
    const t = today0();
    return [addDays(t, -7), addDays(t, -1)];
  }
  function last7Label() {
    const [f, e] = last7();
    return `${md(f)}–${md(e)}`;
  }
  function last7Total(channel) {
    const [f, e] = last7();
    return sum(rows(channel, f, e));
  }
  return { rows, sum, last7, last7Label, last7Total, today0, addDays };
})();
