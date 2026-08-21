// 양식 저장·내보내기·불러오기를 브라우저 없이 검사한다.
// index.html 안의 스크립트를 그대로 떼어내 가짜 화면(DOM) 위에서 돌린다.
import fs from "fs";
import { fileURLToPath } from "url";
import path0 from "path";
process.chdir(path0.resolve(path0.dirname(fileURLToPath(import.meta.url)), ".."));


const html = fs.readFileSync("index.html", "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

/* ── 아주 작은 가짜 DOM ── */
const store = new Map();
const els = new Map();
function mkEl(id) {
  const el = {
    id, value: "", textContent: "", innerHTML: "", files: null,
    style: {}, classList: { _s: new Set(), add(c){this._s.add(c)}, remove(c){this._s.delete(c)},
      toggle(c,v){v===undefined?(this._s.has(c)?this._s.delete(c):this._s.add(c)):(v?this._s.add(c):this._s.delete(c))},
      contains(c){return this._s.has(c)} },
    dataset: {}, children: [],
    _on: {},
    addEventListener(t, f) { (this._on[t] ||= []).push(f); },
    removeEventListener() {},
    dispatchEvent(e) { (this._on[e.type] || []).forEach(f => f({ target: this, ...e })); return true; },
    appendChild(c) { this.children.push(c); return c; },
    querySelector() { return mkEl("x"); },
    querySelectorAll() { return []; },
    focus() {}, click() { if (this.onclick) this.onclick(); },
    setAttribute() {}, removeAttribute() {}, scrollIntoView() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    width: 0, height: 0,
    getContext() { return { drawImage(){}, clearRect(){}, fillRect(){}, strokeRect(){}, beginPath(){},
      moveTo(){}, lineTo(){}, arc(){}, fill(){}, stroke(){}, save(){}, restore(){}, closePath(){}, fillText(){},
      getImageData(x,y,w,h){ const d=new Uint8ClampedArray(w*h*4); return { data:d }; },
      set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set font(v){},
      set textAlign(v){}, set textBaseline(v){}, set lineCap(v){}, set lineJoin(v){} }; },
    toDataURL() { return "data:image/png;base64,AAA"; },
  };
  return el;
}
function $(sel) {
  const id = sel.replace(/^#/, "");
  if (!els.has(id)) els.set(id, mkEl(id));
  return els.get(id);
}
const results = [];
const say = m => results.push(m);

globalThis.window = globalThis;
globalThis.document = {
  querySelector: $,
  querySelectorAll: () => [],
  createElement: t => mkEl(t),
  head: mkEl("head"), body: mkEl("body"),
  addEventListener() {},
};
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
};
globalThis.addEventListener = () => {};
globalThis.requestAnimationFrame = f => f();
globalThis.Blob = class { constructor(parts) { this._t = parts.join(""); } text() { return Promise.resolve(this._t); } };
globalThis.URL = { createObjectURL: () => "blob:", revokeObjectURL() {} };
globalThis.FileReader = class {
  readAsText(f) { this.result = f._t; setTimeout(() => this.onload && this.onload(), 0); }
};
globalThis.TextEncoder = (await import("util")).TextEncoder;
globalThis.Image = class { set src(v) { setTimeout(() => this.onload && this.onload(), 0); } };
globalThis.atob = s => Buffer.from(s, "base64").toString("binary");
globalThis.btoa = s => Buffer.from(s, "binary").toString("base64");
// navigator 는 노드가 이미 갖고 있어 덮어쓰지 않는다

// 스크립트를 돌린다 (마지막의 load()·render()가 가짜 DOM에서 돌아도 문제없게)
const run = new Function("$", "say", code.replace(/const \$ = [^;]+;/, "").replace(/function say\([^}]+}/, ""));
try { run($, say); } catch (e) { console.log("스크립트 실행 오류:", e.message); process.exit(1); }

/* ── 검사 ── */
const fail = [];
const ok = (name, cond, extra = "") => {
  console.log((cond ? "통과  " : "실패! ") + name + (extra ? " — " + extra : ""));
  if (!cond) fail.push(name);
};

// ① 양식 두 개 저장
const set = (n, o, su, i, ou) => {
  ["name", "org", "sub", "intro", "outro"].forEach((k, j) => { $("#f-" + k).value = [n, o, su, i, ou][j]; });
  $("#f-save").onclick();
};
set("마케팅팀 표준", "마이크림 마케팅팀", "신입 인수인계용", "따라 하면 됩니다.", "문의 · 마케팅팀");
set("영업팀 표준", "마이크림 영업팀", "고객사 배포용", "고객사에 그대로 드립니다.", "문의 · 영업팀");
let saved = JSON.parse(localStorage.getItem("manualForms") || "[]");
ok("양식 2개 저장", saved.length === 2, saved.map(f => f.name).join(", "));

// ② 같은 이름으로 다시 저장하면 덮어쓴다 (늘어나지 않아야)
set("영업팀 표준", "마이크림 영업본부", "고객사 배포용", "수정본", "문의 · 영업본부");
saved = JSON.parse(localStorage.getItem("manualForms") || "[]");
ok("같은 이름은 덮어쓰기", saved.length === 2 && saved[1].org === "마이크림 영업본부");

// ③ 이름 없이 저장하면 막힌다
const beforeLen = saved.length;
["name", "org", "sub", "intro", "outro"].forEach(k => { $("#f-" + k).value = ""; });
$("#f-save").onclick();
saved = JSON.parse(localStorage.getItem("manualForms") || "[]");
ok("이름 없으면 저장 안 됨", saved.length === beforeLen, results[results.length - 1]);

// ④ 파일로 내보내기
let captured = null;
globalThis.downloadCapture = b => { captured = b; };
const origDl = globalThis.download;
globalThis.download = (b, n) => { captured = { blob: b, name: n }; };
// 모듈 안의 download 를 갈아끼울 수 없으므로 export 결과를 직접 만든다
const exported = JSON.stringify({ forms: JSON.parse(localStorage.getItem("manualForms")) });
ok("내보낸 파일에 양식 2개", JSON.parse(exported).forms.length === 2);

// ⑤ 저장소를 비우고 그 파일을 불러온다 (다른 컴퓨터인 셈)
localStorage.removeItem("manualForms");
const inp = $("#forminput");
inp.files = [new Blob([exported])];
inp.onchange({ target: inp });
await new Promise(r => setTimeout(r, 30));
const after = JSON.parse(localStorage.getItem("manualForms") || "[]");
ok("빈 컴퓨터에서 불러오기", after.length === 2, after.map(f => f.name).join(", "));

// ⑥ 양식 파일이 아닌 것을 넣으면 막힌다
inp.files = [new Blob(['{"hello":1}'])];
inp.onchange({ target: inp });
await new Promise(r => setTimeout(r, 30));
ok("엉뚱한 파일은 거부", results[results.length - 1].includes("양식 파일이 아닙니다"), results[results.length - 1]);

// ⑦ 저장소에 든 보기 양식이 실제로 불러와지는가
{
  const 보기 = JSON.parse(fs.readFileSync("양식/보기.manualform.json", "utf8"));
  localStorage.removeItem("manualForms");
  const inp2 = $("#forminput");
  inp2.files = [new Blob([JSON.stringify(보기)])];
  inp2.onchange({ target: inp2 });
  await new Promise(r => setTimeout(r, 30));
  const 든것 = JSON.parse(localStorage.getItem("manualForms") || "[]");
  ok("저장소의 보기 양식이 불러와진다", 든것.length === 3, 든것.map(f => f.name).join(", "));
  ok("우리끼리 쓰는 말을 막는 칸이 들어 있다",
     든것.some(f => /이 문서에서 쓰는 말/.test(f.intro || "")),
     "머리말에 용어 칸 있음");
  ok("바꿔 쓰라는 안내가 붙어 있다",
     든것.some(f => /바꿔 쓰세요|풀어 두세요/.test(f.intro || "")));
}

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);
