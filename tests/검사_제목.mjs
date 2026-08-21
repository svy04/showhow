// 단계 글 자동 작성(화면의 글자를 읽어 제목 채우기)을 검사한다.
//
// 이 기능은 주소로 열었을 때만 된다 — 내려받은 파일(file://)로 열면 브라우저가
// 옆 폴더 읽기를 막는다. 그래서 여기서는 작은 서버를 띄워 진짜 주소로 연다.
// 쓰기: node tests/검사_제목.mjs
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { open, ROOT } from "./브라우저.mjs";

const fail = [];
const ok = (n, c, e = "") => { console.log((c ? "통과  " : "실패! ") + n + (e ? " — " + e : "")); if (!c) fail.push(n); };

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                ".gz": "application/gzip", ".wasm": "application/wasm", ".png": "image/png",
                ".json": "application/json", ".md": "text/markdown; charset=utf-8" };

const served = [];
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end("no"); return;
  }
  served.push(rel);
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port + "/";

const browser = await open();
const page = await browser.newPage({ viewport: { width: 1300, height: 850 } });
const errs = [];
page.on("pageerror", e => errs.push(String(e).slice(0, 160)));
const outside = [];
page.on("request", q => { if (!q.url().startsWith(base) && !q.url().startsWith("data:") && !q.url().startsWith("blob:")) outside.push(q.url()); });
await page.goto(base + "index.html");
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(400);

ok("제목 자동 작성 단추가 있다", await page.evaluate(() => !!document.querySelector("#titlebtn")));
ok("처음엔 꺼져 있다", await page.evaluate(() => document.querySelector("#titlebtn").getAttribute("aria-pressed") === "false"));

const t0 = Date.now();
await page.evaluate(() => document.querySelector("#titlebtn").click());
await page.waitForFunction(() => !!OCR.worker || OCR.on === false, { timeout: 90000 }).catch(() => {});
const readyMs = Date.now() - t0;
const ready = await page.evaluate(() => !!OCR.worker);
ok("글자 읽기가 준비된다", ready, Math.round(readyMs / 100) / 10 + "초 걸림");
if (!ready) {
  console.log("      상태: " + await page.evaluate(() => document.querySelector("#status").textContent.trim()));
}

if (ready) {
  ok("바깥으로 나간 요청이 없다", outside.length === 0, outside.length ? outside[0] : "전부 우리 자리에서 읽음");
  ok("옆 폴더 파일을 실제로 읽었다",
     served.some(f => f.includes("tesseract")) && served.some(f => f.includes("traineddata")),
     served.filter(f => f.startsWith("ocr/")).join(", "));

  const run = (label, blank) => page.evaluate(async ([label, blank]) => {
    const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 750;
    const g = cv.getContext("2d");
    g.fillStyle = "#f4f5f7"; g.fillRect(0, 0, 1200, 750);
    g.fillStyle = "#ffffff"; g.fillRect(60, 60, 1080, 560);
    g.fillStyle = blank ? "#c8ccd0" : "#2563eb"; g.fillRect(880, 520, 220, 74);
    if (!blank) {
      g.fillStyle = "#ffffff";
      g.font = "600 40px 'Malgun Gothic', sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(label, 990, 558);
    }
    const st = { title: "", desc: "", img: cv.toDataURL("image/png"), auto: true,
                 spot: { x: 880 / 1200, y: 520 / 750, w: 220 / 1200, h: 74 / 750 } };
    state.steps.push(st);
    render();
    await ocrFill(st);
    return { title: st.title || "", guess: !!st.guess };
  }, [label, blank]);

  const a = await run("다음", false);
  ok("한글 단추 글자를 읽어 제목을 채운다", /다음/.test(a.title), "제목: " + (a.title || "비어 있음"));
  ok("작은 자리는 '누르기'로 맺는다", /누르기$/.test(a.title), a.title);
  ok("짐작이라고 표시해 둔다", a.guess);
  ok("화면에도 짐작 표시가 붙는다", await page.evaluate(() => !!document.querySelector(".stitle.guess")));

  const c = await run("", true);
  ok("읽을 글자가 없으면 비워 둔다", !c.title, "제목: " + (c.title || "비어 있음"));

  const kept = await page.evaluate(async () => {
    const st = { title: "내가 쓴 제목", desc: "", img: state.steps[0].img, auto: true,
                 spot: { x: .7, y: .7, w: .2, h: .1 } };
    state.steps.push(st);
    await ocrFill(st);
    return st.title;
  });
  ok("사람이 쓴 제목은 안 덮어쓴다", kept === "내가 쓴 제목", kept);

  // 얼마나 맞히는지 재고, 나빠지면 걸리게 못 박아 둔다.
  // 흔한 단추 16개 × 크기 4가지 = 64개. 2026-08-21 실측: 맞음 43 · 틀림 11 · 빈칸 10.
  const WORDS = ["다음", "확인", "저장", "취소", "닫기", "삭제", "등록", "검색", "로그인", "내보내기",
                 "Save", "Next", "OK", "Cancel", "Sign in", "Export"];
  const score = await page.evaluate(async words => {
    const shapes = [[260, 84, 38], [220, 74, 40], [160, 48, 24], [340, 96, 44]];
    let hit = 0, bad = 0, none = 0, kor = 0, korAll = 0, eng = 0, engAll = 0;
    for (const w of words) for (const [bw, bh, fs2] of shapes) {
      const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 750;
      const g = cv.getContext("2d");
      g.fillStyle = "#f4f5f7"; g.fillRect(0, 0, 1200, 750);
      g.fillStyle = "#ffffff"; g.fillRect(60, 60, 1080, 560);
      const bx = 1100 - bw, by = 600 - bh;
      g.fillStyle = "#2563eb"; g.fillRect(bx, by, bw, bh);
      g.fillStyle = "#ffffff"; g.font = "600 " + fs2 + "px 'Malgun Gothic', sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(w, bx + bw / 2, by + bh / 2 + 2);
      const st = { title: "", desc: "", img: cv.toDataURL("image/png"), auto: true,
                   spot: { x: bx / 1200, y: by / 750, w: bw / 1200, h: bh / 750 } };
      await ocrFill(st);
      const got = String(st.title || "").replace(/ 누르기$/, "");
      const okv = got.toLowerCase() === w.toLowerCase();
      if (!got) none++; else if (okv) hit++; else bad++;
      if (/[가-힣]/.test(w)) { korAll++; if (okv) kor++; } else { engAll++; if (okv) eng++; }
    }
    return { hit, bad, none, kor, korAll, eng, engAll, all: words.length * shapes.length };
  }, WORDS);

  // 문턱을 절반(32)에 두면 44가 33으로 떨어져도 통과한다 — 나빠진 것을 못 잡는다.
  // 실측 44/64 에서 네 개까지만 봐준다.
  ok("단추 글자를 40개 넘게 맞힌다 (실측 44/64)", score.hit >= 40,
     "맞음 " + score.hit + " · 틀림 " + score.bad + " · 빈칸 " + score.none + " / " + score.all +
     " (한글 " + score.kor + "/" + score.korAll + ")");
  ok("틀린 것보다 맞은 것이 세 배 넘는다", score.hit >= score.bad * 3,
     score.hit + " 대 " + score.bad);
  ok("한글은 24개 넘게 맞힌다 (실측 26/40)", score.kor >= 24, score.kor + "/" + score.korAll);
  ok("영어는 16개 넘게 맞힌다 (실측 18/24)", score.eng >= 16, score.eng + "/" + score.engAll);

  await page.evaluate(() => document.querySelector("#titlebtn").click());
  await page.waitForTimeout(200);
  const off = await run("확인", false);
  ok("끄면 제목을 안 채운다", !off.title, await page.evaluate(() => document.querySelector("#titlebtn").textContent));
}

// 내려받은 파일로 열면 왜 안 되는지 말해 주는가
const p2 = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await p2.goto("file:///" + path.join(ROOT, "index.html").split(path.sep).join("/"));
await p2.waitForTimeout(400);
await p2.evaluate(() => document.querySelector("#titlebtn").click());
await p2.waitForTimeout(600);
const msg = await p2.evaluate(() => document.querySelector("#status").textContent.trim());
ok("파일로 열면 이유를 알려 준다", /주소로 열|서버/.test(msg), msg.slice(0, 60));
ok("파일로 열면 곧바로 알려 준다 (오래 안 기다린다)",
   await p2.evaluate(() => document.querySelector("#titlebtn").getAttribute("aria-pressed") === "false"));
await p2.close();

if (errs.length) ok("화면 오류 없음", false, errs[0]);
await browser.close();
server.close();
console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);
