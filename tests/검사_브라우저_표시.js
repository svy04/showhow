(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 흰 바탕 사진 하나
  const cv = document.createElement("canvas"); cv.width = 800; cv.height = 500;
  const g = cv.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 800, 500);
  g.fillStyle = "#dddddd"; g.fillRect(40, 40, 720, 60);
  const img = cv.toDataURL("image/png");

  docInto({ id: null, name: "표시 시험", steps: [{ title: "한 단계", desc: "", img }] });
  await wait(200);

  openMark(0);
  await wait(400);
  ok("표시 화면이 열린다", $("#mark").classList.contains("on"));
  ok("도구가 다 있다",
     ["box", "arrow", "badge", "blur", "text", "crop", "erase"]
       .every(t => document.querySelector('[data-tool="' + t + '"]')),
     [...document.querySelectorAll("[data-tool]")].map(b => b.dataset.tool).join(","));
  ok("색을 고를 수 있다", document.querySelectorAll("#markcolors button").length === 5,
     [...document.querySelectorAll("#markcolors button")].map(b => b.dataset.color).join(" "));
  ok("굵기를 바꿀 수 있다", $("#mark-thin").textContent.includes("보통"), $("#mark-thin").textContent);

  // 색·굵기 바꾸기
  document.querySelector('#markcolors button[data-color="#3b82f6"]').click();
  ok("고른 색이 표시된다",
     document.querySelector('#markcolors button[data-color="#3b82f6"]').getAttribute("aria-pressed") === "true");
  $("#mark-thin").click();
  ok("굵기가 바뀐다", $("#mark-thin").textContent.includes("굵게"), $("#mark-thin").textContent);

  // 상자 하나 그리기 — 진짜 끌기
  const cvs = $("#markcv");
  const rect = cvs.getBoundingClientRect();
  const at = (fx, fy) => ({ clientX: rect.left + rect.width * fx, clientY: rect.top + rect.height * fy });
  const drag = (x0, y0, x1, y1) => {
    cvs.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...at(x0, y0) }));
    cvs.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, ...at(x1, y1) }));
    cvs.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...at(x1, y1) }));
  };
  setTool("box");
  drag(0.1, 0.1, 0.4, 0.35);
  await wait(120);
  ok("상자가 그려진다", MK.marks.length === 1 && MK.marks[0].t === "box", MK.marks.length + "개");
  ok("고른 색이 표시에 붙는다", MK.marks[0].c === "#3b82f6", MK.marks[0].c);
  ok("고른 굵기가 표시에 붙는다", MK.marks[0].k === 1.7, String(MK.marks[0].k));

  // 화살표
  setTool("arrow");
  drag(0.5, 0.5, 0.8, 0.7);
  await wait(120);
  ok("화살표가 그려진다", MK.marks.length === 2 && MK.marks[1].t === "arrow");

  // 글자
  const realPrompt = window.prompt;
  window.prompt = () => "여기를 누르세요";
  setTool("text");
  cvs.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...at(0.2, 0.7) }));
  cvs.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...at(0.2, 0.7) }));
  await wait(120);
  const t = MK.marks.find(m => m.t === "text");
  ok("글자가 들어간다", !!t && t.s === "여기를 누르세요", t ? t.s : "없음");

  window.prompt = () => "";
  cvs.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...at(0.6, 0.2) }));
  cvs.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...at(0.6, 0.2) }));
  await wait(100);
  ok("빈 글자는 안 들어간다", MK.marks.filter(m => m.t === "text").length === 1);
  window.prompt = realPrompt;

  // 번호
  setTool("badge");
  cvs.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...at(0.85, 0.15) }));
  cvs.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...at(0.85, 0.15) }));
  await wait(100);
  ok("번호가 붙는다", MK.marks.some(m => m.t === "badge"), MK.marks.length + "개");

  // 지우개 — 화살표 위를 누른다
  const before = MK.marks.length;
  setTool("erase");
  cvs.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...at(0.65, 0.6) }));
  cvs.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...at(0.65, 0.6) }));
  await wait(120);
  ok("표시를 하나만 지운다", MK.marks.length === before - 1 && !MK.marks.some(m => m.t === "arrow"),
     before + "개 → " + MK.marks.length + "개");

  // 빈 곳을 누르면 아무것도 안 지운다
  const keep = MK.marks.length;
  cvs.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...at(0.95, 0.95) }));
  cvs.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...at(0.95, 0.95) }));
  await wait(120);
  ok("빈 곳을 누르면 안 지운다", MK.marks.length === keep, $("#status").textContent.trim().slice(0, 30));

  // 그림이 실제로 바뀌었는가 (흰 바탕에 색이 생겼는가)
  const chk = document.createElement("canvas");
  chk.width = cvs.width; chk.height = cvs.height;
  chk.getContext("2d").drawImage(cvs, 0, 0);
  const d = chk.getContext("2d").getImageData(0, 0, chk.width, chk.height).data;
  let colored = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i] - d[i + 1]) > 30 || Math.abs(d[i + 1] - d[i + 2]) > 30) colored++;
  }
  ok("사진 위에 실제로 그려졌다", colored > 500, colored + "픽셀에 색이 들어감");

  // 저장하면 단계 사진에 박힌다
  const orig = state.steps[0].img;
  $("#mark-done").click();
  await wait(500);
  ok("표시가 사진에 저장된다", state.steps[0].img !== orig && String(state.steps[0].img).startsWith("data:image"));
  ok("원본은 따로 남는다", String(state.steps[0].orig || "").startsWith("data:image"));
  ok("표시 목록도 함께 남는다", (state.steps[0].marks || []).length === MK.marks.length,
     (state.steps[0].marks || []).length + "개");

  // 다시 열면 그대로 있다
  openMark(0);
  await wait(400);
  ok("다시 열면 표시가 그대로다", MK.marks.length === (state.steps[0].marks || []).length,
     MK.marks.length + "개");
  $("#mark-done").click();
  await wait(300);

  return out.join("\n");
})()
