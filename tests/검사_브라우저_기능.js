(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // 속성만 읽으면 CSS 가 이겨서 화면에 그대로 보이는 것을 못 잡는다. 진짜 크기를 잰다.
  const 보이나 = sel => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };
  const cv = document.createElement("canvas"); cv.width = 600; cv.height = 380;
  const g = cv.getContext("2d");
  const px = c => { g.fillStyle = c; g.fillRect(0, 0, 600, 380); return cv.toDataURL("image/png"); };

  docInto({ id: null, name: "기능 시험", steps: [
    { sec: true, title: "처음 설정" },
    { title: "청구 목록을 연다", desc: "왼쪽 메뉴에서 청구를 고릅니다.", img: px("#456") },
    { title: "이름을 넣는다", desc: "칸에 회사 이름을 씁니다.", img: px("#654") },
    { title: "보내기를 누른다", desc: "확인하고 보냅니다.", img: px("#465") },
  ] });
  await wait(250);

  // ── 찾기 ──
  ok("찾기 칸이 있다", !!$("#find"));
  ok("찾기 줄은 열기 전에는 안 보인다", !보이나("#findbar"));
  $("#btn-find").click();
  await wait(150);
  ok("찾기 단추를 누르면 찾기 줄이 보인다", 보이나("#findbar"));
  $("#find").value = "이름";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  const 보임 = [...document.querySelectorAll("#steps .step")].filter(e => !e.classList.contains("away"));
  ok("찾으면 그것만 남는다", 보임.length === 1 && 보임[0].textContent.includes("이름을 넣는다"),
     보임.length + "개 남음");
  ok("몇 개인지 알려 준다", $("#findn").textContent === "1개", $("#findn").textContent);

  $("#find").value = "없는말";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  ok("없으면 없다고 한다", $("#findn").textContent === "없음", $("#findn").textContent);

  $("#find").value = "";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  ok("비우면 전부 돌아온다",
     [...document.querySelectorAll("#steps .step")].every(e => !e.classList.contains("away")));

  // 설명에서도 찾는다
  $("#find").value = "왼쪽 메뉴";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  ok("설명에서도 찾는다", $("#findn").textContent === "1개", $("#findn").textContent);
  $("#find").value = ""; $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);

  // ── 다시 실행 ──
  const 제목들 = () => state.steps.map(s => s.title || "[" + (s.sec ? "섹션" : "") + "]").join(",");
  const 처음 = 제목들();
  act("del", 2);
  const 지운뒤 = 제목들();
  undo();
  ok("되돌리면 돌아온다", 제목들() === 처음, 제목들());
  redo();
  ok("다시 실행하면 또 지워진다", 제목들() === 지운뒤, 제목들());
  undo();
  await wait(100);

  // ── 사진 바꾸기 단추 ──
  ok("사진 바꾸기 단추가 있다", !!document.querySelector('[data-act="swap"]'));

  // 사진 넣기 — 파일 고르기를 대신한다
  const 만든그림 = px("#0a0");
  const bin = atob(만든그림.split(",")[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const 파일 = new File([arr], "그림.png", { type: "image/png" });

  const 전 = state.steps.length;
  IMG.mode = "add"; IMG.at = 1;
  사진넣기(파일);
  await wait(400);
  ok("파일에서 사진을 넣는다", state.steps.length === 전 + 1, state.steps.length + "단계");
  ok("넣은 자리가 맞다", String(state.steps[2].img || "").startsWith("data:image"), "2번 뒤에 들어감");
  ok("넣은 것도 되돌린다", (undo(), state.steps.length === 전), state.steps.length + "단계");

  const 옛사진 = state.steps[1].img;
  IMG.mode = "swap"; IMG.at = 1;
  사진넣기(파일);
  await wait(400);
  ok("사진을 갈아 끼운다", state.steps[1].img !== 옛사진 && String(state.steps[1].img).startsWith("data:image"));
  ok("바꾼 것도 되돌린다", (undo(), state.steps[1].img === 옛사진));

  // ── 지름길 도움말 ──
  ok("도움말 화면이 있다", !!$("#help"));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
  await wait(150);
  ok("? 를 누르면 열린다", $("#help").classList.contains("on"));
  ok("지름길이 적혀 있다", $("#help").textContent.includes("Ctrl + Shift + Z") && $("#help").textContent.includes("Space"));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(150);
  ok("Esc 로 닫힌다", !$("#help").classList.contains("on"));

  // ── 여러 개 한꺼번에 고르기 ──
  docInto({ id: null, name: "고르기 시험", steps: [
    { sec: true, title: "묶음" },
    { title: "하나", desc: "", img: px("#123") },
    { title: "둘", desc: "", img: px("#234") },
    { title: "셋", desc: "", img: px("#345") },
    { title: "넷", desc: "", img: px("#456") },
  ] });
  await wait(250);
  const 번호 = () => [...document.querySelectorAll("#steps .num")];
  번호()[0].onclick({ stopPropagation() {}, shiftKey: false });
  await wait(100);
  ok("번호를 누르면 골라진다", $("#bulk").classList.contains("on") && $("#bulkn").textContent === "1단계 고름",
     $("#bulkn").textContent);
  번호()[2].onclick({ stopPropagation() {}, shiftKey: true });
  await wait(100);
  ok("Shift 로 사이가 통째로 골라진다", $("#bulkn").textContent === "3단계 고름", $("#bulkn").textContent);
  // 섹션 머리는 번호 동그라미가 없다 — 이름을 Shift 로 눌러야 골라진다
  document.querySelector("#steps .sec .sectitle").dispatchEvent(
    new MouseEvent("click", { bubbles: true, shiftKey: true }));
  await wait(100);
  ok("섹션은 이름을 Shift 로 눌러 고른다", /섹션/.test($("#bulkn").textContent), $("#bulkn").textContent);
  고르기해제();
  번호()[0].onclick({ stopPropagation() {}, shiftKey: false });
  번호()[2].onclick({ stopPropagation() {}, shiftKey: true });
  await wait(100);
  ok("고른 것이 눈에 보인다", document.querySelectorAll("#steps .picked").length === 3,
     document.querySelectorAll("#steps .picked").length + "개 표시");

  const 전개수 = state.steps.length;
  $("#bulk").querySelector('[data-bulk="del"]').click();
  await wait(200);
  ok("고른 것을 한꺼번에 지운다", state.steps.length === 전개수 - 3, state.steps.length + "단계");
  ok("지운 뒤 고르기가 풀린다", !$("#bulk").classList.contains("on"));
  undo();
  await wait(150);
  ok("한꺼번에 지운 것도 되돌린다", state.steps.length === 전개수, state.steps.length + "단계");

  번호()[1].onclick({ stopPropagation() {}, shiftKey: false });
  번호()[2].onclick({ stopPropagation() {}, shiftKey: true });
  await wait(100);
  $("#bulk").querySelector('[data-bulk="sec"]').click();
  await wait(200);
  ok("고른 것 앞에 섹션을 만든다", state.steps.filter(s => s.sec).length === 2,
     state.steps.filter(s => s.sec).length + "섹션");
  undo();
  await wait(150);

  번호()[0].onclick({ stopPropagation() {}, shiftKey: false });
  await wait(100);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(150);
  ok("Esc 로 고르기가 풀린다", !$("#bulk").classList.contains("on"));

  // ── 저장 표시 ──
  await boxSave();
  await wait(150);
  ok("저장된 때를 보여 준다", /저장/.test($("#savedat").textContent), $("#savedat").textContent);

  // ── 작은 칸에 사진이 안 들어간다 ──
  save();
  await wait(100);
  const 작은칸 = localStorage.getItem("manualDraft") || "";
  ok("작은 칸에는 글만 넣는다", !작은칸.includes("data:image"),
     Math.round(작은칸.length / 1024) + "KB");
  const 이문서 = (await boxAll()).find(d => d.id === state.id);
  ok("지금 보던 매뉴얼의 사진이 큰 칸에 있다",
     !!이문서 && (이문서.steps || []).some(s => s.img),
     이문서 ? (이문서.steps || []).length + "단계" : "큰 칸에 없음");

  // ── 내보낸 파일 이름에 날짜 ──
  const d0 = new Date(), z0 = n => String(n).padStart(2, "0");
  const 오늘 = d0.getFullYear() + "-" + z0(d0.getMonth() + 1) + "-" + z0(d0.getDate());
  $("#docname").value = "청구 넣기"; save();
  ok("내보낸 파일에 날짜가 붙는다", 파일이름(".pptx") === "청구 넣기_" + 오늘 + ".pptx", 파일이름(".pptx"));
  $("#docname").value = 'a/b:c*d?e"f<g>h|i'; save();
  ok("파일 이름에 못 쓰는 글자를 뺀다", !/[/:*?"<>|]/.test(파일이름(".html")), 파일이름(".html"));
  $("#docname").value = "  "; save();
  ok("이름이 비어도 파일은 나온다", 파일이름(".html").startsWith("매뉴얼_"), 파일이름(".html"));
  $("#docname").value = "먼저 보기 시험"; save();

  // ── 내보내기 전 먼저 보기 ──
  ok("먼저 보기 단추가 있다", !!document.querySelector('[data-out="peek"]'));
  const 문서 = htmlDoc();
  ok("먼저 볼 문서가 만들어진다", 문서.startsWith("<!DOCTYPE html") && 문서.includes("먼저 보기 시험"),
     문서.slice(0, 40));
  const 넣을것 = state.steps.filter(x => !x.sec);
  ok("먼저 볼 문서에 제목·설명·사진이 다 들어 있다",
     넣을것.every(x => (!x.title || 문서.includes(x.title)) && (!x.desc || 문서.includes(x.desc))) &&
     (문서.match(/<img /g) || []).length === 넣을것.filter(x => x.img).length,
     (문서.match(/<img /g) || []).length + "장 / " + 넣을것.filter(x => x.img).length + "장");
  let 연주소 = "";
  const 옛열기 = window.open;
  window.open = u => { 연주소 = u; return { focus() {} }; };
  미리보기();
  window.open = 옛열기;
  ok("먼저 보기가 새 탭을 연다", 연주소.startsWith("blob:"), 연주소.slice(0, 12));

  // ── 자동 백업 ──
  const 뜬것 = await 백업("시험");
  ok("예전 판을 한 벌 떠 둔다", 뜬것 === true);
  const 전부 = await boxRaw();
  const 예전 = 전부.filter(x => x.bak && x.of === state.id);
  ok("예전 판이 큰 칸에 있다", 예전.length >= 1, 예전.length + "벌");
  ok("예전 판은 매뉴얼 목록에 안 섞인다", (await boxAll()).every(x => !x.bak));

  const 되돌릴것 = JSON.parse(JSON.stringify(state.steps));
  state.steps = state.steps.slice(0, 1); render(); save();
  await 예전판으로(예전[0].id);
  await wait(200);
  ok("예전 판으로 되돌린다", state.steps.length === 되돌릴것.length,
     state.steps.length + " / " + 되돌릴것.length + "단계");
  ok("되돌린 것도 Ctrl+Z 로 취소된다", (undo(), state.steps.length === 1), state.steps.length + "단계");
  undo();

  await 예전판보기();
  ok("예전 판이 목록에 보인다", $("#baklist").textContent.includes("예전 판"),
     $("#baklist").textContent.slice(0, 30));
  ok("예전 판마다 되돌리기 단추가 있다", !!$("#baklist").querySelector('[data-bak="back"]'));

  // 여섯 벌째를 뜨면 가장 오래된 것이 빠진다
  for (let k = 0; k < 6; k++) await 백업("시험" + k);
  const 남은 = (await boxRaw()).filter(x => x.bak && x.of === state.id);
  ok("예전 판은 다섯 벌까지만 쌓인다", 남은.length >= 1 && 남은.length <= 5, 남은.length + "벌");

  // ── 찾아 바꾸기 ──
  docInto({ id: null, name: "바꾸기 시험", steps: [
    { title: "청구서를 연다", desc: "청구서 목록에서 고릅니다.", img: px("#123") },
    { title: "청구서를 보낸다", desc: "확인하고 보냅니다.", img: px("#234") },
  ] });
  await wait(250);
  $("#find").value = "청구서";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  ok("찾으면 바꾸기 칸이 나타난다", !$("#swap").hidden && !$("#swapgo").hidden);
  const 바뀐수 = 모두바꾸기("청구서", "인보이스");
  await wait(150);
  ok("찾은 말을 한 번에 바꾼다", 바뀐수 === 3, 바뀐수 + "군데");
  ok("제목도 설명도 바뀐다",
     state.steps[0].title === "인보이스를 연다" && state.steps[0].desc.includes("인보이스"),
     state.steps[0].title);
  ok("바꾼 것도 되돌린다", (undo(), state.steps[0].title === "청구서를 연다"), state.steps[0].title);
  ok("없는 말은 안 바꾼다", 모두바꾸기("없는말", "무엇") === 0);
  $("#find").value = ""; $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  ok("찾기를 비우면 바꾸기 칸도 숨는다", $("#swap").hidden);

  // ── 통째로 옮기기 ──
  ok("전부 파일로 담는 단추가 있다", !!$("#b-allout"));
  ok("파일에서 전부 가져오는 단추가 있다", !!$("#b-allin"));
  await boxSave();
  const 담긴것 = await boxAll();
  const 묶음 = JSON.stringify({ kind: "showhow-all", at: Date.now(),
    docs: [{ id: "밖에서온것", name: "다른 컴퓨터 매뉴얼", at: Date.now(),
             steps: [{ title: "가져온 단계", desc: "", img: px("#567") }], form: null },
           { id: 담긴것[0].id, name: "이름표가 겹치는 것", at: Date.now(),
             steps: [{ title: "겹침", desc: "" }], form: null }],
    forms: [{ name: "가져온 양식", org: "다른 회사" }] });
  const 옛양식수 = forms.length;
  await 전부가져오기(new File([묶음], "전부.manualbox.json", { type: "application/json" }));
  await wait(300);
  const 뒤 = await boxAll();
  ok("파일에서 매뉴얼을 가져온다", 뒤.some(d => d.id === "밖에서온것"), 뒤.length + "개");
  ok("이름표가 겹쳐도 있던 것을 안 덮는다",
     뒤.some(d => d.id === 담긴것[0].id && d.name === 담긴것[0].name) &&
     뒤.some(d => /가져온 것/.test(d.name || "")),
     뒤.map(d => d.name).join(" / ").slice(0, 60));
  ok("양식도 같이 온다", forms.length === 옛양식수 + 1 && forms.some(f => f.name === "가져온 양식"),
     forms.length + "개");
  await 전부가져오기(new File(["{}"], "엉뚱.json", { type: "application/json" }));
  await wait(200);
  ok("묶음 파일이 아니면 아무 것도 안 한다", (await boxAll()).length === 뒤.length,
     (await boxAll()).length + "개");

  // ── 파일을 창에 끌어다 놓기 ──
  docInto({ id: null, name: "끌어놓기 시험", steps: [
    { title: "하나", desc: "", img: px("#123") },
    { title: "둘", desc: "", img: px("#234") },
  ] });
  await wait(250);
  const 끌기 = (파일들, 대상) => {
    const dt = { types: ["Files"], files: 파일들, dropEffect: "" };
    const ev = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: dt });
    Object.defineProperty(ev, "target", { value: 대상 || document.body });
    window.dispatchEvent(ev);
  };
  ok("그림 파일인지 매뉴얼 파일인지 가린다",
     파일종류(파일) === "사진" &&
     파일종류(new File(["{}"], "일.manual.json", { type: "application/json" })) === "매뉴얼" &&
     파일종류(new File(["{}"], "전부.manualbox.json", { type: "application/json" })) === "묶음" &&
     파일종류(new File(["x"], "이상한.exe", { type: "" })) === "");

  const 끌기전 = state.steps.length;
  놓인파일(파일, document.querySelectorAll("#steps .step")[0]);
  await wait(400);
  ok("그림을 끌어다 놓으면 그 자리 뒤에 들어간다",
     state.steps.length === 끌기전 + 1 && String(state.steps[1].img || "").startsWith("data:image"),
     state.steps.length + "단계");
  undo(); await wait(150);

  놓인파일(파일, document.body);
  await wait(400);
  ok("빈 곳에 놓으면 맨 뒤에 붙는다", state.steps.length === 끌기전 + 1, state.steps.length + "단계");
  undo(); await wait(150);

  document.body.classList.remove("dropping");
  const over = new Event("dragover", { bubbles: true, cancelable: true });
  Object.defineProperty(over, "dataTransfer", { value: { types: ["Files"], dropEffect: "" } });
  window.dispatchEvent(over);
  ok("파일이 들어오면 받는다고 알린다", document.body.classList.contains("dropping"));
  끌기([], document.body);
  await wait(100);
  ok("놓고 나면 알림이 사라진다", !document.body.classList.contains("dropping"));

  // ── 지름길 목록이 실제와 맞는가 ──
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
  await wait(150);
  const 도움 = $("#help").textContent;
  ok("지름길 목록에 새로 생긴 것도 적혀 있다",
     도움.includes("Shift") && 도움.includes("끌어다 놓아도") && 도움.includes("예전 판"));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(120);

  // ── 다시 그려도 찾은 상태·고른 상태가 남는가 ──
  docInto({ id: null, name: "다시 그리기 시험", steps: [
    { title: "청구 하나", desc: "", img: px("#123") },
    { title: "청구 둘", desc: "", img: px("#234") },
    { title: "다른 것", desc: "", img: px("#345") },
  ] });
  await wait(250);
  찾기줄(true);
  $("#find").value = "청구";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);
  render();
  await wait(150);
  const 남은수 = () => [...document.querySelectorAll("#steps .step")].filter(e => !e.classList.contains("away")).length;
  ok("다시 그려도 찾은 것만 남아 있다", 남은수() === 2, 남은수() + "개");
  $("#find").value = ""; $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(150);

  번호()[0].onclick({ stopPropagation() {}, shiftKey: false });
  await wait(100);
  render();
  await wait(150);
  ok("다시 그려도 고른 것이 남아 있다", document.querySelectorAll("#steps .picked").length === 1,
     document.querySelectorAll("#steps .picked").length + "개");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(120);

  // ── 찾을 것이 없으면 찾기 칸도 없다 ──
  docInto({ id: null, name: "빈 시험", steps: [] });
  await wait(200);
  ok("빈 화면에는 찾기 단추가 화면에서 사라진다", !보이나("#findwrap"), "hidden=" + $("#findwrap").hidden);
  docInto({ id: null, name: "한 단계", steps: [{ title: "혼자", desc: "", img: px("#456") }] });
  await wait(200);
  ok("한 단계뿐이면 찾기 단추도 안 보인다", !보이나("#findwrap"));
  docInto({ id: null, name: "두 단계", steps: [
    { title: "하나", desc: "", img: px("#123") }, { title: "둘", desc: "", img: px("#234") }] });
  await wait(200);
  ok("두 단계부터 찾기 단추가 나온다", 보이나("#findwrap"));

  return out.join("\n");
})()
