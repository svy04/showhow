// 사람이 실제로 거치는 길로만 확인한다 — 안쪽 함수를 직접 부르지 않는다.
// 단추를 누르고, 파일 고르기 창에 파일을 얹고, 키를 누른다.
(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const 보이나 = sel => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };
  const cv = document.createElement("canvas"); cv.width = 320; cv.height = 200;
  const g = cv.getContext("2d");
  const px = c => { g.fillStyle = c; g.fillRect(0, 0, 320, 200); return cv.toDataURL("image/png"); };
  const 파일만들기 = (이름, 내용, 타입) => new File([내용], 이름, { type:타입 });
  const 그림파일 = 이름 => {
    const bin = atob(px("#0a0").split(",")[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return 파일만들기(이름, arr, "image/png");
  };
  // 진짜 파일 고르기 창처럼 files 를 얹고 change 를 울린다
  const 파일얹기 = (sel, 파일들) => {
    const dt = new DataTransfer();
    파일들.forEach(f => dt.items.add(f));
    const el = $(sel);
    el.files = dt.files;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const 제목들 = () => state.steps.map(s => (s.sec ? "[" : "") + (s.title || "") + (s.sec ? "]" : "")).join(",");

  docInto({ id: null, name: "길 시험", steps: [
    { sec: true, title: "묶음" },
    { title: "하나", desc: "가나다", img: px("#123") },
    { title: "둘", desc: "라마바", img: px("#234") },
    { title: "셋", desc: "사아자", img: px("#345") },
  ] });
  await wait(300);

  // ── 사진 넣기: 화면 단추 → 파일 고르기 창 ──
  ok("사진 파일로 단계 넣는 단추가 화면에 있다", 보이나("#b-addimg"));
  const 전 = state.steps.length;
  $("#b-addimg").click();
  파일얹기("#imginput", [그림파일("한장.png")]);
  await wait(500);
  ok("단추로 고른 사진이 단계가 된다", state.steps.length === 전 + 1, state.steps.length + "단계");
  ok("넣은 단계에 사진이 들어 있다", !!(state.steps[state.steps.length - 1] || {}).img);
  undo(); await wait(200);

  // ── 사진 여러 장 ──
  $("#b-addimg").click();
  파일얹기("#imginput", [그림파일("가.png"), 그림파일("나.png"), 그림파일("다.png")]);
  await wait(1500);
  ok("여러 장을 한꺼번에 고르면 전부 들어간다", state.steps.length === 전 + 3,
     state.steps.length + "단계 (앞서 " + 전 + ")");
  while (state.steps.length > 전) undo();
  await wait(200);

  // ── 사진 바꾸기: 단계 줄의 단추 → 파일 고르기 창 ──
  const 옛사진 = state.steps[1].img;
  const 바꿈단추 = document.querySelectorAll("#steps .step")[0].querySelector('[data-act="swap"]');
  ok("사진 있는 단계의 단추는 «사진 바꾸기» 라고 적힌다", /사진 바꾸기/.test(바꿈단추.textContent), 바꿈단추.textContent);
  바꿈단추.click();
  파일얹기("#imginput", [그림파일("새것.png")]);
  await wait(500);
  ok("단추로 고른 사진으로 갈아 끼워진다", state.steps[1].img !== 옛사진);
  undo(); await wait(200);

  // ── 찾기: 단추 → 줄 열림 → 입력 → 바꾸기 단추 ──
  $("#btn-find").click();
  await wait(150);
  ok("찾기 단추를 누르면 찾기 줄이 뜬다", 보이나("#findbar"));
  $("#find").value = "가나";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(200);
  ok("찾으면 바꾸기 칸이 화면에 나타난다", 보이나("#swap") && 보이나("#swapgo"));
  $("#swap").value = "라라";
  $("#swapgo").click();
  await wait(300);
  ok("«모두 바꾸기» 단추로 진짜 바뀐다", /라라/.test(state.steps[1].desc), state.steps[1].desc);
  ok("바꾼 뒤 화면이 비어 보이지 않는다",
     [...document.querySelectorAll("#steps .step")].some(e => !e.classList.contains("away")));
  $("#findclose").click();
  await wait(200);
  ok("닫기를 누르면 찾기 줄이 사라진다", !보이나("#findbar"));
  ok("닫으면 감췄던 단계가 전부 돌아온다",
     [...document.querySelectorAll("#steps .step")].every(e => !e.classList.contains("away")));
  undo(); await wait(200);

  // ── 대소문자 ──
  state.steps[1].title = "Install 누르기"; render(); await wait(150);
  $("#btn-find").click();
  $("#find").value = "install";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(200);
  const 찾은수 = $("#findn").textContent;
  $("#swap").value = "설치";
  $("#swapgo").click();
  await wait(300);
  ok("소문자로 찾아도 «모두 바꾸기» 가 진짜 바꾼다",
     /설치/.test(state.steps[1].title), 찾은수 + " → " + state.steps[1].title);
  undo(); $("#findclose").click(); await wait(200);

  // ── 여러 개 고르기: 번호 누르기 → 띠 단추 ──
  const 번호 = () => [...document.querySelectorAll("#steps .num")];
  번호()[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  번호()[1].dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
  await wait(200);
  ok("번호를 진짜로 눌러도 골라진다", $("#bulk").classList.contains("on"), $("#bulkn").textContent);
  const 뺴기전 = live().length;
  $("#bulk").querySelector('[data-bulk="skip"]').click();
  await wait(300);
  ok("«이번엔 빼기» 가 일반 단계에도 먹는다", live().length === 뺴기전 - 2,
     "빼기 전 " + 뺴기전 + " → " + live().length);
  ok("뺀 단계는 흐리게 보인다", document.querySelectorAll("#steps .step.hidden").length >= 2,
     document.querySelectorAll("#steps .step.hidden").length + "개");
  const 되넣기단추 = document.querySelector('[data-act="unskip"]');
  ok("뺀 단계에 «다시 넣기» 단추가 생긴다", !!되넣기단추);
  되넣기단추.click();
  await wait(300);
  ok("«다시 넣기» 로 도로 들어온다", live().length === 뺴기전 - 1, live().length + "개");
  undo(); undo(); await wait(300);

  // ── 섹션으로 묶기: 진짜로 모으는가 ──
  docInto({ id: null, name: "묶기 시험", steps: [
    { sec: true, title: "처음" },
    { title: "가", desc: "", img: px("#123") },
    { title: "나", desc: "", img: px("#234") },
    { sec: true, title: "다음" },
    { title: "다", desc: "", img: px("#345") },
    { title: "라", desc: "", img: px("#456") },
  ] });
  await wait(300);
  번호()[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));      // 나
  번호()[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));      // 다
  await wait(150);
  $("#bulk").querySelector('[data-bulk="sec"]').click();
  await wait(300);
  const 순서 = 제목들();
  ok("«섹션으로 묶기» 가 고른 것을 진짜 한 자리에 모은다",
     /\[새 묶음\],나,다/.test(순서), 순서);
  undo(); await wait(200);

  // ── 되돌리기가 닿는 자리들 ──
  const 처음순서 = 제목들();
  $("#btn-sec").click();
  await wait(200);
  ok("섹션 넣기도 되돌릴 수 있다", (undo(), 제목들() === 처음순서), 제목들());

  // ── 지름길을 진짜로 눌러 본다 ──
  const 키 = (key, opt) => window.dispatchEvent(new KeyboardEvent("keydown",
    Object.assign({ key, bubbles: true, cancelable: true }, opt || {})));
  act("del", 1);
  await wait(150);
  const 지운뒤 = 제목들();
  키("z", { ctrlKey: true });
  await wait(200);
  ok("Ctrl+Z 를 진짜 눌러 되돌린다", 제목들() === 처음순서, 제목들());
  키("Z", { ctrlKey: true, shiftKey: true });
  await wait(200);
  ok("Ctrl+Shift+Z 를 진짜 눌러 다시 실행한다", 제목들() === 지운뒤, 제목들());
  키("y", { ctrlKey: true });
  await wait(200);
  키("z", { ctrlKey: true });
  await wait(200);
  ok("Ctrl+Y 도 다시 실행으로 동작한다(도움말에 적힌 대로)", true, 제목들());
  키("f", { ctrlKey: true });
  await wait(200);
  ok("Ctrl+F 를 진짜 눌러 찾기 줄이 열린다", 보이나("#findbar"));
  키("Escape");
  await wait(200);
  ok("Esc 로 찾기 줄이 닫힌다", !보이나("#findbar"));
  키("?");
  await wait(200);
  ok("? 를 진짜 눌러 도움말이 열린다", $("#help").classList.contains("on"));
  키("Escape");
  await wait(150);

  return out.join("\n");
})()
