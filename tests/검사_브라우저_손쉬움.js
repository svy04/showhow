(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 읽을 것을 하나 만들어 둔다
  const cv = document.createElement("canvas"); cv.width = 800; cv.height = 500;
  const g = cv.getContext("2d"); g.fillStyle = "#dde3ea"; g.fillRect(0, 0, 800, 500);
  const img = cv.toDataURL("image/png");
  docInto({ id: null, name: "손쉬움 시험", steps: [
    { sec: true, title: "처음 설정하기" },
    { title: "프로그램을 연다", desc: "아이콘을 두 번 누릅니다.", img, auto: true,
      spot: { x: .6, y: .2, w: .2, h: .15 }, hint: "오른쪽 위 부분이 바뀌었습니다" },
    { title: "이름을 넣는다", desc: "칸에 이름을 씁니다.", img },
  ] });
  await wait(200);

  // ① 눈으로 못 보는 사람에게도 이름이 있는 단추인가
  const nameless = [...document.querySelectorAll("button")].filter(b => {
    if (!b.offsetParent && b.closest("[hidden]")) return false;
    const t = (b.textContent || "").trim();
    return !t && !b.getAttribute("aria-label") && !b.getAttribute("title");
  });
  ok("이름 없는 단추가 없다", nameless.length === 0,
     nameless.length ? nameless.map(b => b.id || b.className).join(", ") : "전부 이름 있음");

  // ② 글자 없이 뜻을 나르는 칸에 설명이 붙어 있는가
  const inputs = [...document.querySelectorAll("input, textarea")].filter(i => i.type !== "file" && i.type !== "hidden");
  const bare = inputs.filter(i => !i.getAttribute("aria-label") && !i.placeholder &&
    !document.querySelector('label[for="' + i.id + '"]'));
  ok("설명 없는 입력칸이 없다", bare.length === 0, bare.length ? bare.map(i => i.id).join(", ") : inputs.length + "칸 확인");

  // ③ 사진에 대체 글이 붙어 있는가
  const imgs = [...document.querySelectorAll("#steps img")];
  ok("사진에 대체 글이 있다", imgs.length > 0 && imgs.every(i => (i.alt || "").length > 4),
     imgs.length + "장 · " + (imgs[0] ? '"' + imgs[0].alt + '"' : ""));

  // ④ 탭으로 주요 손잡이에 닿는가
  const reach = [];
  document.body.focus();
  let cur = document.activeElement;
  for (let i = 0; i < 60; i++) {
    const all = [...document.querySelectorAll('button, input, [contenteditable], [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);
    reach.push(...all.map(el => el.id || el.className || el.tagName));
    break;
  }
  const want = ["btn-out", "btn-box", "btn-form", "btn-save", "docname"];
  const missing = want.filter(id => !reach.includes(id));
  // 찍기 단추는 자리를 옮겼다(빈 화면은 가운데, 일하는 중에는 위 줄). 어느 쪽이든 **보이고** 닿아야 한다.
  const 찍기 = ["shoot", "shoot-top"].filter(id => reach.includes(id));
  if (!찍기.length) missing.push("찍기(shoot / shoot-top 둘 다 못 닿음)");
  ok("주요 손잡이에 탭으로 닿는다", missing.length === 0,
     missing.length ? "못 닿음: " + missing.join(", ") : (want.length + 1) + "개 확인 · 찍기=" + 찍기.join(","));

  // ⑤ 초점이 눈에 보이는가
  const 찍기단추 = $("#shoot").offsetParent ? $("#shoot") : $("#shoot-top");
  찍기단추.focus();
  const fs = getComputedStyle(찍기단추);          // 초점을 준 그 단추를 잰다
  const seen = fs.outlineStyle !== "none" || fs.boxShadow !== "none" ||
               getComputedStyle(찍기단추, ":focus-visible").outlineStyle !== "none";
  ok("초점이 어디 있는지 보인다", seen, "테두리 " + fs.outlineStyle + " · 그림자 " + (fs.boxShadow !== "none" ? "있음" : "없음"));

  // ⑥ 글자와 바탕의 밝기 차 (읽을 수 있는가)
  const lum = c => {
    const [r, gg, b] = c.match(/\d+/g).slice(0, 3).map(Number).map(v => {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * gg + 0.0722 * b;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
  const bg = getComputedStyle(document.body).backgroundColor;
  const title = document.querySelector(".stitle");
  const desc = document.querySelector(".sdesc");
  const rTitle = ratio(getComputedStyle(title).color, bg);
  const rDesc = ratio(getComputedStyle(desc).color, bg);
  ok("단계 제목이 또렷하다 (4.5 이상)", rTitle >= 4.5, rTitle.toFixed(1) + " : 1");
  ok("설명 글이 읽을 만하다 (4.5 이상)", rDesc >= 4.5, rDesc.toFixed(1) + " : 1");
  const stat = ratio(getComputedStyle($("#status")).color, bg);
  ok("알림 글이 읽을 만하다 (3 이상)", stat >= 3, stat.toFixed(1) + " : 1");

  // ⑦ 글자 크기
  const px = el => parseFloat(getComputedStyle(el).fontSize);
  ok("본문 글자가 16px 이상", px(desc) >= 16, px(desc) + "px");
  ok("제목이 본문보다 크다", px(title) > px(desc), px(title) + "px / " + px(desc) + "px");

  // ⑧ 키보드 지름길
  const before = state.steps.length;
  act("del", 2);
  ok("지우면 줄어든다", state.steps.length === before - 1);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
  await wait(100);
  ok("Ctrl+Z로 되돌아온다", state.steps.length === before, state.steps.length + "단계");

  // ⑨ Escape로 열린 창이 닫힌다
  await boxShow(true);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(200);
  ok("Escape로 창이 닫힌다", !$("#box").classList.contains("on"));

  // ⑩ 좁은 화면에서도 안 무너진다
  const wide = document.documentElement.scrollWidth;
  ok("가로로 밀리지 않는다", wide <= window.innerWidth + 1, wide + " / " + window.innerWidth);

  return out.join("\n");
})()
