// 상용 제품 기능표와 우리 것을 대조한다.
// "그대로 만들어냈는가"를 사람 기억이 아니라 파일에서 확인한다.
// 근거: 위키 매뉴얼-저작 references/캡처제품-해체-관찰.md
import fs from "fs";
import { fileURLToPath } from "url";
import path0 from "path";
process.chdir(path0.resolve(path0.dirname(fileURLToPath(import.meta.url)), ".."));


const src = fs.readFileSync("index.html", "utf8");
const has = (...needles) => needles.every(n => src.includes(n));

// [기능, 어느 제품이 갖고 있나, 그쪽 값 — "무료"·"유료"·"모름", 우리 코드에서 이걸로 확인]
// 그쪽 값을 확인 못 했으면 "모름" 이다. 모르는 것을 유료로 세면 우리 자랑이 부풀려진다.
const TABLE = [
  ["자동 촬영",            "Scribe·Tango·Guidde", "유료", () => has("function watchTick", "WATCH.FIRE")],
  ["클릭·변화 자리 표시",   "Tango",               "유료", () => has("function changedBox", 'className = "spot"')],
  ["주석(화살표·상자)",     "대개 유료",            "유료", () => has('m.t === "arrow"', 'm.t === "box"')],
  ["번호 매기기",          "Scribe·Tango",        "무료",  () => has('m.t === "badge"')],
  ["단계 글 자동 작성",     "Scribe·Tango",        "유료", () => has("function ocrFill", "function ocrTitle", "tessedit_pageseg_mode")],
  ["사진에 글자 넣기",      "Snagit 등(유료)",      "유료", () => has('m.t === "text"')],
  ["표시 색·굵기 고르기",   "전부(대개 유료)",       "유료", () => has("MK.COLORS", "function nextThick")],
  ["표시 하나만 지우기",    "전부",                 "유료", () => has("function markAt", 'MK.tool === "erase"')],
  ["끌어서 순서 바꾸기",    "전부",                 "무료",  () => has("function moveStep", "function dragHook")],
  ["단계 복제",            "불명",                 "모름", () => has('a === "copy"')],
  ["워드로 내보내기",       "불명",                 "모름", () => has("function exportDOCX", "word/document.xml")],
  ["글과 그림으로 내보내기", "불명",                 "모름", () => has("function exportMD")],
  ["민감정보 가리기",       "Scribe Pro·Tango Pro", "유료", () => has('m.t === "blur"')],
  ["순서 바꾸기",          "전부",                 "무료",  () => has('a === "up"', 'a === "down"')],
  ["단계 삭제",            "전부",                 "무료",  () => has('a === "del"')],
  ["단계 합치기·나누기",     "불명",                 "모름", () => has('a === "merge"', 'a === "split"', "function cutText")],
  ["섹션·묶음",            "ScreenSteps 등",       "유료", () => has('sec: true', "sectitle")],
  ["잠시 멈춤",            "Folge·Dubble",        "무료",  () => has("state.paused")],
  ["지나간 화면 되살리기",   "Dubble Pro",          "유료", () => has("const REWIND", "function openRewind")],
  ["PDF 내보내기",         "대개 유료",            "유료", () => has("window.print()", "@media print")],
  ["PPT 내보내기",         "대부분 없음",          "유료", () => has("function exportPPT", "pptSlideXml")],
  ["이미지 원본 저장",      "불명",                 "모름", () => has("function exportImages", "원본/")],
  ["작업 저장·불러오기",    "계정에 저장",          "무료",  () => has("function saveFile", "function openFile")],
  ["양식 저장·불러오기",    "기업 요금제",          "유료", () => has("manualForms", "f-export", "f-import")],
  ["한 파일로 공유",         "링크(계정 필요)",       "유료", () => has("function exportHTML")],
  ["받는 사람별 자르기",    "불명",                 "모름", () => has("function live", 'a === "skip"')],
  ["단계 찾기",            "불명",                 "모름", () => has("function 찾기", 'id="find"')],
  ["찾은 말 한 번에 바꾸기",  "불명",                 "모름", () => has("function 모두바꾸기", 'id="swapgo"')],
  ["다시 실행",            "전부",                 "무료", () => has("function redo", "UNDO.redo")],
  ["여러 단계 한꺼번에",     "불명",                 "모름", () => has("function 한꺼번에", "const PICK")],
  ["사진 갈아 끼우기",      "불명",                 "모름", () => has('a === "swap"', "function 사진넣기")],
  ["끌어다 놓아 사진 넣기",  "불명",                 "모름", () => has("function 놓인파일", "dropping")],
  ["보내기 전 미리보기",     "불명",                 "모름", () => has("function 미리보기", "function htmlDoc")],
  ["예전 판으로 되돌리기",   "불명",                 "모름", () => has("async function 백업", "function 예전판으로")],
];

// 상용이 못 하는 것 — 우리만의 것
const BEYOND = [
  ["글자 읽기가 컴퓨터 안에서만", () => has('src = "ocr/tesseract.min.js"') && !/https?:\/\/[^"']*tesseract/.test(src),
   "상용은 서버로 보내 읽는다 — 우리는 옆 폴더에서 읽는다"],
  ["클릭 없이도 담김(타이핑·단축키·로딩)", () => has("changedBox", "WATCH.CALM"),
   "Snagit·Microsoft 공식: 클릭이 아닌 동작은 기록되지 않는다"],
  ["너무 많이 찍히지 않음(멈출 때 한 장)", () => has("WATCH.CALM", "WATCH.BUSY"),
   "Reddit r/msp: 클릭한 자리만 찍혀 지울 것이 산더미"],
  ["화면 밖 프로그램도 무료로",            () => has("getDisplayMedia"),
   "Scribe·Guidde는 데스크톱이 유료"],
  ["사진이 컴퓨터 밖으로 안 나감",
   () => !/fetch\(|XMLHttpRequest|WebSocket/.test(src) &&
         // 글자 읽기 부품은 기본값이 CDN 이다. 우리가 세 경로를 전부 옆 폴더로 덮어썼는지 본다.
         has('workerPath: "ocr/', 'corePath: "ocr/', 'langPath: "ocr"'),
   "상용은 전부 서버에 올린다 · 글자 읽기 부품의 세 경로를 전부 옆 폴더로 덮어쓴 것까지 확인한다"],
  ["만든 것 전부를 한 파일로 들고 나감",    () => has("async function 전부저장", "showhow-all"),
   "상용은 계정 안에 있어 통째로 꺼내려면 문의 절차를 거친다"],
  ["예전 판이 이 컴퓨터 안에 남는다",       () => has("const BAK", "async function 백업"),
   "상용의 판 기록은 서버에 있고, 계정이 끊기면 같이 끊긴다"],
];

let bad = 0;
console.log("── 상용 기능 재현 ──");
let free = 0, paid = 0, unknown = 0;
for (const [name, who, 값, test] of TABLE) {
  const okv = test();
  if (!okv) bad++;
  if (okv) { if (값 === "무료") free++; else if (값 === "유료") paid++; else unknown++; }
  const 꼬리 = 값 === "유료" ? " · 그쪽은 유료" : 값 === "모름" ? " · 그쪽 값은 확인 못 함" : "";
  console.log((okv ? "있음  " : "없음! ") + name.padEnd(22) + " (" + who + 꼬리 + ")");
}
console.log(`\n재현 ${TABLE.length - bad}/${TABLE.length} · 그중 상용이 돈 받는 것으로 확인된 ${paid}개를 무료로 제공` +
  ` · 그쪽 값을 확인 못 한 것 ${unknown}개`);

console.log("\n── 상용이 못 하는 것 ──");
for (const [name, test, why] of BEYOND) {
  const okv = test();
  if (!okv) bad++;
  console.log((okv ? "됨    " : "안 됨! ") + name + "\n        근거: " + why);
}

console.log("\n" + (bad ? "빠진 것 " + bad + "건" : "기능표 전부 채움"));
process.exit(bad ? 1 : 0);
