// 저장이 진짜로 되는가 — 새로고침을 실제로 해 보고 확인한다.
// 브라우저 안 화면 조각이 아니라 페이지를 정말 다시 띄운다. 대역 없음.
import { open, APP } from "./브라우저.mjs";

const browser = await open();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const 오류 = [];
page.on("pageerror", e => 오류.push(e.message));

const out = [];
const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));

const 씨앗 = `(() => {
  const cv = document.createElement("canvas"); cv.width = 300; cv.height = 200;
  const g = cv.getContext("2d");
  const px = c => { g.fillStyle = c; g.fillRect(0, 0, 300, 200); return cv.toDataURL("image/png"); };
  docInto({ id: "시험문서", name: "저장 시험", steps: [
    { title: "하나", desc: "", img: px("#135") },
    { title: "둘", desc: "", img: px("#357") },
  ] });
})()`;

await page.goto(APP);
await page.waitForTimeout(500);
await page.evaluate(씨앗);
await page.waitForTimeout(2000);          // 큰 칸에 한 번 들어가게 둔다

// ── ① 쉬지 않고 치는 동안에도 정본이 써지는가 ──
await page.evaluate(async () => {
  const t = document.querySelectorAll("#steps .stitle")[0];
  t.focus();
  for (let i = 0; i < 20; i++) {           // 0.4초 간격 20번 = 8초 (옛 코드면 한 번도 안 써진다)
    t.textContent = "로그인 화면을 연다".slice(0, 3 + (i % 8));
    t.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
  }
  t.textContent = "로그인 화면을 연다";
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
const 치는중 = await page.evaluate(async () => {
  const list = await boxAll();
  const d = list.find(x => x.id === "시험문서");
  return { 큰칸제목: d ? d.steps[0].title : "(없음)", 화면제목: state.steps[0].title };
});
ok("쉬지 않고 치는 동안에도 정본이 써진다",
   치는중.큰칸제목.length > 0 && 치는중.큰칸제목 !== "하나", "큰 칸: " + 치는중.큰칸제목);

// ── ② 방금 친 글이 새로고침을 넘어 살아남는가 ──
await page.evaluate(() => {
  const t = document.querySelectorAll("#steps .stitle")[0];
  t.textContent = "마지막으로 친 글";
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.waitForTimeout(150);            // 큰 칸에 들어가기 전에 바로 새로고침
await page.reload();
await page.waitForTimeout(1200);
const 뒤1 = await page.evaluate(() => ({
  제목: state.steps[0] ? state.steps[0].title : "(없음)",
  사진: !!(state.steps[0] && state.steps[0].img),
  단계수: state.steps.length,
}));
ok("새로고침해도 마지막으로 친 글이 남는다", 뒤1.제목 === "마지막으로 친 글", 뒤1.제목);
ok("글을 살리면서 사진도 같이 남는다", 뒤1.사진, 뒤1.사진 ? "" : "사진 사라짐");

// ── ③ 전부 지운 뒤 새로고침하면 지운 채로 있는가 ──
await page.evaluate(async () => {
  while (state.steps.length) act("del", 0);
});
await page.waitForTimeout(2000);
await page.reload();
await page.waitForTimeout(1200);
const 뒤2 = await page.evaluate(() => state.steps.length);
ok("전부 지운 뒤 새로고침해도 되살아나지 않는다", 뒤2 === 0, 뒤2 + "단계");

// ── ④ 예전 판이 새로고침 여섯 번에 전부 밀려나지 않는가 ──
await page.evaluate(씨앗);
await page.waitForTimeout(1800);
const 첫벌 = await page.evaluate(async () => {
  await 백업("자동");
  const list = await boxRaw();
  return list.filter(x => x.bak && x.of === "시험문서").length;
});
for (let i = 0; i < 6; i++) {
  await page.reload();
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const t = document.querySelectorAll("#steps .stitle")[0];
    if (!t) return;
    t.textContent = "고침" + Math.floor(performance.now() % 1000);
    t.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(1600);
}
const 예전판 = await page.evaluate(async () => {
  const list = (await boxRaw()).filter(x => x.bak && x.of === "시험문서").sort((a, b) => b.at - a.at);
  return { 벌수: list.length, 시각차초: list.length > 1 ? Math.round((list[0].at - list[list.length - 1].at) / 1000) : 0 };
});
ok("새로고침을 여섯 번 해도 예전 판이 새것으로 다 밀려나지 않는다",
   예전판.벌수 <= 1 || 예전판.시각차초 >= 5 || 예전판.벌수 < 5,
   예전판.벌수 + "벌 · 사이 " + 예전판.시각차초 + "초");
ok("예전 판은 첫 백업 뒤에도 다섯 벌을 안 넘는다", 예전판.벌수 <= 5, 예전판.벌수 + "벌 (처음 " + 첫벌 + ")");

// ── ⑤ 저장이 안 되면 "저장됨" 이라고 안 하는가 ──
const 못쓸때 = await page.evaluate(async () => {
  const 옛 = window.indexedDB;
  BOX.ready = Promise.resolve(null); BOX.db = null; BOX.local = true;   // 큰 칸을 못 쓰는 상태로 만든다
  const 옛쓰기 = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k) {
    if (k === "manualBox") throw new Error("칸이 찼다");
    return 옛쓰기.apply(this, arguments);
  };
  const ok = await boxSave();
  const 표시 = document.querySelector("#savedat").textContent;
  const 배너 = document.querySelector("#spill").classList.contains("on");
  Storage.prototype.setItem = 옛쓰기;
  BOX.ready = null; BOX.db = null; BOX.local = false;
  return { ok, 표시, 배너 };
});
ok("저장이 안 되면 저장됐다고 안 한다", 못쓸때.표시 !== "저장됨", "표시: " + 못쓸때.표시);
ok("저장이 안 되면 화면 위에 알린다", 못쓸때.배너);

console.log("── 저장 ──");
console.log(out.join("\n"));
if (오류.length) console.log("페이지 오류:", 오류.join(" / "));
await browser.close();
const 실패 = out.filter(x => x.startsWith("실패")).length;
console.log(실패 ? "\n실패 " + 실패 + "건" : "\n전부 통과");
process.exit(실패 ? 1 : 0);
