(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const status = () => $("#status").textContent.trim();
  const real = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
  const put = fn => { navigator.mediaDevices.getDisplayMedia = fn; };
  const boom = name => async () => { const e = new Error("막힘"); e.name = name; throw e; };

  // ① 사람이 화면 고르기를 취소했다
  put(boom("NotAllowedError"));
  $("#shoot").click();
  await wait(200);
  ok("취소하면 취소라고 말한다", status().includes("취소"), status());
  ok("취소해도 찍기가 켜지지 않는다", !WATCH.on);
  ok("취소해도 버튼은 그대로다", $("#shoot").textContent === "화면 찍기 시작", $("#shoot").textContent);
  ok("취소해도 안 죽는다", document.querySelectorAll("#steps .step").length === 0);

  // ② 공유할 화면이 없다
  put(boom("NotFoundError"));
  $("#shoot").click();
  await wait(200);
  ok("화면을 못 찾으면 그렇게 말한다", status().includes("찾지 못"), status());

  // ③ 알 수 없는 문제
  put(boom("WeirdError"));
  $("#shoot").click();
  await wait(200);
  ok("모르는 문제도 이유를 보여 준다", status().includes("열 수 없습니다"), status());

  // ④ 브라우저가 아예 못 하는 경우
  const keep = navigator.mediaDevices.getDisplayMedia;
  Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", { value: undefined, configurable: true, writable: true });
  $("#shoot").click();
  await wait(200);
  ok("못 하는 브라우저면 어디서 열지 알려 준다", /크롬|엣지/.test(status()), status());

  // ④-2 주소가 http라서 브라우저가 막은 경우
  const secure = Object.getOwnPropertyDescriptor(window, "isSecureContext") ||
                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), "isSecureContext");
  let swapped = false;
  try { Object.defineProperty(window, "isSecureContext", { value: false, configurable: true }); swapped = true; } catch (e) {}
  if (swapped) {
    $("#shoot").click();
    await wait(200);
    ok("http 주소면 파일로 열라고 알려 준다", /내려받아|직접 열어/.test(status()), status());
    if (secure) Object.defineProperty(window, "isSecureContext", secure);
  } else {
    ok("http 주소면 파일로 열라고 알려 준다", false, "이 브라우저에서는 바꿔 끼울 수 없음");
  }
  navigator.mediaDevices.getDisplayMedia = keep;

  // ⑤ 켠 뒤에 사람이 브라우저 막대에서 "공유 중지"를 눌렀다
  const cv = document.createElement("canvas");
  cv.width = 640; cv.height = 400;
  const g = cv.getContext("2d");
  g.fillStyle = "#123456"; g.fillRect(0, 0, 640, 400);
  const fake = cv.captureStream(10);
  put(async () => fake);
  $("#shoot").click();
  await wait(700);
  ok("다시 켤 수 있다", WATCH.on, "찍기 켜짐");
  ok("켜지면 옆 목록이 나온다", $("#side").classList.contains("on"));

  fake.getVideoTracks()[0].stop();
  fake.getVideoTracks()[0].dispatchEvent(new Event("ended"));
  await wait(300);
  ok("공유가 끊기면 찍기를 멈춘다", !WATCH.on);
  ok("공유가 끊기면 그렇게 말한다", /종료|끝났/.test(status()), status());
  ok("공유가 끊기면 버튼이 처음으로 돌아간다", $("#shoot").textContent === "화면 찍기 시작", $("#shoot").textContent);
  ok("공유가 끊겨도 만든 것은 안 사라진다", typeof state.steps.length === "number", state.steps.length + "단계");

  // ⑥ 끊긴 뒤 다시 켤 수 있다
  const cv2 = document.createElement("canvas");
  cv2.width = 640; cv2.height = 400;
  cv2.getContext("2d").fillRect(0, 0, 640, 400);
  put(async () => cv2.captureStream(10));
  $("#shoot").click();
  await wait(700);
  ok("끊긴 뒤에도 다시 켜진다", WATCH.on && !!WATCH.timer, "다시 켜짐");

  navigator.mediaDevices.getDisplayMedia = real;
  return out.join("\n");
})()
