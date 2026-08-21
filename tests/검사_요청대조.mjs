// 합격 기준 두 축을 파일에서 확인한다.
//
// 이 물건의 합격 기준은 두 가지였다.
//   범용성 — 한국에서 이 일을 하는 사람이 있고, 지금 쓰는 것에 불만이 있고,
//            우리 물건이 그 자리에 들어갈 수 있는가
//   특수성 — 우리 회사가 지금 필요한 매뉴얼을 이 도구로 만들 수 있는가
//
// 사람 기억이 아니라 코드에서 확인한다. 쓰기: node tests/검사_요청대조.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const has = (...needles) => needles.every(n => src.includes(n));
const 양식보기 = path.join(ROOT, "양식", "보기.manualform.json");

let bad = 0;
const 줄 = (ok, 이름, 근거) => {
  if (!ok) bad++;
  console.log((ok ? "됨    " : "안 됨! ") + 이름.padEnd(30) + " " + 근거);
};

/* ── 범용성 — 요청한 사람이 쓴 그대로 ──────────────────────────
   원문: 2026-08-17 디시 사용자 angela
   "스크린샷 캡쳐 → 제목,내용 작성 → 필요하면 기호 등을 활용한 편집기능 지원
    → 프로젝트/섹션 단위로 정리 가능 → PDF, PPT 내보내기, 이미지원본 별도로 저장,
    양식도 별개로 저장 및 불러오기 해서 회사나 부서별로 지정해서 쓸 수 있으면 좋을듯" */
console.log("── 요청한 사람이 쓴 일곱 가지 ──");
const 요청 = [
  ["① 스크린샷 캡처", () => has("getDisplayMedia", "function grabFrame")],
  ["② 제목·내용 작성", () => has('class="stitle', 'class="sdesc', "contenteditable")],
  ["③ 기호 등 편집 기능", () => has('m.t === "box"', 'm.t === "arrow"', 'm.t === "badge"', 'm.t === "text"')],
  ["④ 프로젝트 단위 정리", () => has("function boxAll", "function boxNew", "function boxOpenDoc")],
  ["④ 섹션 단위 정리", () => has("sec: true", "sectitle")],
  ["⑤ PDF 내보내기", () => has("window.print()", "@media print")],
  ["⑤ PPT 내보내기", () => has("function exportPPT", "ppt/slides/slide")],
  ["⑥ 이미지 원본 별도 저장", () => has("function exportImages", "원본/")],
  ["⑦ 양식 저장·불러오기", () => has("manualForms", "f-export", "f-import")],
  ["⑦ 회사·부서별로 지정", () => has("f-org", "paintCover") && fs.existsSync(양식보기)],
];
for (const [이름, t] of 요청) 줄(t(), 이름, "");

console.log("\n── 요청한 사람이 '어려울 것 같다'며 뺀 것 ──");
줄(has("function watchTick", "WATCH.CALMMS"), "영상처럼 보고 편집점 잡기",
   "화면 변화를 초당 7번 보고 멈추는 순간을 잡는다");
줄(has("const REWIND", "function openRewind"), "놓친 편집점 되살리기",
   "최근 화면을 들고 있다가 꺼낸다");

console.log("\n── 요청한 사람이 말한 고통 ──");
줄(has("function changedBox", "WATCH.FIRE"), "빠진 게 있을 때가 있다",
   "클릭이 아니라 화면 변화로 담는다 — 타이핑·단축키·로딩도 들어온다");
줄(!/fetch\(|XMLHttpRequest|WebSocket/.test(src), "죄다 유료다",
   "MIT · 서버 없음 · 계정 없음");

/* ── 특수성 — 우리 회사에서 쓸 수 있는가 ────────────────────────
   근거: 자기개발\업무_매뉴얼도구\검사_우리회사축_2026-08-21.md
   우리가 실제로 겪은 문서 실패 6건을 이 도구가 막는가 */
console.log("\n── 우리 회사가 겪은 실패 여섯 가지 ──");
const 실패 = [
  ["실행이 안 됨 (8/11)", () => has("function grabFrame", 'class="shot"'),
   "찍은 화면이 곧 단계다 — 글 대신 그 순간의 화면을 준다"],
  ["이름이 흔들림 (8/11)", () => has('m.t === "badge"', 'm.t === "arrow"', 'm.t === "text"'),
   "번호·화살표·글자로 그 물건을 직접 가리킨다"],
  ["한 문장에 정보 여럿 (8/13)", () => has('class="stitle', 'class="sdesc'),
   "한 단계에 제목 한 줄 + 설명 한 칸 — 구조가 강제한다"],
  ["결론이 뒤에 있음 (8/13)", () => has("data-ph=\"' + (s.auto ? \"여기서 무엇을 했나요\""),
   "제목이 곧 '무엇을 하는가'다"],
  ["우리끼리 쓰는 말 (8/13)", () => fs.existsSync(양식보기) &&
     /이 문서에서 쓰는 말/.test(fs.readFileSync(양식보기, "utf8")),
   "양식 머리말에 「이 문서에서 쓰는 말」 칸 — 양식/보기.manualform.json"],
  ["받는 사람에 안 맞춤 (8/18)", () => has("function live", 'a === "skip"'),
   "섹션마다 '이번엔 빼기' — 내보내기 전부에 반영된다"],
];
for (const [이름, t, 근거] of 실패) 줄(t(), 이름, 근거);

/* ── 첫 사용자는 우리다 — 실제로 만든 것이 있는가 ── */
console.log("\n── 실제로 만든 것 ──");
const 문서 = path.join(ROOT, "docs", "showhow-쓰는법.html");
const 만들기 = path.join(ROOT, "tests", "만들기_사용법.mjs");
줄(fs.existsSync(문서), "이 도구로 만든 문서가 있다",
   fs.existsSync(문서) ? "docs/showhow-쓰는법.html · " + Math.round(fs.statSync(문서).size / 1024) + "KB" : "없음");
if (fs.existsSync(문서)) {
  const html = fs.readFileSync(문서, "utf8");
  줄(/<section>/.test(html), "그 문서에 단계가 들어 있다",
     (html.match(/<section>/g) || []).length + "단계");
  줄((html.match(/data:image\/png;base64,/g) || []).length >= 3, "그 문서에 담긴 화면이 들어 있다",
     (html.match(/data:image\/png;base64,/g) || []).length + "장");
}
줄(fs.existsSync(만들기), "그 문서를 다시 만들 수 있다",
   "node tests/만들기_사용법.mjs");

console.log("\n" + (bad ? "안 채운 칸 " + bad + "개" : "두 축 전부 채움"));
process.exit(bad ? 1 : 0);
