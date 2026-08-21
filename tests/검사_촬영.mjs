// 이 제품의 핵심 약속을 진짜 브라우저에서 끝까지 확인한다.
//   "한 번만 고르면, 하던 일만 해도 알아서 담긴다."
//
// 대역을 쓰는 곳은 딱 하나: 운영체제가 띄우는 "어느 화면을 공유할까요" 창.
// 그 창은 사람이 눌러야만 열리고 자동화가 닿지 않는다(브라우저가 막는다).
// 그래서 그 창이 돌려주는 화면 신호만 우리가 그리는 판으로 바꿔 끼운다.
// 그 아래는 전부 진짜다 — 진짜 video, 진짜 그리기, 진짜 변화 비교, 진짜 저장.
// 쓰기: node 검사_촬영.mjs
import { open, APP, ROOT } from "./브라우저.mjs";
import path from "path";
import fs from "fs";

const url = APP;
const fail = [];
const ok = (n, c, e = "") => { console.log((c ? "통과  " : "실패! ") + n + (e ? " — " + e : "")); if (!c) fail.push(n); };

const browser = await open();
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
const errs = [];
page.on("pageerror", e => errs.push(String(e).slice(0, 160)));

// 화면 고르기 창만 대역으로 — 우리가 그리는 판이 "공유된 화면"이 된다
await page.addInitScript(() => {
  const cv = document.createElement("canvas");
  cv.width = 1280; cv.height = 800;
  const g = cv.getContext("2d");
  g.fillStyle = "#101010"; g.fillRect(0, 0, 1280, 800);
  window.__draw = (n, color) => {
    g.fillStyle = "#101010"; g.fillRect(0, 0, 1280, 800);
    g.fillStyle = color;
    for (let i = 0; i < n; i++) g.fillRect(60 + (i % 4) * 300, 70 + Math.floor(i / 4) * 190, 260, 160);
  };
  window.__dot = x => { g.fillStyle = "#ffffff"; g.fillRect(x, 400, 14, 20); };
  // 오른쪽 아래 상자 하나만 색을 바꾼다 — "일부만 바뀐" 경우
  window.__one = color => {
    window.__draw(12, "#c8c8c8");
    g.fillStyle = color;
    g.fillRect(60 + 3 * 300, 70 + 2 * 190, 260, 160);
  };
  // 진짜 영상처럼 매 프레임 바뀌는 화면
  window.__video = ms => new Promise(done => {
    const t0 = performance.now();
    let i = 0;
    const step = () => {
      window.__draw(10, "hsl(" + ((i += 7) % 360) + ",60%,55%)");
      if (performance.now() - t0 < ms) requestAnimationFrame(step); else done();
    };
    step();
  });
  const stream = cv.captureStream(12);
  navigator.mediaDevices.getDisplayMedia = async () => stream;
});

await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(300);

const draw = (n, c) => page.evaluate(([n, c]) => window.__draw(n, c), [n, c]);
const count = () => page.evaluate(() => state.steps.length);
const settle = ms => page.waitForTimeout(ms === undefined ? 1600 : ms);

// ── 켜기 ──
await page.click("#shoot");
await page.waitForTimeout(900);
ok("한 번 고르면 찍기가 켜진다", await page.evaluate(() => WATCH.on && !!WATCH.timer));
ok("켜지면 버튼 뜻이 바뀐다", (await page.evaluate(() => document.querySelector("#shoot").textContent)) === "지금 찍기");
ok("자동 촬영이 켜져 있다고 알려 준다",
   (await page.evaluate(() => document.querySelector("#autolabel").textContent)).includes("켜짐"));

const start = await count();

// ① 화면이 바뀌고 멈추면 한 장
await draw(4, "#d8d8d8");
await settle();
const one = await count();
ok("화면이 바뀌고 멈추면 한 장 담긴다", one === start + 1, (one - start) + "장");

// ② 가만히 두면 더 안 찍는다
await settle(2200);
ok("가만히 두면 더 안 찍는다", (await count()) === one, ((await count()) - one) + "장 더");

// ③ 바뀐 횟수만큼
await draw(8, "#c0d8f0"); await settle();
await draw(12, "#f0d8c0"); await settle();
const three = await count();
ok("바뀐 횟수만큼 담긴다", three === one + 2, (three - one) + "장");

// ④ 커서만 한 변화엔 안 속는다
for (let i = 0; i < 14; i++) {
  await page.evaluate(x => { window.__draw(12, "#f0d8c0"); window.__dot(x); }, 100 + i * 60);
  await page.waitForTimeout(90);
}
await settle();
const afterDot = await count();
ok("커서만 한 변화엔 안 속는다", afterDot === three, (afterDot - three) + "장");

// ⑤ 영상이 도는 화면(매 프레임 바뀜)에선 마구 찍지 않는다
await page.evaluate(() => window.__video(3000));
const afterVid = await count();
ok("영상이 돌면 마구 안 찍는다", afterVid - afterDot <= 1, (afterVid - afterDot) + "장");
await settle(2000);
ok("영상이 끝나면 한 장으로 정리된다", (await count()) - afterDot <= 2, ((await count()) - afterDot) + "장");

// ⑥ 일부만 바뀌면 그 자리를 짚어 준다
await draw(12, "#c8c8c8"); await settle();
const beforeOne = await count();
await page.evaluate(() => window.__one("#ff3b30"));
await settle();
ok("일부만 바뀌어도 담긴다", (await count()) === beforeOne + 1, ((await count()) - beforeOne) + "장");
const part = await page.evaluate(() => {
  const d = state.steps.filter(s => s.auto).pop();
  return d ? { desc: d.desc, hint: d.hint, spot: d.spot } : null;
});
ok("어디가 바뀌었는지 자리를 안다", part && part.spot && part.spot.w > 0 && part.spot.w < 0.5,
   part && part.spot ? "x" + part.spot.x.toFixed(2) + " y" + part.spot.y.toFixed(2) +
   " w" + part.spot.w.toFixed(2) : "없음");
ok("짚은 자리가 실제로 바뀐 자리다 (오른쪽 아래)",
   part && part.spot && part.spot.x > 0.5 && part.spot.y > 0.5,
   part && part.spot ? "x" + part.spot.x.toFixed(2) + " y" + part.spot.y.toFixed(2) : "없음");
ok("바뀐 자리를 말로 적어 준다", part && /오른쪽/.test(part.hint || "") && /아래/.test(part.hint || ""), part && part.hint);

// ⑦ 담긴 것 안을 들여다본다
const shot = await page.evaluate(() => {
  const d = state.steps.filter(s => s.auto).pop();
  return d ? { kb: Math.round(String(d.img).length / 1024), head: String(d.img).slice(0, 22),
               hint: d.hint, desc: d.desc, spot: d.spot, title: d.title } : null;
});
ok("담긴 단계에 사진이 있다", shot && shot.head.startsWith("data:image"), shot && shot.kb + "KB");
ok("설명 칸에 길잡이가 뜬다", shot && (shot.hint || "").length > 4, shot && shot.hint);
ok("길잡이가 본문을 더럽히지 않는다", shot && !shot.desc, "설명 칸은 비어 있음");
ok("담기는 대로 옆 목록에 뜬다",
   (await page.evaluate(() => document.querySelectorAll("#sidelist > *").length)) >= 3,
   (await page.evaluate(() => document.querySelectorAll("#sidelist > *").length)) + "줄");

// ⑦ 잠시 멈춤
await page.click("#pausebtn2");
const paused = await count();
await draw(3, "#30f0c0"); await settle();
ok("잠시 멈추면 안 찍는다", (await count()) === paused, ((await count()) - paused) + "장 더");
await page.click("#pausebtn2");
await page.waitForTimeout(300);
await draw(9, "#f030a0"); await settle();
ok("다시 켜면 이어서 찍는다", (await count()) > paused, ((await count()) - paused) + "장");

// ⑧ 손으로 지금 찍기
const manual = await count();
await page.click("#shoot");
await page.waitForTimeout(600);
ok("손으로도 지금 찍을 수 있다", (await count()) === manual + 1, ((await count()) - manual) + "장");

// ⑨ 자동 끄기
await page.click("#autobtn");
const offAt = await count();
await draw(6, "#20f0a0"); await settle();
ok("자동을 끄면 더 안 찍힌다", (await count()) === offAt, ((await count()) - offAt) + "장 더");

// ⑩ 지나간 화면 되살리기 — 안 담긴 순간을 꺼낼 수 있는가
await page.evaluate(() => { document.querySelector("#rewbtn").click(); });
await page.waitForTimeout(500);
const rew = await page.evaluate(() => document.querySelectorAll("#rewgrid > *").length);
ok("지나간 화면이 쌓여 있다", rew > 0, rew + "장 보관 중");
await page.keyboard.press("Escape");

// ⑪ 새로고침해도 남는다
await page.waitForTimeout(1800);
const before = await count();
await page.reload();
await page.waitForTimeout(900);
ok("새로고침해도 그대로 남는다", (await count()) === before, (await count()) + "단계");

// ⑫ 눈으로 확인할 증거 한 장
const SHOT = path.join(ROOT, "docs", "검사결과_자동촬영.png");
fs.mkdirSync(path.dirname(SHOT), { recursive: true });
await page.screenshot({ path: SHOT, fullPage: false });

if (errs.length) ok("화면 오류 없음", false, errs[0]);
await browser.close();
console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);
