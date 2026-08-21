(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const cv = document.createElement("canvas"); cv.width = 600; cv.height = 380;
  const g = cv.getContext("2d");
  const px = c => { g.fillStyle = c; g.fillRect(0, 0, 600, 380); return cv.toDataURL("image/png"); };
  const titles = () => state.steps.map(s => (s.sec ? "[" + s.title + "]" : s.title)).join(",");

  docInto({ id: null, name: "손질 시험", steps: [
    { sec: true, title: "묶음" },
    { title: "하나", desc: "첫째", img: px("#456") },
    { title: "둘",   desc: "둘째", img: px("#654") },
    { title: "셋",   desc: "셋째", img: px("#465") },
    { title: "넷",   desc: "넷째", img: px("#564") },
  ] });
  await wait(200);

  // ① 끌기 손잡이가 보이는가
  const nums = [...document.querySelectorAll("#steps .num")];
  ok("번호가 끌 수 있는 손잡이다", nums.length === 4 && nums.every(n => n.draggable),
     nums.length + "개 · " + (nums[0] ? nums[0].title.slice(0, 14) : ""));
  ok("섹션 머리도 끌 수 있다", !!document.querySelector("#steps .sec[draggable]"));

  // ② 끌어서 옮기기 — 진짜 끌기 사건을 만든다
  const dt = new DataTransfer();
  const fire = (el, type, y) => {
    const r = el.getBoundingClientRect();
    const ev = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt,
      clientX: r.left + 10, clientY: y === undefined ? r.top + r.height / 2 : y });
    el.dispatchEvent(ev);
  };
  const stepEls = () => [...document.querySelectorAll("#steps .step")];
  let els = stepEls();
  fire(els[3].querySelector(".num"), "dragstart");
  const target = els[0];
  const tr = target.getBoundingClientRect();
  fire(target, "dragover", tr.top + 4);
  fire(target, "drop", tr.top + 4);
  await wait(150);
  ok("끌어서 맨 앞으로 옮긴다", titles() === "[묶음],넷,하나,둘,셋", titles());

  // ③ 아래쪽에 떨구면 그 뒤로 간다
  els = stepEls();
  fire(els[0].querySelector(".num"), "dragstart");
  const t2 = els[3];
  const r2 = t2.getBoundingClientRect();
  fire(t2, "dragover", r2.bottom - 4);
  fire(t2, "drop", r2.bottom - 4);
  await wait(150);
  ok("아래쪽에 떨구면 그 뒤로 간다", titles() === "[묶음],하나,둘,셋,넷", titles());

  // ④ 되돌릴 수 있다
  undo();
  await wait(100);
  ok("옮긴 것도 되돌린다", titles() === "[묶음],넷,하나,둘,셋", titles());
  undo();
  await wait(100);
  ok("두 번 되돌리면 처음으로", titles() === "[묶음],하나,둘,셋,넷", titles());

  // ⑤ 맨 위·맨 아래
  act("top", 3);
  ok("맨 위로 보낸다", titles() === "셋,[묶음],하나,둘,넷", titles());
  act("bottom", 0);
  ok("맨 아래로 보낸다", titles() === "[묶음],하나,둘,넷,셋", titles());

  // ⑥ 번호를 두 번 누르면 맨 위로
  const n2 = [...document.querySelectorAll("#steps .num")][2];
  n2.ondblclick();
  await wait(100);
  ok("번호를 두 번 누르면 맨 위로", titles().startsWith("넷"), titles());

  // ⑦ 복제
  const before = state.steps.length;
  act("copy", 0);
  ok("복제하면 하나 늘어난다", state.steps.length === before + 1);
  ok("복사본이라고 표시된다", (state.steps[1].title || "").includes("복사본"), state.steps[1].title);
  ok("복사본에 사진도 따라온다", String(state.steps[1].img || "").startsWith("data:image"));
  state.steps[1].title = "고친 복사본";
  ok("복사본을 고쳐도 원본은 그대로다", state.steps[0].title === "넷", state.steps[0].title);
  undo();
  await wait(100);
  ok("복제도 되돌린다", state.steps.length === before, state.steps.length + "단계");

  // ⑧ 섹션 복제
  const secAt = state.steps.findIndex(s => s.sec);
  act("copy", secAt);
  ok("섹션도 복제된다", state.steps[secAt + 1] && state.steps[secAt + 1].sec === true);
  undo();

  return out.join("\n");
})()
