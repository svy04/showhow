// 창을 실제로 줄여 보고, 글이 읽히는지 잰다.
// 규칙이 있다는 것과 실제로 안 깨진다는 것은 다른 말이다.
// 쓰기: node tests/검사_좁은화면.mjs
import { open, APP, ROOT } from "./브라우저.mjs";
import fs from "fs";
import path from "path";

const fail = [];
const ok = (n, c, e = "") => { console.log((c ? "통과  " : "실패! ") + n + (e ? " — " + e : "")); if (!c) fail.push(n); };

const 폭들 = [1440, 1100, 880, 720, 560, 420];
const browser = await open();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(APP);
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(300);

await page.evaluate(() => {
  const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 750;
  const g = cv.getContext("2d");
  g.fillStyle = "#f4f5f7"; g.fillRect(0, 0, 1200, 750);
  g.fillStyle = "#fff"; g.fillRect(48, 48, 1104, 80);
  g.fillStyle = "#2b2f33"; g.font = "600 28px sans-serif"; g.fillText("청구 관리", 84, 98);
  const img = cv.toDataURL("image/png");
  docInto({ id: null, name: "좁은 화면 시험", steps: [
    { sec: true, title: "처음 한 번만" },
    { title: "청구 목록을 연다", desc: "왼쪽 메뉴에서 청구를 고릅니다. 설명이 길어지면 두 줄이 됩니다.",
      img, auto: true, spot: { x: .06, y: .25, w: .38, h: .09 }, hint: "왼쪽 가운데 부분이 바뀌었습니다" },
    { title: "다음을 누른다", desc: "빈칸을 채우고 다음을 누릅니다.", img },
  ] });
});
await page.waitForTimeout(400);
// 옆 목록이 켜진 상태도 같이 본다
await page.evaluate(() => { document.querySelector("#side").classList.add("on"); document.body.classList.add("sideon"); renderSide(); });
await page.waitForTimeout(200);

fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });

for (const w of 폭들) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const cs = el => getComputedStyle(el);
    const 단계 = document.querySelector(".step");
    const 사진 = document.querySelector(".shot img");
    const 옆 = document.querySelector("#side");
    return {
      밀림: document.documentElement.scrollWidth - window.innerWidth,
      글폭: Math.round(document.querySelector("#steps").getBoundingClientRect().width),
      본문: parseFloat(cs(document.querySelector(".sdesc")).fontSize),
      사진폭: 사진 ? Math.round(사진.getBoundingClientRect().width) : 0,
      단계폭: Math.round(단계.getBoundingClientRect().width),
      옆목록: cs(옆).display === "none" ? "숨김" : Math.round(옆.getBoundingClientRect().width) + "px",
      제목잘림: (() => {
        const t = document.querySelector("#docname");
        return t.scrollWidth > t.clientWidth + 2;
      })(),
    };
  });
  const 좋다 = r.밀림 <= 1 && r.글폭 <= w && r.본문 >= 15 && r.사진폭 <= r.단계폭 + 1;
  ok("가로 " + w + "px 에서 안 깨진다", 좋다,
     "밀림 " + r.밀림 + " · 글폭 " + r.글폭 + " · 본문 " + r.본문 + "px · 사진 " + r.사진폭 + " · 옆목록 " + r.옆목록);
  if (w === 720 || w === 420) {
    await page.screenshot({ path: path.join(ROOT, "docs", "좁은화면_" + w + ".png") });
  }
}

await page.setViewportSize({ width: 1440, height: 900 });
await browser.close();
console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);
