// showhow 로 showhow 사용법 매뉴얼을 만든다 — 대역 없이.
//
// 이 저장소의 `docs/showhow-쓰는법.html` 은 손으로 쓴 것이 아니라 이 스크립트가 만든다.
// 창 두 개를 띄워, 찍는 쪽이 보여 주는 쪽의 창을 진짜로 공유해서 담는다.
// 사람이 눌러야 하는 "어느 화면을 공유할까요" 창만 브라우저 실행 옵션이 대신 고른다.
// 나머지는 전부 진짜다 — 진짜 화면 신호, 진짜 변화 감지, 진짜 저장, 진짜 내보내기.
//
// 쓰기: node tests/만들기_사용법.mjs
import http from "http";
import fs from "fs";
import path from "path";
import { open, ROOT } from "./브라우저.mjs";

const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
            ".gz": "application/gzip", ".png": "image/png" };
const server = http.createServer((q, r) => {
  let rel = decodeURIComponent(q.url.split("?")[0]);
  while (rel.startsWith("/")) rel = rel.slice(1);
  if (!rel) rel = "index.html";
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end("no"); return; }
  r.writeHead(200, { "Content-Type": T[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(r);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port + "/";

const TITLE = "SHOWHOW-DEMO";
const browser = await open({ args: ["--auto-select-desktop-capture-source=" + TITLE,
                                    "--window-size=1280,860"] });

// ── 보여 주는 쪽 (이 창이 찍힌다) ──
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const B = await ctxB.newPage();
await B.goto(base + "index.html");
await B.evaluate(t => {
  document.title = t;
  try { localStorage.clear(); } catch (e) {}
}, TITLE);
await B.reload();
await B.evaluate(t => { document.title = t; }, TITLE);
await B.waitForTimeout(500);

// ── 찍는 쪽 ──
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const A = await ctxA.newPage();
await A.goto(base + "index.html");
await A.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await A.reload();
await A.waitForTimeout(400);
await A.evaluate(() => { document.querySelector("#docname").value = "showhow 쓰는 법"; save(); paintCover(); });
await A.bringToFront();
await A.click("#shoot");
await A.waitForTimeout(1800);

const on = await A.evaluate(() => WATCH.on && !!stream);
console.log("찍기 시작: " + (on ? "켜짐" : "안 켜짐") +
            " · 잡은 것 " + await A.evaluate(() => { try { return stream.getVideoTracks()[0].getSettings().displaySurface; } catch (e) { return "?"; } }));
if (!on) { await browser.close(); server.close(); process.exit(1); }

const count = () => A.evaluate(() => state.steps.length);
// 담긴 장에 그 동작의 제목을 바로 붙인다. 어떤 동작은 0장이라 미리 써 두면 한 칸씩 밀린다.
const 한다 = async (설명, 제목, 설명글, fn, ms) => {
  const before = await count();
  await fn();
  await B.waitForTimeout(250);
  await A.waitForTimeout(ms || 2400);
  const after = await count();
  const n = after - before;
  if (n > 0) await A.evaluate(([from, to, t, d]) => {
    for (let i = from; i < to; i++) {
      state.steps[i].title = t;
      state.steps[i].desc = d;
      state.steps[i].guess = false;
    }
    render(); save();
  }, [before, after, 제목, 설명글]);
  console.log("  " + 설명.padEnd(22) + " → " + n + "장" + (n ? "  「" + 제목 + "」" : ""));
  return n;
};

// 사람이 실제로 밟는 순서대로 보여 준다
await 한다("이름을 쓴다", "매뉴얼 이름을 쓴다",
  "위쪽 이름 칸에 씁니다. 표지와 파일 이름이 이 이름을 따릅니다.", async () => {
  await B.evaluate(() => {
    document.querySelector("#docname").value = "청구서 처리 순서";
    save(); paintCover();
  });
});

await 한다("담긴 단계가 쌓인다", "화면이 바뀔 때마다 단계가 쌓인다",
  "누르지 않아도 담깁니다. 바뀐 자리는 빨간 테두리로 표시됩니다.", async () => {
  await B.evaluate(() => {
    const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 750;
    const g = cv.getContext("2d");
    const win = (title, rows, btn) => {
      g.fillStyle = "#f4f5f7"; g.fillRect(0, 0, 1200, 750);
      g.fillStyle = "#ffffff"; g.fillRect(50, 50, 1100, 80);
      g.fillStyle = "#2b2f33"; g.font = "600 28px 'Malgun Gothic', sans-serif"; g.fillText(title, 82, 100);
      g.fillStyle = "#ffffff"; g.fillRect(50, 150, 1100, 540);
      g.fillStyle = "#8a9199"; g.font = "21px 'Malgun Gothic', sans-serif";
      rows.forEach((t, i) => g.fillText(t, 86, 205 + i * 44));
      if (btn) {
        g.fillStyle = "#2563eb"; g.fillRect(900, 600, 210, 66);
        g.fillStyle = "#fff"; g.font = "600 30px 'Malgun Gothic', sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(btn, 1005, 634);
        g.textAlign = "start"; g.textBaseline = "alphabetic";
      }
      return cv.toDataURL("image/png");
    };
    docInto({ id: docNow().id, name: "청구서 처리 순서", steps: [
      { title: "청구 목록을 연다", desc: "왼쪽 메뉴에서 청구를 고릅니다.",
        img: win("청구 관리", ["2026-08-21  대기 3건", "2026-08-20  완료"], null), auto: true,
        spot: { x: .05, y: .25, w: .4, h: .09 }, hint: "왼쪽 가운데 부분이 바뀌었습니다" },
      { title: "다음 누르기", guess: true, desc: "",
        img: win("청구서 작성", ["거래처", "금액", "담당자"], "다음"), auto: true,
        spot: { x: .75, y: .8, w: .175, h: .088 }, hint: "오른쪽 아래 부분이 바뀌었습니다" },
    ] });
  });
});

await 한다("표시하기를 연다", "표시하기를 연다",
  "단계 아래 표시하기를 누르면 사진 위에 그릴 수 있습니다.",
  async () => { await B.evaluate(() => openMark(1)); });

await 한다("상자와 글자를 넣는다", "상자와 글자로 짚어 준다",
  "색 다섯 가지, 굵기 세 단계. 표시 하나만 지우는 지우개도 있습니다.", async () => {
  await B.evaluate(() => {
    setTool("box");
    MK.color = "#ff3b30"; MK.thick = 1;
    MK.marks.push({ t: "box", x: 890, y: 590, w: 230, h: 86, c: "#ff3b30", k: 1 });
    MK.color = "#3b82f6";
    MK.marks.push({ t: "text", x: 470, y: 600, s: "여기를 누릅니다", c: "#3b82f6", k: 1 });
    drawMark();
  });
});

await 한다("표시를 저장한다", "다 했어요를 눌러 사진에 새긴다",
  "그린 것이 사진에 새겨집니다. 원본 사진은 따로 남습니다.", async () => {
  await B.evaluate(() => document.querySelector("#mark-done").click());
});

await 한다("내보내기를 고른다", "내보낼 모양을 고른다",
  "PDF·PPT·워드·파일 한 장·사진 원본·글과 그림 중에서 고릅니다.", async () => {
  await B.evaluate(() => document.querySelector("#btn-out").click());
});

await 한다("매뉴얼 목록을 연다", "만든 매뉴얼은 목록에 쌓인다",
  "여러 개를 오가며 씁니다. 비슷한 것은 복제해서 고쳐 씁니다.", async () => {
  await B.evaluate(async () => { outMenu(false); await boxShow(true); });
});

// ── 공유를 끊고, 담긴 것에 제목을 단다 ──
await A.evaluate(() => { if (stream) stream.getVideoTracks()[0].stop(); });
await A.waitForTimeout(900);

const 결과 = await A.evaluate(() => {
  state.name = "showhow 쓰는 법";
  document.querySelector("#docname").value = state.name;
  applyForm({ name: "기본", org: "showhow", sub: "처음 쓰는 사람 안내 · 2026년 8월",
              intro: "이 문서는 showhow 로 만들었습니다. 아래 화면은 전부 실제로 담긴 것입니다.",
              outro: "github.com/svy04/showhow · MIT" });
  render(); save();
  return { 장수: state.steps.length, 제목붙음: state.steps.filter(s => s.title).length };
});
console.log("\n담긴 것 " + 결과.장수 + "장 · 제목 붙은 것 " + 결과.제목붙음 + "장");

// ── 실제 문서로 뽑는다 ──
const 받은것 = await A.evaluate(async () => {
  const got = [];
  const realCreate = URL.createObjectURL;
  const realClick = HTMLAnchorElement.prototype.click;
  let name = "";
  URL.createObjectURL = b => { got.push(b); return "blob:fake"; };
  HTMLAnchorElement.prototype.click = function () { name = this.download; };
  exportHTML();
  await new Promise(r => setTimeout(r, 400));
  const html = await got[0].text();
  URL.createObjectURL = realCreate;
  HTMLAnchorElement.prototype.click = realClick;
  return { html, name, json: JSON.stringify(docNow()) };
});

fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs", "showhow-쓰는법.html"), 받은것.html, "utf8");
fs.writeFileSync(path.join(ROOT, "docs", "showhow-쓰는법.manual.json"), 받은것.json, "utf8");
console.log("내보냄: docs/showhow-쓰는법.html (" + Math.round(받은것.html.length / 1024) + "KB)");

await A.screenshot({ path: path.join(ROOT, "docs", "7_직접만든것.png"), fullPage: false });

// 만든 문서를 실제로 열어 확인한다
const 확인 = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await 확인.goto("file:///" + path.join(ROOT, "docs", "showhow-쓰는법.html").split(path.sep).join("/"));
await 확인.waitForTimeout(700);
const 검 = await 확인.evaluate(() => ({
  제목: document.querySelector("h1") ? document.querySelector("h1").textContent : "",
  단계: document.querySelectorAll("section").length,
  사진: [...document.querySelectorAll("img")].filter(i => i.naturalWidth > 0).length,
}));
console.log("열어 보니: " + 검.제목 + " · 단계 " + 검.단계 + " · 그려진 사진 " + 검.사진);
await 확인.screenshot({ path: path.join(ROOT, "docs", "8_만든문서.png") });

await browser.close();
server.close();
