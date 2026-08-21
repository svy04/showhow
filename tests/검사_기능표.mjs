// 상용 제품 기능표와 우리 것을 대조한다.
// "그대로 만들어냈는가"를 사람 기억이 아니라 파일에서 확인한다.
// 근거: 위키 매뉴얼-저작 references/캡처제품-해체-관찰.md
import fs from "fs";
import { fileURLToPath } from "url";
import path0 from "path";
process.chdir(path0.resolve(path0.dirname(fileURLToPath(import.meta.url)), ".."));


const src = fs.readFileSync("index.html", "utf8");
const has = (...needles) => needles.every(n => src.includes(n));

// [기능, 어느 제품이 갖고 있나, 그쪽에서 무료인가, 우리 코드에서 이걸로 확인]
const TABLE = [
  ["자동 촬영",            "Scribe·Tango·Guidde", false, () => has("function watchTick", "WATCH.FIRE")],
  ["클릭·변화 자리 표시",   "Tango",               false, () => has("function changedBox", 'className = "spot"')],
  ["주석(화살표·상자)",     "대개 유료",            false, () => has('m.t === "arrow"', 'm.t === "box"')],
  ["번호 매기기",          "Scribe·Tango",        true,  () => has('m.t === "badge"')],
  ["단계 글 자동 작성",     "Scribe·Tango",        false, () => has("function ocrFill", "function ocrTitle", "tessedit_pageseg_mode")],
  ["사진에 글자 넣기",      "Snagit 등(유료)",      false, () => has('m.t === "text"')],
  ["표시 색·굵기 고르기",   "전부(대개 유료)",       false, () => has("MK.COLORS", "function nextThick")],
  ["표시 하나만 지우기",    "전부",                 false, () => has("function markAt", 'MK.tool === "erase"')],
  ["끌어서 순서 바꾸기",    "전부",                 true,  () => has("function moveStep", "function dragHook")],
  ["단계 복제",            "불명",                 false, () => has('a === "copy"')],
  ["워드로 내보내기",       "불명",                 false, () => has("function exportDOCX", "word/document.xml")],
  ["글과 그림으로 내보내기", "불명",                 false, () => has("function exportMD")],
  ["민감정보 가리기",       "Scribe Pro·Tango Pro", false, () => has('m.t === "blur"')],
  ["순서 바꾸기",          "전부",                 true,  () => has('a === "up"', 'a === "down"')],
  ["단계 삭제",            "전부",                 true,  () => has('a === "del"')],
  ["단계 합치기·나누기",     "불명",                 false, () => has('a === "merge"', 'a === "split"', "function cutText")],
  ["섹션·묶음",            "ScreenSteps 등",       false, () => has('sec: true', "sectitle")],
  ["잠시 멈춤",            "Folge·Dubble",        true,  () => has("state.paused")],
  ["지나간 화면 되살리기",   "Dubble Pro",          false, () => has("const REWIND", "function openRewind")],
  ["PDF 내보내기",         "대개 유료",            false, () => has("window.print()", "@media print")],
  ["PPT 내보내기",         "대부분 없음",          false, () => has("function exportPPT", "pptSlideXml")],
  ["이미지 원본 저장",      "불명",                 false, () => has("function exportImages", "원본/")],
  ["작업 저장·불러오기",    "계정에 저장",          true,  () => has("function saveFile", "function openFile")],
  ["양식 저장·불러오기",    "기업 요금제",          false, () => has("manualForms", "f-export", "f-import")],
  ["한 파일로 공유",         "링크(계정 필요)",       false, () => has("function exportHTML")],
  ["받는 사람별 자르기",    "불명",                 false, () => has("function live", 'a === "skip"')],
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
  ["사진이 컴퓨터 밖으로 안 나감",         () => !/fetch\(|XMLHttpRequest|WebSocket/.test(src),
   "상용은 전부 서버에 올린다"],
];

let bad = 0;
console.log("── 상용 기능 재현 ──");
let free = 0, paid = 0;
for (const [name, who, isFree, test] of TABLE) {
  const okv = test();
  if (!okv) bad++;
  if (okv) { if (isFree) free++; else paid++; }
  console.log((okv ? "있음  " : "없음! ") + name.padEnd(22) + " (" + who + (isFree ? "" : " · 그쪽은 유료") + ")");
}
console.log(`\n재현 ${TABLE.length - bad}/${TABLE.length} · 그중 상용이 돈 받는 것 ${paid}개를 무료로 제공`);

console.log("\n── 상용이 못 하는 것 ──");
for (const [name, test, why] of BEYOND) {
  const okv = test();
  if (!okv) bad++;
  console.log((okv ? "됨    " : "안 됨! ") + name + "\n        근거: " + why);
}

console.log("\n" + (bad ? "빠진 것 " + bad + "건" : "기능표 전부 채움"));
process.exit(bad ? 1 : 0);
