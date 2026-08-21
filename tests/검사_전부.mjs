// 검사를 한 번에 다 돌린다.  쓰기: node 검사_전부.mjs
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
const HERE = path.dirname(fileURLToPath(import.meta.url));

const SUITES = [
  ["검사_전체.mjs",   "브라우저 없이 도는 뼈대 검사"],
  ["검사_양식.mjs",   "양식 저장·불러오기"],
  ["검사_기능표.mjs", "상용 제품 기능 대조"],
  ["검사_브라우저.mjs", "진짜 브라우저 — 내보내기·보관함·나쁜 상황·규모"],
  ["검사_촬영.mjs",   "진짜 브라우저 — 자동 촬영 전 과정"],
  ["검사_인쇄.mjs",   "진짜 브라우저 — PDF 출력"],
  ["검사_제목.mjs",   "단계 글 자동 작성 — 화면 글자 읽기"],
  ["검사_진짜공유.mjs", "대역 없이 진짜 화면 공유 (창이 잠깐 뜬다)"],
];

let bad = 0, pass = 0;
const rows = [];
const skips = [];
for (const [file, what] of SUITES) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(HERE, file)], { encoding: "utf8", maxBuffer: 1 << 26 });
  const out = (r.stdout || "") + (r.stderr || "");
  const n = (out.match(/^통과/gm) || []).length + (out.match(/^있음|^됨  /gm) || []).length;
  const f = (out.match(/^실패!|^없음!|^안 됨!/gm) || []).length;
  // 나갈 때 값 2 = 검사용 브라우저가 없어서 못 돌린 것. 실패와 구분한다.
  const skipped = r.status === 2;
  if (!skipped) { pass += n; bad += f; }
  const sec = Math.round((Date.now() - t0) / 100) / 10;
  rows.push([skipped ? "건너뜀" : (r.status === 0 && !f ? "통과" : "실패"), file, skipped ? "-" : n + "건", sec + "초", what]);
  if (skipped) skips.push(file);
  if (!skipped && (r.status !== 0 || f)) {
    console.log("── " + file + " ──");
    out.split("\n").filter(l => l.startsWith("실패!")).forEach(l => console.log("  " + l));
    if (r.status !== 0 && !f) console.log("  " + out.split("\n").slice(-6).join("\n  "));
  }
}


console.log("");
for (const [st, file, n, sec, what] of rows)
  console.log(st.padEnd(4) + "  " + file.padEnd(18) + n.padStart(5) + "  " + sec.padStart(6) + "   " + what);
console.log("\n합계 " + pass + "건 통과" + (bad ? " · " + bad + "건 실패" : " · 실패 없음"));
if (skips.length)
  console.log("건너뛴 검사 " + skips.length + "개 — 브라우저가 필요합니다: npm i -D playwright && npx playwright install msedge");
process.exit(bad ? 1 : 0);
