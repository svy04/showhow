(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const cv = document.createElement("canvas"); cv.width = 900; cv.height = 560;
  cv.getContext("2d").fillRect(0, 0, 900, 560);
  const img = cv.toDataURL("image/png");
  const 원제목 = document.title;

  // ── 제목이 빈 단계를 알려 주는가 ──
  docInto({ id: null, name: "흐름 시험", steps: [
    { sec: true, title: "묶음" },
    { title: "제목 있는 단계", desc: "", img },
    { title: "", desc: "", img, auto: true },
    { title: "", desc: "", img, auto: true },
  ] });
  await wait(250);

  const 안내 = $("#counthint").textContent;
  ok("몇 단계인지 보여 준다", /3단계/.test(안내), 안내.trim());
  ok("제목이 빈 단계 수를 알려 준다", /제목 없는 단계 2/.test(안내), 안내.trim());
  ok("누를 수 있는 자리다", !!$("#gonext"));

  // 눌러서 첫 빈칸으로 간다
  $("#gonext").click();
  await wait(500);
  const 초점 = document.activeElement;
  ok("누르면 첫 빈칸에 손이 간다",
     초점 && 초점.classList.contains("stitle") && !초점.textContent.trim(),
     초점 ? (초점.className + " · \"" + 초점.textContent + "\"") : "없음");

  // 채우면 알림이 줄어든다
  state.steps[2].title = "채운 제목";
  render();
  await wait(150);
  ok("채우면 남은 수가 줄어든다", /제목 없는 단계 1/.test($("#counthint").textContent),
     $("#counthint").textContent.trim());
  state.steps[3].title = "또 채움";
  render();
  await wait(150);
  ok("다 채우면 알림이 사라진다", !$("#gonext"), $("#counthint").textContent.trim());

  // ── 탭 제목이 담긴 개수를 알리는가 ──
  ok("찍기 전에는 원래 제목", document.title === 원제목, document.title);

  const cvs = document.createElement("canvas");
  cvs.width = 640; cvs.height = 400;
  cvs.getContext("2d").fillRect(0, 0, 640, 400);
  const 가짜 = cvs.captureStream(10);
  const real = navigator.mediaDevices.getDisplayMedia;
  navigator.mediaDevices.getDisplayMedia = async () => 가짜;
  $("#shoot").click();
  await wait(900);
  ok("찍는 중에는 탭 제목이 개수를 알린다", /3장/.test(document.title) && /담는 중|찍기/.test(document.title),
     document.title);

  $("#pausebtn2").click();
  await wait(200);
  ok("잠시 멈추면 탭 제목도 그렇게 말한다", /잠시 멈춤/.test(document.title), document.title);
  $("#pausebtn2").click();
  await wait(200);

  가짜.getVideoTracks()[0].stop();
  가짜.getVideoTracks()[0].dispatchEvent(new Event("ended"));
  await wait(400);
  ok("끝나면 원래 제목으로 돌아온다", document.title === 원제목, document.title);
  navigator.mediaDevices.getDisplayMedia = real;

  // ── 좁은 화면에서도 글이 읽히는가 ──
  const 재보기 = () => ({
    가로밀림: document.documentElement.scrollWidth - window.innerWidth,
    글폭: Math.round(document.querySelector("#steps").getBoundingClientRect().width),
    본문: parseFloat(getComputedStyle(document.querySelector(".sdesc")).fontSize),
  });
  const 원폭 = window.innerWidth;
  for (const w of [1100, 880, 560]) {
    // 창 크기를 못 바꾸므로, 같은 조건을 만드는 규칙이 있는지 본다
    // 그 숫자가 적혀 있는지가 아니라, 그 폭에서 **실제로 걸리는** 규칙이 있는지 본다.
    const 규칙 = [...document.styleSheets].flatMap(sh => { try { return [...sh.cssRules]; } catch (e) { return []; } })
      .filter(r => {
        const m = r.conditionText && r.conditionText.match(/max-width:\s*(\d+)px/);
        return m && Number(m[1]) >= w;
      });
    ok("가로 " + w + "px 에서 걸리는 규칙이 있다", 규칙.length > 0,
       규칙.length + "건 " + 규칙.slice(0, 3).map(r => r.conditionText).join(" · "));
  }
  const 지금 = 재보기();
  ok("가로로 밀리지 않는다", 지금.가로밀림 <= 1, 지금.가로밀림 + "px");
  ok("글 폭이 창을 넘지 않는다", 지금.글폭 <= 원폭, 지금.글폭 + " / " + 원폭);

  return out.join("\n");
})()
