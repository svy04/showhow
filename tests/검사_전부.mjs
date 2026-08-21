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
];

let bad = 0, pass = 0;
const rows = [];
for (const [file, what] of SUITES) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(HERE, file)], { encoding: "utf8", maxBuffer: 1 << 26 });
  const out = (r.stdout || "") + (r.stderr || "");
  const n = (out.match(/^통과/gm) || []).length + (out.match(/^있음|^됨  /gm) || []).length;
  const f = (out.match(/^실패!|^없음!|^안 됨!/gm) || []).length;
  pass += n; bad += f;
  const sec = Math.round((Date.now() - t0) / 100) / 10;
  rows.push([r.status === 0 && !f ? "통과" : "실패", file, n + "건", sec + "초", what]);
  if (r.status !== 0 || f) {
    console.log("── " + file + " ──");
    out.split("\n").filter(l => l.startsWith("실패!")).forEach(l => console.log("  " + l));
    if (r.status !== 0 && !f) console.log("  " + out.split("\n").slice(-6).join("\n  "));
  }
}

const w = n => String(n);
console.log("");
for (const [st, file, n, sec, what] of rows)
  console.log(st + "  " + file.padEnd(18) + n.padStart(5) + "  " + sec.padStart(6) + "   " + what);
console.log("\n합계 " + pass + "건 통과" + (bad ? " · " + bad + "건 실패" : " · 실패 없음"));
process.exit(bad ? 1 : 0);
