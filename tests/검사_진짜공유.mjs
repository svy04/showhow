// 대역 없이 진짜 화면 공유로 검사한다.
//
// `검사_촬영.mjs` 는 화면 고르기 창만 대역으로 두고 나머지를 진짜로 돌린다.
// 여기서는 그 대역마저 없앤다 — 브라우저 실행 옵션으로 "제목이 이런 창"을 자동으로
// 고르게 해서, 진짜 getDisplayMedia 가 돌려주는 진짜 화면 신호를 쓴다.
// 사람이 창을 누르는 동작만 옵션이 대신할 뿐, 잡히는 픽셀은 실제 창의 픽셀이다.
//
// 브라우저 창이 화면에 잠깐 뜬다(숨김 상태로는 창을 못 잡는다).
// 쓰기: node tests/검사_진짜공유.mjs
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import { APP } from "./브라우저.mjs";

const require = createRequire(import.meta.url);
const fail = [];
const ok = (n, c, e = "") => { console.log((c ? "통과  " : "실패! ") + n + (e ? " — " + e : "")); if (!c) fail.push(n); };

function playwright() {
  for (const t of ["playwright", "playwright-core",
                   path.join(process.env.HOME || process.env.USERPROFILE || "", ".claude/skills/gstack/node_modules/playwright")]) {
    try { return require(t); } catch (e) {}
  }
  console.log("playwright 가 필요합니다: npm i -D playwright && npx playwright install msedge");
  process.exit(2);
}
const { chromium } = playwright();

const BOARD_TITLE = "SHOWHOW-TESTBOARD";   // 한글 제목은 명령줄 옵션에서 안 잡힌다 (실측)
const board = "data:text/html;charset=utf-8," + encodeURIComponent(`<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>${BOARD_TITLE}</title><style>
 body{margin:0;background:#101214;height:100vh}
 .k{position:absolute;width:260px;height:150px;border-radius:6px}
</style></head><body><div id="b"></div><script>
 window.__draw = (n, color) => {
   const b = document.getElementById("b");
   b.innerHTML = "";
   for (let i = 0; i < n; i++) {
     const d = document.createElement("div");
     d.className = "k";
     d.style.left = (40 + (i % 3) * 290) + "px";
     d.style.top = (60 + Math.floor(i / 3) * 175) + "px";
     d.style.background = color;
     b.appendChild(d);
   }
   return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
 };
<\/script></body></html>`);

/* ── ① 진짜 화면 공유로 담기는가 ── */
{
  const browser = await chromium.launch({
    channel: "msedge", headless: false,
    args: ["--no-sandbox", "--auto-select-desktop-capture-source=" + BOARD_TITLE],
  });
  const c1 = await browser.newContext({ viewport: null });
  const p1 = await c1.newPage();
  await p1.goto(APP);
  const c2 = await browser.newContext({ viewport: null });
  const p2 = await c2.newPage();
  await p2.goto(board);
  await p2.evaluate(() => window.__draw(0, "#101214"));
  await p1.bringToFront();
  await p1.waitForTimeout(500);

  await p1.click("#shoot");
  // 첫 장면이 올 때까지 기다린다. 안 기다리면 0×0 을 재고 흔들린다 (2026-08-21 실측)
  await p1.waitForFunction(() => (typeof video !== "undefined" && video && video.videoWidth > 0),
                           { timeout: 20000 }).catch(() => {});
  await p1.waitForTimeout(500);

  const on = await p1.evaluate(() => WATCH.on && !!WATCH.timer);
  const kind = await p1.evaluate(() => {
    try { return stream.getVideoTracks()[0].getSettings().displaySurface || "불명"; } catch (e) { return "없음"; }
  });
  const size = await p1.evaluate(() => (video ? video.videoWidth + "×" + video.videoHeight : "없음"));
  ok("진짜 화면 공유가 열린다", on, kind + " · " + size);
  ok("대역이 아니라 진짜 화면을 잡았다", ["window", "browser", "monitor"].includes(kind), "displaySurface=" + kind);

  if (!on) {
    console.log("      → 진짜 창을 못 잡아 뒤 검사를 건너뜁니다");
    await browser.close();
    console.log("실패 " + fail.length + "건: " + fail.join(" / "));
    process.exit(1);
  }
  const count = () => p1.evaluate(() => state.steps.length);
  const draw = (n, c) => p2.evaluate(([n, c]) => window.__draw(n, c), [n, c]);

  const start = await count();
  await draw(3, "#d8d8d8");
  await p1.waitForTimeout(2200);
  const one = await count();
  ok("진짜 화면이 바뀌면 담긴다", one === start + 1, (one - start) + "장");

  await p1.waitForTimeout(2500);
  ok("가만히 두면 더 안 담긴다", (await count()) === one, ((await count()) - one) + "장 더");

  await draw(6, "#b0c8e0");
  await p1.waitForTimeout(2200);
  await draw(9, "#e0c8b0");
  await p1.waitForTimeout(2200);
  ok("바뀐 횟수만큼 담긴다", (await count()) === one + 2, ((await count()) - one) + "장");

  const shot = await p1.evaluate(() => {
    const d = state.steps.filter(s => s.auto).pop();
    return d ? { kb: Math.round(String(d.img).length / 1024), head: String(d.img).slice(0, 22), hint: d.hint } : null;
  });
  ok("담긴 것이 진짜 화면 사진이다", shot && shot.head.startsWith("data:image") && shot.kb > 3,
     shot ? shot.kb + "KB" : "없음");
  ok("바뀐 자리를 말로 적어 준다", shot && /바뀌었습니다/.test(shot.hint || ""), shot && shot.hint);

  // 신호가 죽는 상황. track.stop() 은 "끝났다" 알림을 안 보내므로(규격),
  // 알림 없이 죽은 신호도 알아채는지 본다.
  await p1.evaluate(() => { if (stream) stream.getVideoTracks()[0].stop(); });
  await p1.waitForTimeout(1200);
  const after = await p1.evaluate(() => ({ on: WATCH.on, 말: document.querySelector("#status").textContent.trim() }));
  ok("알림 없이 신호가 죽어도 알아챈다", !after.on, after.말.slice(0, 40));

  await browser.close();
}

/* ── ② 자기 자신을 찍는 고리를 끊는가 ── */
{
  const browser = await chromium.launch({
    channel: "msedge", headless: false,
    args: ["--no-sandbox", "--auto-select-desktop-capture-source=showhow"],
  });
  const c = await browser.newContext({ viewport: null });
  const p = await c.newPage();
  await p.goto(APP);
  await p.bringToFront();
  await p.waitForTimeout(500);

  await p.click("#shoot");
  await p.waitForFunction(() => (typeof video !== "undefined" && video && video.videoWidth > 0),
                          { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(500);
  const got = await p.evaluate(() => !!stream);
  ok("이 창 자체를 고른 상황을 만들었다", got, got ? "자기 창 공유 중" : "안 열림");

  if (got) {
    // 한 번 크게 바꿔서 고리에 불을 붙인다
    await p.evaluate(() => { document.body.style.filter = "invert(1)"; });
    await p.waitForTimeout(700);
    await p.evaluate(() => { document.body.style.filter = ""; });
    await p.waitForTimeout(9000);

    const r = await p.evaluate(() => ({
      on: WATCH.on, steps: state.steps.length, tick: WATCH.tick,
      찍힌시점: (WATCH.shots || []).slice(),
      surface: (() => { try { return stream.getVideoTracks()[0].getSettings().displaySurface; } catch (e) { return "없음"; } })(),
      말: document.querySelector("#status").textContent.trim(),
      켜짐: document.querySelector("#autolabel").textContent,
    }));
    const gaps = r.찍힌시점.map((t, i, a) => (i ? t - a[i - 1] : "-")).join(", ");
    console.log("      잡은 것: " + r.surface + " · 담긴 시점(번째 눈금): " +
                r.찍힌시점.join(", ") + " · 사이 간격: " + gaps + " · 총 " + r.tick + "눈금");
    // 고리가 몇 장에서 멈추는지는 판마다 다르다(실측 3~4장). 확인할 것은 하나다 —
    // 끝없이 돌지 않는가. 막는 장치 자체는 눈금을 제어할 수 있는 검사_전체.mjs 에서 따로 본다.
    const 마지막 = r.찍힌시점.length ? r.찍힌시점[r.찍힌시점.length - 1] : 0;
    const 멈췄다 = !r.on || (r.tick - 마지막) > 20;
    ok("고리가 끝없이 돌지 않는다", 멈췄다 && r.steps <= 6,
       r.steps + "장 · " + (r.on ? "마지막 담김 뒤 " + (r.tick - 마지막) + "눈금 조용" : "자동 꺼짐"));
    // 자동이 꺼지는 이유는 둘이다 — 고리를 끊었거나, 화면 공유가 끝났거나.
    // 어느 쪽이든 사람에게 이유를 말해야 한다. (고리 메시지 자체는 검사_전체.mjs 에서 정확히 본다)
    if (!r.on) ok("껐다면 이유를 말해 준다", /자기 자신|다른 화면|빠르게|종료/.test(r.말), r.말.slice(0, 50));
  }
  await browser.close();
}

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);
