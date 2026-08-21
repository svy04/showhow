// PDF로 저장이 진짜 종이 모양으로 나오는지 확인한다.
// angela가 요청한 출력물이 PDF·PPT였으므로, 여기가 결과물의 마지막 관문이다.
// 쓰기: node 검사_인쇄.mjs
import { open, APP, ROOT } from "./브라우저.mjs";
import path from "path";
import fs from "fs";

const url = APP;
const fail = [];
const ok = (n, c, e = "") => { console.log((c ? "통과  " : "실패! ") + n + (e ? " — " + e : "")); if (!c) fail.push(n); };

const browser = await open();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(300);

await page.evaluate(() => {
  const cv = document.createElement("canvas"); cv.width = 1400; cv.height = 880;
  const g = cv.getContext("2d");
  const shot = i => {
    g.fillStyle = "#eef1f4"; g.fillRect(0, 0, 1400, 880);
    g.fillStyle = "#fff"; g.fillRect(50, 50, 1300, 120);
    g.fillStyle = "#333"; g.font = "36px sans-serif"; g.fillText("화면 " + i, 90, 125);
    g.fillStyle = "#cfd6dd"; g.fillRect(50, 200, 1300, 620);
    return cv.toDataURL("image/png");
  };
  const steps = [{ sec: true, title: "처음 설정하기" }];
  for (let i = 1; i <= 8; i++)
    steps.push({ title: i + "번째 단계 — 버튼을 누른다",
                 desc: "이 화면에서 오른쪽 위 버튼을 누릅니다. 누르면 다음 창이 열립니다.", img: shot(i) });
  steps.push({ sec: true, title: "관리자만 보는 것", off: true });
  steps.push({ title: "비밀 설정", desc: "밖에 나가면 안 되는 내용", img: shot(99) });
  docInto({ id: null, name: "설치 안내서", steps });
  applyForm({ name: "표준", org: "마이크림 마케팅팀", sub: "신입용 · 2026년판",
              intro: "따라 하면 됩니다. 막히면 담당자에게 물어보세요.", outro: "문의 · 마케팅팀 내선 000" });
});
await page.waitForTimeout(400);

const out = path.join(ROOT, "docs", "보기_인쇄본.pdf");
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.pdf({ path: out, format: "A4", printBackground: true,
                 margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" } });

const buf = fs.readFileSync(out);
const text = buf.toString("latin1");
ok("PDF 파일이 만들어진다", buf.length > 40000, Math.round(buf.length / 1024) + "KB");
ok("진짜 PDF 형식이다", text.startsWith("%PDF-"), text.slice(0, 8));
const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
ok("여러 쪽으로 나뉜다", pages >= 3, pages + "쪽");

// 인쇄 규칙이 실제로 걸려 있는가
const css = await page.evaluate(() => {
  const rules = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const r of sheet.cssRules)
        if (r.conditionText && r.conditionText.includes("print"))
          for (const rr of r.cssRules) rules.push(rr.cssText);
    } catch (e) {}
  }
  return rules.join(" ");
});
ok("인쇄할 때 화면 단추는 숨긴다",
   /#top|#bottom|#side|#shootwrap/.test(css) && /display:\s*none/.test(css),
   "숨김 규칙 " + (css.match(/display:\s*none/g) || []).length + "건");
ok("쪽이 단계 한가운데서 잘리지 않게 해 뒀다",
   /break-inside:\s*avoid|page-break-inside:\s*avoid/.test(css));

// 인쇄 순간의 화면을 그대로 재 본다 (print 상태로 스크린샷)
await page.emulateMedia({ media: "print" });
await page.waitForTimeout(200);
const shown = await page.evaluate(() => {
  const vis = sel => {
    const el = document.querySelector(sel);
    if (!el) return "없음";
    const cs = getComputedStyle(el);
    return cs.display === "none" || cs.visibility === "hidden" ? "숨김" : "보임";
  };
  return { top: vis("#top"), bottom: vis("#bottom"), side: vis("#side"), shoot: vis("#shootwrap"),
           cover: vis("#cover"), steps: vis("#steps"),
           secret: document.body.innerText.includes("비밀 설정") };
});
ok("인쇄 화면에서 단추줄이 사라진다", shown.top === "숨김" && shown.bottom === "숨김", JSON.stringify(shown));
ok("인쇄 화면에 표지와 단계는 남는다", shown.cover !== "숨김" && shown.steps !== "숨김");
ok("뺀 섹션은 인쇄에도 안 나온다", !shown.secret);
await page.emulateMedia({ media: "screen" });

await browser.close();
console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과") + "  ·  결과물: " + out);
process.exit(fail.length ? 1 : 0);
