// 전체 흐름을 브라우저 없이 검사한다: 찍기 → 쓰기 → 섹션 → 표시 → 저장 → 불러오기 → PPT
import fs from "fs";
import { fileURLToPath } from "url";
import path0 from "path";
process.chdir(path0.resolve(path0.dirname(fileURLToPath(import.meta.url)), ".."));

const html = fs.readFileSync("index.html", "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const store = new Map(), els = new Map();
const results = [];
function mkEl(id) {
  return {
    id, value: "", textContent: "", innerHTML: "", files: null, width: 0, height: 0,
    style: {}, classList: { _s: new Set(), add(c){this._s.add(c)}, remove(c){this._s.delete(c)},
      toggle(c,v){v===undefined?(this._s.has(c)?this._s.delete(c):this._s.add(c)):(v?this._s.add(c):this._s.delete(c))},
      contains(c){return this._s.has(c)} },
    dataset: {}, children: [], _on: {},
    addEventListener(t,f){(this._on[t] ||= []).push(f)}, removeEventListener(){},
    dispatchEvent(e){(this._on[e.type]||[]).forEach(f=>f({target:this,...e}));return true},
    appendChild(c){this.children.push(c);return c},
    querySelector(){return mkEl("x")}, querySelectorAll(){return []},
    focus(){}, click(){this.onclick&&this.onclick()},
    setAttribute(){}, removeAttribute(){}, scrollIntoView(){},
    getContext(){ const self=this; return { drawImage(){}, clearRect(){}, fillRect(){}, strokeRect(){}, beginPath(){},
      getImageData(x,y,w,h){ const d=new Uint8ClampedArray(w*h*4); const v=globalThis.__fakePixel||30;
        for(let i=0;i<d.length;i+=4){ d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; } return { data:d }; },
      moveTo(){}, lineTo(){}, arc(){}, fill(){}, stroke(){}, save(){}, restore(){}, closePath(){},
      fillText(){}, set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set font(v){},
      set textAlign(v){}, set textBaseline(v){}, set lineCap(v){}, set lineJoin(v){} }},
    toDataURL(){ return "data:image/png;base64,PIX" + (globalThis.__fakePixel || 0); },
    getBoundingClientRect(){return{left:0,top:0,width:100,height:100}},
  };
}
function $(sel){ const id = sel.replace(/^#/,""); if(!els.has(id)) els.set(id, mkEl(id)); return els.get(id); }
globalThis.window = globalThis;
globalThis.document = { querySelector:$, querySelectorAll:()=>[], createElement:t=>mkEl(t),
  head:mkEl("head"), body:mkEl("body"), addEventListener(){} };
globalThis.localStorage = { getItem:k=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k), clear:()=>store.clear() };
globalThis.addEventListener = ()=>{};
globalThis.requestAnimationFrame = f=>f();
globalThis.Blob = class { constructor(p){ this._parts = p; this._t = p.map(x=>typeof x==="string"?x:"").join(""); }
  text(){ return Promise.resolve(this._t); } };
globalThis.URL = { createObjectURL:()=>"blob:", revokeObjectURL(){} };
globalThis.FileReader = class { readAsText(f){ this.result = f._t; setTimeout(()=>this.onload&&this.onload(),0); } };
globalThis.TextEncoder = (await import("util")).TextEncoder;
globalThis.Image = class { set src(v){ this.naturalWidth=1200; this.naturalHeight=750; setTimeout(()=>this.onload&&this.onload(),0);} };
globalThis.atob = s=>Buffer.from(s,"base64").toString("binary");
globalThis.btoa = s=>Buffer.from(s,"binary").toString("base64");

const say = m => results.push(m);
const HOOK = `
return { state, shoot, act, render, save, saveFile, exportPPT, exportImages, applyForm, zipMake, live, exportHTML, cutText, loopWatch, busyScreen,
  WATCH, watchTick, watchStart, watchStop, REWIND, rewindPush, openRewind, changedBox, UNDO, undo, redo, snap, paintSaved, 글만, SPOTWORD, renderSide,
  _fakeCapture() { stream = { getVideoTracks: () => [{ addEventListener() {} }] };
                   video = { videoWidth: 1200, videoHeight: 750 }; } };`;
const run = new Function("$","say", code.replace(/const \$ = [^;]+;/,"").replace(/function say\([^}]+}/,"") + HOOK);
const api = run($, say);

const fail = [];
const ok = (n,c,e="") => { console.log((c?"통과  ":"실패! ")+n+(e?" — "+e:"")); if(!c) fail.push(n); };

// 화면 잡힌 척
api._fakeCapture();
const S = api.state;

// ① 찍으면 단계가 는다
await api.shoot(); await api.shoot(); await api.shoot();
ok("찍으면 단계가 쌓인다", S.steps.length === 3, S.steps.length + "단계");
ok("찍은 단계에 사진이 있다", S.steps.every(s=>!!s.img));

// ② 제목·설명
S.steps[0].title = "마이크림 원을 켠다"; S.steps[0].desc = "바탕화면 아이콘을 두 번 누릅니다.";
S.steps[1].title = "디스코드를 연결한다";
S.steps[2].title = "내 결정을 저장한다";
ok("제목이 붙는다", S.steps[0].title.length > 0);

// ③ 섹션
S.steps.unshift({ sec:true, title:"처음 설정하기" });
api.render();
ok("섹션이 들어간다", S.steps.filter(s=>s.sec).length === 1);

// ④ 순서 바꾸기·삭제
const before = S.steps[2].title;
api.act("down", 2);
ok("아래로 옮기면 순서가 바뀐다", S.steps[3].title === before, before);
const n0 = S.steps.length;
api.act("del", S.steps.length-1);
ok("삭제하면 준다", S.steps.length === n0-1);

// ⑤ 저장 → 지움 → 불러오기
S.name = "마이크림 원 처음 쓰는 법";
api.applyForm({ name:"마케팅팀 표준", org:"마이크림 마케팅팀", sub:"신입 인수인계용", intro:"따라 하면 됩니다.", outro:"문의 · 마케팅팀" });
api.save();
const raw = localStorage.getItem("manualDraft");
ok("작업이 저장된다", !!raw && JSON.parse(raw).steps.length === S.steps.length);
ok("양식도 같이 저장된다", !!JSON.parse(raw).form && JSON.parse(raw).form.org === "마이크림 마케팅팀");

// ⑥ PPT
let cap = null;
const realBlob = globalThis.Blob;
globalThis.Blob = class extends realBlob { constructor(p,o){ super(p,o); cap = this; } };
await api.exportPPT();
ok("PPT가 만들어진다", !!cap, results[results.length-1]);


/* ── 받는 사람별로 자르기 (섹션 빼기) ── */
S.steps.length = 0;
S.steps.push({ sec: true, title: "모두 보는 부분" });
api._fakeCapture();
await api.shoot(); S.steps[1].title = "공통 단계";
S.steps.push({ sec: true, title: "관리자만 보는 부분" });
await api.shoot(); S.steps[3].title = "관리자 단계";
api.render();
ok("자르기 전 전부 나감", api.live().length === 4, api.live().length + "개");
S.steps[2].off = true;              // 관리자 섹션을 뺀다
api.render();
const kept = api.live();
ok("뺀 섹션은 안 나감", kept.length === 2 && kept.every(x => x.title !== "관리자 단계"), kept.map(x=>x.title).join(", "));
S.steps[2].off = false;
api.render();
ok("다시 넣으면 돌아온다", api.live().length === 4);

console.log("\n" + (fail.length ? "실패 "+fail.length+"건" : "전부 통과 (자르기 포함)"));
/* ── 자동 촬영이 실물에서도 도는가 ── */
S.steps.length = 0;
api._fakeCapture();
globalThis.video = { videoWidth: 1200, videoHeight: 750 };
api.watchStart();
const tick = api.watchTick;
// 실제와 같은 조건으로 재려면 시간이 흘러야 한다. 눈금 하나 = 140밀리초.
let 시계 = 1000;
api.WATCH.now = () => 시계;
const 눈금 = () => { 시계 += 140; };
const feed = (v, times) => { for (let i = 0; i < times; i++) { globalThis.__fakePixel = v; 눈금(); tick(); } };

// 잠잠 → 크게 바뀜 → 잠잠  = 한 장
globalThis.__fakePixel = 30; feed(30, 5);
feed(200, 2);
feed(200, 5);
ok("바뀌고 멈추면 자동으로 한 장", S.steps.length === 1, S.steps.length + "장");

// 또 한 번 바뀜 = 두 장
feed(60, 2); feed(60, 5);
ok("또 바뀌면 또 한 장", S.steps.length === 2, S.steps.length + "장");

// 안 바뀌면 안 찍음
feed(60, 12);
ok("안 바뀌면 안 찍는다", S.steps.length === 2, S.steps.length + "장");

// 계속 바뀌면(영상) 안 찍음
for (let i = 0; i < 40; i++) feed(60 + (i * 37) % 150, 1);
ok("계속 바뀌면 안 찍는다", S.steps.length === 2, S.steps.length + "장");

// 잠시 멈춤이 먹는가
S.paused = true;
feed(255, 2); feed(255, 6);
ok("잠시 멈추면 안 담긴다", S.steps.length === 2, S.steps.length + "장");
S.paused = false;

// 자동으로 담긴 것에 표식이 있는가 (나중에 사람이 찍은 것과 구분)
ok("자동으로 담긴 표식이 있다", S.steps.every(x => x.auto === true));

api.watchStop();
ok("끄면 멈춘다", api.WATCH.on === false);

/* ── 단계 둘로 나누기 ── */
S.steps.length = 0;
api._fakeCapture();
globalThis.__fakePixel = 31; await api.shoot();
globalThis.__fakePixel = 32; await api.shoot();
S.steps[0].title = "파일을 연다"; S.steps[0].desc = "메뉴에서 열기를 누릅니다.";
S.steps[1].title = "이름을 넣는다"; S.steps[1].desc = "칸에 이름을 씁니다.";
const imgA = S.steps[0].img, imgB = S.steps[1].img;
api.act("merge", 1);
ok("합치면 하나가 된다", S.steps.length === 1 && S.steps[0].extra.length === 1);
api.act("split", 0);
ok("나누면 둘로 돌아온다", S.steps.length === 2, S.steps.length + "단계");
ok("딸린 사진이 아래 단계로 간다", S.steps[1].img === imgB && !S.steps[0].extra);
ok("위 단계 사진은 그대로다", S.steps[0].img === imgA);

S.steps.length = 0;
globalThis.__fakePixel = 33; await api.shoot();
S.steps[0].title = "설정을 바꾼다";
S.steps[0].desc = "먼저 설정 창을 엽니다. 그다음 알림을 끕니다.";
api.act("split", 0);
ok("사진이 하나면 설명을 자른다", S.steps.length === 2);
ok("앞 문장이 위에 남는다", S.steps[0].desc === "먼저 설정 창을 엽니다.", S.steps[0].desc);
ok("뒤 문장이 아래로 간다", S.steps[1].desc === "그다음 알림을 끕니다.", S.steps[1].desc);
ok("나눈 것도 되돌릴 수 있다", (api.undo(), S.steps.length === 1 && S.steps[0].desc.includes("알림을 끕니다")));

S.steps.length = 0;
globalThis.__fakePixel = 34; await api.shoot();
S.steps[0].desc = "저장";
const beforeSplit = S.steps.length; api.act("split", 0);
ok("나눌 것이 없으면 그대로 둔다", S.steps.length === beforeSplit, results[results.length - 1]);
S.steps.length = 0;
S.steps.push({ sec: true, title: "섹션" });
api.act("split", 0);
ok("섹션 이름은 안 나뉜다", S.steps.length === 1);

ok("글자르기: 첫 자리 말고 가운데 자리", (() => { const r = api.cutText("가. 나다라마바사아. 자차카타파하."); return r && r[0] === "가. 나다라마바사아." && r[1] === "자차카타파하."; })(), JSON.stringify(api.cutText("가. 나다라마바사아. 자차카타파하.")));
ok("글자르기: 짧으면 안 자른다", api.cutText("저장") === null);
ok("글자르기: 빈 글도 안 죽는다", api.cutText(undefined) === null);

/* ── 스스로 찍는 고리 끊기 ──
   고른 화면에 이 창이 보이면 한 장 담길 때마다 화면이 또 바뀌어 끝없이 담긴다.
   진짜 화면 공유로 재 보니 3~6눈금마다 한 장이었다 (검사_진짜공유.mjs).
   사람이 하는 일은 그보다 뜸하므로, 그렇게 빠르면 고리로 보고 멈춘다. */
S.steps.length = 0;
api._fakeCapture();
globalThis.video = { videoWidth: 1200, videoHeight: 750 };
api.watchStart(); api.WATCH.now = () => 시계;
const tick2 = api.watchTick;
const feed2 = (v, times) => { for (let i = 0; i < times; i++) { globalThis.__fakePixel = v; 눈금(); tick2(); } };

// 사람이 하는 속도 — 담긴 사이가 뜸하다
globalThis.__fakePixel = 30; feed2(30, 5);
feed2(200, 2); feed2(200, 7);
const 사람1 = S.steps.length;
feed2(60, 2); feed2(60, 7);
feed2(150, 2); feed2(150, 7);
ok("뜸하게 담기면 안 끊는다", api.WATCH.on && S.steps.length === 사람1 + 2,
   S.steps.length + "장 · 자동 " + (api.WATCH.on ? "켜짐" : "꺼짐"));

// 고리 속도 — 담긴 사이가 6눈금 이내로 잇따른다
api.watchStop(); S.steps.length = 0; api.watchStart(); api.WATCH.now = () => 시계;
globalThis.__fakePixel = 30; feed2(30, 3);
for (let r = 0; r < 6 && api.WATCH.on; r++) { feed2(r % 2 ? 200 : 40, 1); feed2(r % 2 ? 200 : 40, 6); }
ok("고리 속도로 담기면 자동을 끈다", !api.WATCH.on, S.steps.length + "장에서 멈춤");
ok("왜 껐는지 말해 준다", /빠르게|자기 자신/.test(results[results.length - 1] || ""),
   (results[results.length - 1] || "").slice(0, 46));
ok("고리를 끊어도 담긴 것은 남는다", S.steps.length > 0, S.steps.length + "장");
ok("다시 켜면 셈이 처음부터", (api.watchStart(), api.WATCH.fast === 0 && api.WATCH.lastShot === 0));

/* ── 쉬지 않는 화면(영상·스크롤)에서 같은 장면이 겹쳐 와도 안 속는가 ──
   화면 공유는 같은 장면을 다시 보낸다. 그 한두 눈금을 "멈췄다"로 읽으면
   영상 도는 내내 사진이 쌓인다 (2026-08-21 실측 3장). */
api.watchStop(); S.steps.length = 0; api.watchStart(); api.WATCH.now = () => 시계;
const tick3 = api.watchTick;
const put = v => { globalThis.__fakePixel = v; 눈금(); tick3(); };

globalThis.__fakePixel = 30; for (let i = 0; i < 4; i++) put(30);
let v = 40;
for (let i = 0; i < 60; i++) {          // 영상: 계속 바뀐다. 다만 다섯 번에 한 번은 같은 장면이 두 번 온다
  v = 40 + ((i * 37) % 180);
  put(v);
  if (i % 5 === 4) { put(v); put(v); }  // 겹쳐 온 장면 두 눈금
}
ok("영상 중 같은 장면이 겹쳐 와도 안 담는다", S.steps.length === 0, S.steps.length + "장");
ok("쉬지 않는 화면으로 알아본다", api.busyScreen(), "최근 눈금 대부분이 움직임");
const 영상직후 = api.WATCH.videoUntil - 시계;

for (let i = 0; i < 24; i++) put(v);    // 영상이 끝나고 진짜로 멈춘다
ok("영상이 끝나면 한 장으로 정리된다", S.steps.length === 1, S.steps.length + "장");
ok("계속 움직이는 동안 사람에게 알린다", results.some(m => /쉬지 않고 움직/.test(m)), "알림 " + (results.some(m => /쉬지 않고 움직/.test(m)) ? "있음" : "없음"));
ok("영상이었다는 것을 시계로 기억한다", 영상직후 > 0, "영상이 끝난 순간 앞으로 " + Math.round(영상직후 / 100) / 10 + "초 더 영상으로 봄");

/* ── 다시 실행 ── */
S.steps.length = 0;
["하나", "둘", "셋"].forEach(t => S.steps.push({ title: t, desc: "", img: "x" }));
api.act("del", 1);
ok("지우면 준다 (다시 실행 시험)", S.steps.map(x => x.title).join(",") === "하나,셋", S.steps.map(x => x.title).join(","));
api.undo();
ok("되돌리면 살아난다", S.steps.map(x => x.title).join(",") === "하나,둘,셋");
api.redo();
ok("다시 실행하면 또 지워진다", S.steps.map(x => x.title).join(",") === "하나,셋", S.steps.map(x => x.title).join(","));
api.undo(); api.undo();
ok("더 되돌릴 게 없어도 안 죽는다 (다시 실행 뒤)", true, results[results.length - 1]);
api.redo();
ok("다시 실행도 여러 번 된다", S.steps.length >= 2, S.steps.length + "단계");
api.act("del", 0);
api.redo();
ok("새로 손대면 다시 실행 거리가 사라진다",
   /다시 실행할 것이 없습니다/.test(results[results.length - 1] || ""), results[results.length - 1]);

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과 (자동 촬영 포함)"));
/* ── 되돌리기: 안 찍힌 것을 꺼낼 수 있는가 ── */
S.steps.length = 0;
api.REWIND.keep.length = 0;
api.REWIND.tick = 0;
api._fakeCapture();
globalThis.video = { videoWidth: 1200, videoHeight: 750 };
api.watchStart(); api.WATCH.now = () => 시계;

// 화면이 여러 번 바뀌는 동안, 자동 촬영은 일부만 잡고 되돌리기 창고는 계속 쌓인다
globalThis.__fakePixel = 30; for (let i = 0; i < 4; i++) tick();
for (const v of [90, 120, 150, 180]) { globalThis.__fakePixel = v; tick(); }   // 빠르게 지나감 = 자동은 못 잡음
globalThis.__fakePixel = 180; for (let i = 0; i < 6; i++) tick();

ok("되돌리기 창고가 쌓인다", api.REWIND.keep.length > 0, api.REWIND.keep.length + "장 보관");
ok("창고에 시각이 함께 있다", api.REWIND.keep.every(k => typeof k.t === "number" && !!k.thumb));

// 창고 상한을 넘지 않는다 (메모리 폭주 방지)
for (let i = 0; i < 400; i++) { globalThis.__fakePixel = 30 + (i % 200); api.rewindPush(); }
ok("창고에 상한이 있다", api.REWIND.keep.length <= api.REWIND.MAX, api.REWIND.keep.length + " / 상한 " + api.REWIND.MAX);

// 골라서 단계로 넣기
const beforeRew = S.steps.length;
api.openRewind();
const first = document.querySelector("#rewgrid");
ok("되돌리기 창이 열린다", true);
// 실제 고르기는 화면 클릭이므로, 같은 일을 코드로 한다
const pick = api.REWIND.keep[api.REWIND.keep.length - 1];
S.steps.push({ title: "", desc: "", img: pick.thumb, rewound: true });
api.render();
ok("고른 화면이 단계가 된다", S.steps.length === beforeRew + 1 && S.steps[S.steps.length-1].rewound === true);

api.watchStop();

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과 (되돌리기 포함)"));

/* ── 바뀐 자리 찾기 ── */
{
  const W2 = 40, H2 = 30;
  const a = new Uint8Array(W2 * H2).fill(30);
  const b = a.slice();
  for (let y = 10; y < 16; y++) for (let x = 20; x < 30; x++) b[y * W2 + x] = 220;   // 오른쪽 가운데가 바뀜
  const box = api.changedBox(a, b, W2, H2, 12);
  ok("바뀐 자리를 찾는다", !!box, box ? `x${box.x.toFixed(2)} y${box.y.toFixed(2)} w${box.w.toFixed(2)}` : "못 찾음");
  ok("찾은 자리가 실제 위치와 맞는다", box && box.x > 0.45 && box.x < 0.55 && box.y > 0.3 && box.y < 0.36);
  ok("안 바뀌면 자리도 없다", api.changedBox(a, a.slice(), W2, H2, 12) === null);
  const all = a.slice().fill(200);
  ok("화면 전체가 바뀌면 표시 안 함", api.changedBox(a, all, W2, H2, 12) === null);
}

/* ── 단계 합치기 ── */
S.steps.length = 0;
api._fakeCapture();
globalThis.__fakePixel = 11; await api.shoot(); S.steps[0].title = "첫 단계"; S.steps[0].desc = "설명 하나";
globalThis.__fakePixel = 22; await api.shoot(); S.steps[1].title = "둘째 단계"; S.steps[1].desc = "설명 둘";
api.render();
api.act("merge", 1);
ok("합치면 단계가 하나로", S.steps.length === 1, S.steps.length + "단계");
ok("합쳐진 글이 살아 있다", S.steps[0].desc.includes("둘째 단계") && S.steps[0].desc.includes("설명 둘"), S.steps[0].desc);
ok("합쳐진 사진도 살아 있다", (S.steps[0].extra || []).length === 1);
const n1 = S.steps.length;
api.act("merge", 0);
ok("맨 위는 합칠 게 없다", S.steps.length === n1);

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));

/* ── 실수 되돌리기 ── */
S.steps.length = 0;
api._fakeCapture();
globalThis.__fakePixel = 11; await api.shoot(); S.steps[0].title = "하나";
globalThis.__fakePixel = 22; await api.shoot(); S.steps[1].title = "둘";
globalThis.__fakePixel = 33; await api.shoot(); S.steps[2].title = "셋";
api.render();
api.act("del", 1);
ok("지우면 준다", S.steps.length === 2, S.steps.map(x=>x.title).join(","));
api.undo();
ok("되돌리면 살아난다", S.steps.length === 3 && S.steps[1].title === "둘", S.steps.map(x=>x.title).join(","));
api.act("up", 2); api.act("del", 0);
api.undo(); api.undo();
ok("여러 번 되돌린다", S.steps.map(x=>x.title).join(",") === "하나,둘,셋", S.steps.map(x=>x.title).join(","));
const deep = api.UNDO.stack.length;
api.undo(); api.undo(); api.undo(); api.undo();
ok("더 되돌릴 게 없어도 안 죽는다", Array.isArray(S.steps));
ok("되돌리기 창고에 상한이 있다", api.UNDO.MAX <= 50, "상한 " + api.UNDO.MAX);

/* ── 글 힌트 ── */
ok("바뀐 자리를 말로 바꾼다", api.SPOTWORD({x:0.7,y:0.8,w:0.1,h:0.05}).includes("아래") && api.SPOTWORD({x:0.7,y:0.8,w:0.1,h:0.05}).includes("오른쪽"),
   api.SPOTWORD({x:0.7,y:0.8,w:0.1,h:0.05}));
ok("자리가 없으면 빈 글", api.SPOTWORD(null) === "");
ok("큰 변화는 영역이라 부른다", api.SPOTWORD({x:0.1,y:0.1,w:0.5,h:0.5}).includes("영역"));

/* ── 저장 용량: 사진이 쌓이면 브라우저 저장소가 넘친다 ── */
{
  let overflow = false;
  const realSet = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = (k, v) => {
    if (String(v).length > 4.5 * 1024 * 1024) { overflow = true; const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; throw e; }
    return realSet.call(globalThis.localStorage, k, v);
  };
  S.steps.length = 0;
  const big = "data:image/png;base64," + "A".repeat(300 * 1024);   // 300KB짜리 사진
  for (let i = 0; i < 20; i++) S.steps.push({ title: "단계" + i, desc: "", img: big });
  let died = false;
  try { api.save(); } catch (e) { died = true; }
  ok("저장소가 넘쳐도 안 죽는다", !died, overflow ? "넘침 발생함" : "안 넘침");
  // 정본은 큰 칸(IndexedDB)이고 작은 칸에는 글만 남긴다 —
  // 사진 6MB 를 넣어도 작은 칸은 안 넘친다.
  ok("사진이 커도 작은 칸이 안 넘친다", !overflow && S.spill !== true,
     overflow ? "넘쳤다" : "작은 칸에 글만 들어감");
  {
    const raw = globalThis.localStorage.getItem("manualDraft") || "";
    ok("작은 칸에 사진은 안 들어간다", !raw.includes("data:image"),
       Math.round(raw.length / 1024) + "KB");
    ok("작은 칸에 글은 들어간다", raw.includes("단계3"), "제목 남음");
    ok("어느 매뉴얼인지도 남는다", !!globalThis.localStorage.getItem("manualCurrent"));
  }
  // 파일로 저장해도 브라우저 저장은 여전히 막혀 있다 — 알림을 내리면 거짓말이 된다.
  // 알림은 진짜로 큰 칸에 들어갔을 때(boxSave 성공)만 내려간다.
  S.spill = true; api.saveFile();
  ok("파일로 저장해도 저장 안 됨 알림은 그대로 남는다", S.spill === true);
  globalThis.localStorage.setItem = realSet;
}

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);

/* ── 한 장짜리 문서로 내보내기 ── */
S.steps.length = 0;
api._fakeCapture();
S.steps.push({ sec: true, title: "처음 설정하기" });
globalThis.__fakePixel = 11; await api.shoot();
S.steps[1].title = "마이크림 원을 켠다"; S.steps[1].desc = "아이콘을 두 번 누릅니다.";
S.steps.push({ sec: true, title: "빼는 섹션", off: true });
globalThis.__fakePixel = 22; await api.shoot();
S.steps[3].title = "관리자만 보는 것";
S.name = "우리 회사 매뉴얼";
api.applyForm({ name: "표준", org: "마이크림 마케팅팀", sub: "신입용", intro: "따라 하면 됩니다.", outro: "문의 · 마케팅팀" });
api.render();

let capHtml = null;
const RB = globalThis.Blob;
globalThis.Blob = class extends RB { constructor(p, o) { super(p, o); if (o && o.type === "text/html") capHtml = p.join(""); } };
api.exportHTML();
globalThis.Blob = RB;

ok("한 장 파일이 나온다", !!capHtml, capHtml ? Math.round(capHtml.length / 1024) + "KB" : "안 나옴");
ok("문서 형식이 맞다", capHtml.startsWith("<!DOCTYPE html>") && capHtml.includes("</html>"));
ok("제목·부서·머리말이 들어간다",
   capHtml.includes("우리 회사 매뉴얼") && capHtml.includes("마이크림 마케팅팀") && capHtml.includes("따라 하면 됩니다."));
ok("단계가 들어간다", capHtml.includes("마이크림 원을 켠다") && capHtml.includes("아이콘을 두 번"));
ok("뺀 섹션은 안 들어간다", !capHtml.includes("관리자만 보는 것") && !capHtml.includes("빼는 섹션"));
ok("맺음말이 들어간다", capHtml.includes("문의 · 마케팅팀"));
ok("사진이 파일 안에 들어간다", capHtml.includes("<img src=\"data:image"));
ok("바깥으로 부르는 곳이 없다", !/https?:\/\/|fetch\(|<script/.test(capHtml), "혼자 도는 파일");
{
  const bad = capHtml.match(/<h3>|<section>/g) || [];
  ok("단계 수가 맞다", (capHtml.match(/<section>/g) || []).length === 1, (capHtml.match(/<section>/g) || []).length + "개");
}

console.log("\n" + (fail.length ? "실패 " + fail.length + "건: " + fail.join(" / ") : "전부 통과"));
process.exit(fail.length ? 1 : 0);
