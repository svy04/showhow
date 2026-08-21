(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 실제 화면 크기의 사진을 만든다 (1600×1000, 화면 캡처와 비슷한 무게)
  const cv = document.createElement("canvas");
  cv.width = 1600; cv.height = 1000;
  const g = cv.getContext("2d");
  const shot = i => {
    g.fillStyle = "#f3f4f6"; g.fillRect(0, 0, 1600, 1000);
    g.fillStyle = "#ffffff"; g.fillRect(60, 60, 1480, 140);
    g.fillStyle = "#22262a"; g.font = "40px sans-serif"; g.fillText("화면 " + i, 100, 145);
    for (let k = 0; k < 24; k++) {
      g.fillStyle = "hsl(" + ((i * 37 + k * 13) % 360) + ",30%,80%)";
      g.fillRect(80 + (k % 6) * 250, 260 + Math.floor(k / 6) * 170, 220, 140);
    }
    return cv.toDataURL("image/png");
  };

  const N = 60;
  const steps = [];
  for (let i = 1; i <= N; i++) {
    if (i % 12 === 1) steps.push({ sec: true, title: (Math.floor(i / 12) + 1) + "번째 묶음" });
    steps.push({ title: i + "번째 단계 — 버튼을 누른다", desc: "이 화면에서 오른쪽 위 버튼을 누릅니다.",
                 img: shot(i), auto: true, spot: { x: .6, y: .1, w: .2, h: .1 }, hint: "오른쪽 위 부분이 바뀌었습니다" });
  }
  const bytes = steps.reduce((a, s) => a + (s.img ? s.img.length : 0), 0);
  ok("실제 무게로 시험한다", bytes > 3e6, Math.round(bytes / 1048576 * 10) / 10 + "MB · " + N + "단계");

  // ① 그리기 속도
  let t = performance.now();
  docInto({ id: null, name: "큰 매뉴얼", steps });
  const drawMs = performance.now() - t;
  ok("60단계를 1초 안에 그린다", drawMs < 1000, Math.round(drawMs) + "ms");
  ok("빠짐없이 다 그려진다", document.querySelectorAll("#steps .step").length === N,
     document.querySelectorAll("#steps .step").length + "개");

  // ② 작은 저장칸이 넘쳐도 알려 주고 안 죽는다
  await wait(1800);                                  // 자동 보관이 도는 시간
  const spilled = document.querySelector("#spill").classList.contains("on");
  let kept = false;
  try { kept = !!localStorage.getItem("manualDraft"); } catch (e) {}
  // 둘 중 하나는 반드시 참이어야 한다: 저장이 됐거나, 안 됐다고 사람에게 알렸거나.
  ok("저장이 되든 못 되든 사람이 알 수 있다", kept || spilled,
     kept ? "작은 칸에 저장됨" : "넘침 알림 켜짐 — 파일로 저장하라고 안내");

  // ③ 큰 저장칸에는 통째로 들어간다
  t = performance.now();
  await boxSave();
  const saveMs = performance.now() - t;
  const all = await boxAll();
  const mine = all.find(d => d.name === "큰 매뉴얼");
  ok("큰 것도 통째로 보관된다", mine && mine.steps.length === steps.length,
     mine ? mine.steps.length + "단계 · " + Math.round(saveMs) + "ms" : "없음");

  // ④ 내보내기가 버틴다
  const got = [];
  const realCreate = URL.createObjectURL;
  URL.createObjectURL = b => { got.push(b); return "blob:fake"; };
  const realClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {};

  t = performance.now();
  await exportPPT();
  await wait(300);
  const pptMs = performance.now() - t;
  ok("60단계도 PPT로 나온다", got.length === 1 && got[0].size > 1e6,
     got[0] ? Math.round(got[0].size / 1048576 * 10) / 10 + "MB · " + Math.round(pptMs) + "ms" : "안 나옴");
  ok("PPT 만들기가 20초를 안 넘는다", pptMs < 20000, Math.round(pptMs / 1000) + "초");

  got.length = 0;
  t = performance.now();
  exportHTML();
  await wait(200);
  const htmlMs = performance.now() - t;
  ok("60단계도 한 장 문서로 나온다", got.length === 1 && got[0].size > 1e6,
     got[0] ? Math.round(got[0].size / 1048576 * 10) / 10 + "MB · " + Math.round(htmlMs) + "ms" : "안 나옴");

  URL.createObjectURL = realCreate;
  HTMLAnchorElement.prototype.click = realClick;

  // ⑤ 손질이 여전히 빠르다
  t = performance.now();
  act("up", 40);
  const moveMs = performance.now() - t;
  ok("60단계에서도 순서 바꾸기가 즉각이다", moveMs < 700, Math.round(moveMs) + "ms");

  t = performance.now();
  undo();
  ok("되돌리기도 즉각이다", performance.now() - t < 700, Math.round(performance.now() - t) + "ms");

  // ⑥ 화면이 무너지지 않는다
  const first = document.querySelector("#steps .step");
  ok("사진이 글 폭을 넘지 않는다",
     first.querySelector("img").getBoundingClientRect().width <= first.getBoundingClientRect().width + 1,
     Math.round(first.querySelector("img").getBoundingClientRect().width) + "px");
  ok("가로로 밀리지 않는다", document.documentElement.scrollWidth <= window.innerWidth + 1,
     document.documentElement.scrollWidth + " / " + window.innerWidth);

  return out.join("\n");
})()
