// README 에 넣을 실물 사진을 찍는다. 화면을 고치면 이걸 다시 돌린다.
// 쓰기: node tests/문서사진.mjs
import { open, APP, ROOT } from "./브라우저.mjs";
import fs from "fs";
import path from "path";

const OUT = path.join(ROOT, "docs");
fs.mkdirSync(OUT, { recursive: true });

const 재료 = () => {
  const cv = document.createElement("canvas"); cv.width = 1280; cv.height = 800;
  const g = cv.getContext("2d");
  const win = (title, rows, btn) => {
    g.fillStyle = "#f4f5f7"; g.fillRect(0, 0, 1280, 800);
    g.fillStyle = "#fff"; g.fillRect(48, 48, 1184, 84);
    g.fillStyle = "#2b2f33"; g.font = "600 30px 'Malgun Gothic', sans-serif"; g.fillText(title, 84, 100);
    g.fillStyle = "#fff"; g.fillRect(48, 152, 1184, 600);
    g.fillStyle = "#8a9199"; g.font = "22px 'Malgun Gothic', sans-serif";
    rows.forEach((t, i) => g.fillText(t, 88, 214 + i * 48));
    if (btn) {
      g.fillStyle = "#2563eb"; g.fillRect(960, 650, 220, 70);
      g.fillStyle = "#fff"; g.font = "600 30px 'Malgun Gothic', sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(btn, 1070, 686);
      g.textAlign = "start"; g.textBaseline = "alphabetic";
    }
    return cv.toDataURL("image/png");
  };
  docInto({ id: null, name: "청구서 처리 순서", steps: [
    { sec: true, title: "처음 한 번만" },
    { title: "청구 목록을 연다", desc: "왼쪽 메뉴에서 청구를 고릅니다.",
      img: win("청구 관리", ["2026-08-21  대기 3건", "2026-08-20  완료", "2026-08-19  완료"], null),
      auto: true, spot: { x: .06, y: .25, w: .38, h: .09 }, hint: "왼쪽 가운데 부분이 바뀌었습니다" },
    { title: "다음 누르기", guess: true, desc: "빈칸을 채우고 다음을 누릅니다.",
      img: win("청구서 작성", ["거래처", "금액", "담당자"], "다음"),
      auto: true, spot: { x: .74, y: .8, w: .18, h: .09 }, hint: "오른쪽 아래 부분이 바뀌었습니다" },
    { sec: true, title: "매일 하는 일" },
    { title: "보낼 곳을 고른다", desc: "받는 사람을 확인하고 보내기를 누릅니다.",
      img: win("확인", ["이대로 보낼까요?"], "보내기"),
      auto: true, spot: { x: .74, y: .8, w: .18, h: .09 }, hint: "오른쪽 아래 부분이 바뀌었습니다" },
  ] });
  applyForm({ name: "마케팅팀 표준", org: "마이크림 마케팅팀", sub: "신입 인수인계용 · 2026년판",
              intro: "이 문서대로 따라 하면 됩니다. 막히면 담당자에게 물어보세요.",
              outro: "문의 · 마케팅팀" });
};

const browser = await open();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
await page.goto(APP);
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, "1_첫화면.png") });

await page.evaluate(재료);
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, 150));
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(OUT, "2_단계.png") });
await page.evaluate(() => window.scrollTo(0, 0));

await page.click("#btn-out");
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, "3_내보내기.png"), clip: { x: 620, y: 0, width: 660, height: 500 } });
await page.keyboard.press("Escape");
await page.evaluate(() => outMenu(false));

// 표시 화면
await page.evaluate(() => openMark(1));
await page.waitForTimeout(600);
await page.evaluate(() => {
  MK.color = "#ff3b30"; MK.thick = 1; paintColors();
  MK.marks = [
    { t: "box", x: 940, y: 630, w: 260, h: 110, c: "#ff3b30", k: 1 },
    { t: "arrow", x: 700, y: 500, w: 200, h: 110, c: "#3b82f6", k: 1 },
    { t: "text", x: 420, y: 470, s: "여기를 누릅니다", c: "#3b82f6", k: 1 },
    { t: "badge", x: 150, y: 250, c: "#f0b429", k: 1 },
  ];
  drawMark();
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, "6_표시.png") });
await page.evaluate(() => { MK.marks = []; document.querySelector("#mark-done").click(); });
await page.waitForTimeout(500);

// 매뉴얼 목록
await page.evaluate(async () => {
  await boxSave();
  const keep = docNow();
  await boxNew();
  docInto({ id: docNow().id, name: "신입 안내서", steps: keep.steps.slice(0, 3) });
  await boxSave();
  docInto(keep);
  await boxSave();
  await boxShow(true);
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, "4_목록.png"), clip: { x: 0, y: 0, width: 1280, height: 520 } });
await page.evaluate(() => boxShow(false));

// 인쇄 모양
await page.setViewportSize({ width: 900, height: 1200 });
await page.emulateMedia({ media: "print" });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, "5_인쇄.png") });
await page.emulateMedia({ media: "screen" });

await browser.close();
console.log("찍음: docs/1~6");
