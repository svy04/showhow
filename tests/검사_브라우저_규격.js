(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const cs = el => getComputedStyle(el);
  const px = v => parseFloat(v);

  // 화면 규격: 자기개발\업무_연애시뮬MVP\규격_화면디자인_v1_2026-08-19.md
  const cv = document.createElement("canvas"); cv.width = 900; cv.height = 560;
  const g = cv.getContext("2d");
  g.fillStyle = "#f2f4f6"; g.fillRect(0, 0, 900, 560);
  const img = cv.toDataURL("image/png");
  docInto({ id: null, name: "규격 시험", steps: [
    { sec: true, title: "묶음" },
    { title: "한 단계", desc: "설명 한 줄.", img, auto: true,
      spot: { x: .6, y: .2, w: .2, h: .12 }, hint: "오른쪽 위 부분이 바뀌었습니다" },
    { title: "두 단계", desc: "설명 두 줄.", img },
  ] });
  await wait(300);

  // ── 타이포 ──
  const 설명 = document.querySelector(".sdesc");
  ok("본문 17px", px(cs(설명).fontSize) === 17, cs(설명).fontSize);
  ok("행간 1.5 (1.6 이상 금지)",
     Math.abs(px(cs(설명).lineHeight) / px(cs(설명).fontSize) - 1.5) < 0.02,
     (px(cs(설명).lineHeight) / px(cs(설명).fontSize)).toFixed(2));
  ok("글 폭 680px (17px × 40자)", px(cs($("#steps")).width) === 680, cs($("#steps")).width);
  ok("좌측 정렬", cs(설명).textAlign !== "justify", cs(설명).textAlign);
  ok("한국어 어절 보존", cs(document.body).wordBreak === "keep-all", cs(document.body).wordBreak);

  // ── 위계: 제목이 번호보다 크다 ──
  const 제목 = document.querySelector(".stitle");
  const 번호 = document.querySelector(".num");
  ok("제목이 번호보다 크다", px(cs(제목).fontSize) > px(cs(번호).fontSize),
     cs(제목).fontSize + " vs " + cs(번호).fontSize);
  ok("번호에 상자를 씌우지 않는다",
     cs(번호).backgroundColor === "rgba(0, 0, 0, 0)" || cs(번호).backgroundImage !== "none",
     cs(번호).backgroundColor);

  // ── 값은 시스템 토큰에서만 온다 (날값 금지) ──
  // 회사 디자인 시스템: mycream-dev/product-docs/design/tokens.css
  const 날값 = { 모서리: [], 간격: [], 색: [] };
  const 훑기 = rule => {
    const st = rule.style;
    if (!st) return;
    const r = st.borderRadius;
    if (r && !/var\(--radius|^0|50%|9999px/.test(r)) 날값.모서리.push(r);
    ["padding", "margin", "gap", "paddingTop", "marginTop"].forEach(k => {
      const v = st[k];
      // 0 은 값이 아니다. 1px 이상만 센다.
      if (v && /[1-9]\d*px/.test(v) && !/var\(--spacing/.test(v)) 날값.간격.push(k + ":" + v);
    });
    ["color", "backgroundColor"].forEach(k => {
      const v = st[k];
      if (v && /^#|^rgb/.test(v)) 날값.색.push(k + ":" + v);
    });
  };
  for (const sheet of document.styleSheets) {
    try {
      for (const r of sheet.cssRules) {
        if (r.href || (r.conditionText && /print/.test(r.conditionText))) continue;  // 인쇄는 종이라 따로
        훑기(r);
        if (r.cssRules) for (const rr of r.cssRules) 훑기(rr);
      }
    } catch (e) {}
  }
  ok("모서리는 시스템 토큰만 쓴다", 날값.모서리.length === 0,
     날값.모서리.slice(0, 4).join(", ") || "날값 없음");
  ok("간격은 시스템 토큰만 쓴다", 날값.간격.length === 0,
     날값.간격.length + "건 " + 날값.간격.slice(0, 8).join(" | "));
  ok("시스템 토큰을 실제로 쓴다",
     !!getComputedStyle(document.documentElement).getPropertyValue("--colors-primary-normal").trim(),
     "브랜드색 " + getComputedStyle(document.documentElement).getPropertyValue("--colors-primary-normal").trim());

  // ── 간격이 전부 같지 않다 (규격 §8) ──
  const 간격 = new Set();
  [".step", ".sec", "#steps", ".shot", ".srow"].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    ["marginTop", "paddingTop", "gap"].forEach(k => {
      const v = px(cs(el)[k]);
      if (v > 0) 간격.add(Math.round(v));
    });
  });
  ok("간격이 한 값이 아니다", 간격.size >= 3, [...간격].sort((a, b) => a - b).join(", ") + "px");

  // ── 손질 단추는 평소 물러나 있다 ──
  const 줄 = document.querySelector(".srow");
  ok("손질 단추가 평소엔 물러나 있다", px(cs(줄).opacity) === 0, "투명도 " + cs(줄).opacity);
  줄.querySelector("button").focus();
  await wait(300);                       // 드러나는 데 160ms 걸린다 — 다 흐른 뒤에 잰다
  ok("키보드로 오면 드러난다", px(cs(줄).opacity) > 0.9, "초점 시 투명도 " + cs(줄).opacity);
  document.activeElement.blur();

  // ── 바뀐 자리 표시가 사진을 덮지 않는다 ──
  const 자리 = document.querySelector(".spot");
  ok("목록에서 사진을 그늘로 덮지 않는다", !/2000px/.test(cs(자리).boxShadow), cs(자리).boxShadow.slice(0, 30));
  const 사진 = document.querySelector(".shot");
  ok("'누르면 크게'가 표시를 가리지 않는다",
     px(getComputedStyle(사진, "::after").opacity) === 0, "라벨 투명도 " + getComputedStyle(사진, "::after").opacity);

  // ── 대비 (WCAG AA) ──
  const lum = c => {
    const [r, gg, b] = c.match(/\d+/g).slice(0, 3).map(Number).map(v => {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * gg + 0.0722 * b;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
  const bg = cs(document.body).backgroundColor;
  ok("본문 대비 4.5 이상", ratio(cs(설명).color, bg) >= 4.5, ratio(cs(설명).color, bg).toFixed(1) + " : 1");
  ok("제목 대비 4.5 이상", ratio(cs(제목).color, bg) >= 4.5, ratio(cs(제목).color, bg).toFixed(1) + " : 1");

  // ── 움직임을 싫어하는 사람 ──
  const 규칙 = [...document.styleSheets].flatMap(sh => {
    try { return [...sh.cssRules]; } catch (e) { return []; }
  }).filter(r => r.conditionText && /prefers-reduced-motion/.test(r.conditionText));
  ok("움직임을 끄는 규칙이 있다", 규칙.length > 0, 규칙.length + "건");

  return out.join("\n");
})()
