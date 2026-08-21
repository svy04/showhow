// 화면이 한 약속을 물건이 지키는가.
// "완전히 지워집니다" · "사진은 둘 다 남습니다" · "잘려 나갑니다" 같은 말을 실제로 검사한다.
(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 빨간 네모가 박힌 사진 — 가렸는지 픽셀로 확인하려고
  const 비밀사진 = () => {
    const cv = document.createElement("canvas"); cv.width = 200; cv.height = 120;
    const g = cv.getContext("2d");
    g.fillStyle = "#e8eef6"; g.fillRect(0, 0, 200, 120);
    g.fillStyle = "#ff0000"; g.fillRect(10, 10, 60, 30);      // 여기가 가려야 할 자리
    return cv.toDataURL("image/png");
  };
  const 픽셀 = (url, x, y) => new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      const g = cv.getContext("2d");
      g.drawImage(im, 0, 0);
      const d = g.getImageData(x, y, 1, 1).data;
      res([d[0], d[1], d[2]]);
    };
    im.onerror = () => res([-1, -1, -1]);
    im.src = url;
  });
  const 크기 = url => new Promise(res => {
    const im = new Image();
    im.onload = () => res(im.naturalWidth + "x" + im.naturalHeight);
    im.onerror = () => res("못 읽음");
    im.src = url;
  });

  // ── 가리기: "그 부분은 원본에서도 지워집니다" ──
  docInto({ id: null, name: "약속 시험", steps: [{ title: "비밀", desc: "", img: 비밀사진() }] });
  await wait(300);
  openMark(0);
  await wait(400);
  setTool("blur");
  ok("가리기 안내가 원본까지 지운다고 말한다", /원본에서도 지워집니다/.test($("#markhint").textContent),
     $("#markhint").textContent);
  MK.marks = [{ t: "blur", x: 5, y: 5, w: 70, h: 40 }];
  drawMark();
  $("#mark-done").click();
  await wait(400);
  const 원본색 = await 픽셀(state.steps[0].orig || state.steps[0].img, 15, 15);
  const 화면색 = await 픽셀(state.steps[0].img, 15, 15);
  ok("가린 자리는 화면 사진에서 지워진다", 화면색[0] < 200, 화면색.join(","));
  ok("가린 자리는 원본에도 안 남는다 — 사진 원본만으로 새어 나가지 않게",
     원본색[0] < 200, "원본 픽셀 " + 원본색.join(","));
  undo(); await wait(200);

  // ── 자르기: 다시 열어도 자른 채로 ──
  docInto({ id: null, name: "자르기 시험", steps: [{ title: "자를 것", desc: "", img: 비밀사진() }] });
  await wait(300);
  openMark(0);
  await wait(400);
  doCrop({ t: "crop", x: 0, y: 0, w: 100, h: 60 });
  await wait(500);
  $("#mark-done").click();
  await wait(400);
  const 자른뒤 = await 크기(state.steps[0].img);
  ok("자르면 사진이 진짜 작아진다", 자른뒤 === "100x60", 자른뒤);
  openMark(0);
  await wait(500);
  const 다시연것 = $("#markcv").width + "x" + $("#markcv").height;
  ok("다시 열어도 자른 크기 그대로다", 다시연것 === "100x60", 다시연것);
  $("#mark-done").click();
  await wait(400);
  const 두번뒤 = await 크기(state.steps[0].img);
  ok("아무것도 안 하고 다시 저장해도 자르기가 안 풀린다", 두번뒤 === "100x60", 두번뒤);

  // ── 합치기: "사진은 둘 다 남습니다" ──
  const 그림 = c => { const cv = document.createElement("canvas"); cv.width = 120; cv.height = 80;
    const g = cv.getContext("2d"); g.fillStyle = c; g.fillRect(0, 0, 120, 80); return cv.toDataURL("image/png"); };
  docInto({ id: null, name: "합치기 시험", steps: [
    { title: "하나", desc: "", img: 그림("#123456") },
    { title: "둘", desc: "", img: 그림("#654321") },
  ] });
  await wait(300);
  act("merge", 1);
  await wait(300);
  ok("합치면 딸려 온 사진이 남는다", (state.steps[0].extra || []).length === 1,
     (state.steps[0].extra || []).length + "장");

  // 내려받기를 가로채 진짜 파일 안을 본다
  const got = [];
  const realCreate = URL.createObjectURL;
  const realClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = b => { got.push(b); return "blob:fake"; };
  HTMLAnchorElement.prototype.click = function () {};
  const 이름들 = async blob => {
    const u = new Uint8Array(await blob.arrayBuffer()), td = new TextDecoder();
    const names = [];
    for (let i = 0; i + 4 < u.length; i++) {
      if (u[i] === 0x50 && u[i + 1] === 0x4b && u[i + 2] === 0x03 && u[i + 3] === 0x04) {
        const nl = u[i + 26] | (u[i + 27] << 8);
        names.push(td.decode(u.slice(i + 30, i + 30 + nl)));
      }
    }
    return names;
  };

  got.length = 0; exportImages(); await wait(600);
  const 사진묶음 = got.length ? await 이름들(got[got.length - 1]) : [];
  ok("«사진 원본만» 에 딸려 온 사진도 들어간다",
     사진묶음.filter(n => /^원본\//.test(n)).length === 2, 사진묶음.join(" | "));

  got.length = 0; exportMD(); await wait(600);
  const 마크다운 = got.length ? await 이름들(got[got.length - 1]) : [];
  ok("«글과 그림으로» 에도 둘 다 들어간다",
     마크다운.filter(n => /그림\//.test(n)).length === 2, 마크다운.filter(n => /그림\//.test(n)).join(" | "));

  got.length = 0; await exportDOCX(); await wait(800);
  const 워드 = got.length ? await 이름들(got[got.length - 1]) : [];
  ok("워드에도 둘 다 들어간다",
     워드.filter(n => /word\/media\//.test(n)).length === 2, 워드.filter(n => /word\/media\//.test(n)).join(" | "));

  got.length = 0; await exportPPT(); await wait(800);
  const 피피티 = got.length ? await 이름들(got[got.length - 1]) : [];
  ok("PPT 에도 둘 다 들어간다",
     피피티.filter(n => /ppt\/media\//.test(n)).length === 2, 피피티.filter(n => /ppt\/media\//.test(n)).join(" | "));

  URL.createObjectURL = realCreate;
  HTMLAnchorElement.prototype.click = realClick;

  // ── 찾는 중 인쇄: 걸러진 채로 나가지 않는다 ──
  docInto({ id: null, name: "인쇄 시험", steps: [
    { title: "사과", desc: "", img: 그림("#111") },
    { title: "바나나", desc: "", img: 그림("#222") },
    { title: "사과주스", desc: "", img: 그림("#333") },
  ] });
  await wait(300);
  찾기줄(true);
  $("#find").value = "사과";
  $("#find").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(250);
  const 옛인쇄 = window.print;
  let 인쇄때감춰진수 = -1;
  window.print = () => {
    인쇄때감춰진수 = document.querySelectorAll("#steps .step.away").length;
  };
  OUT.print();
  await wait(300);
  window.print = 옛인쇄;
  ok("찾는 중에 인쇄해도 걸러진 단계가 빠지지 않는다", 인쇄때감춰진수 === 0,
     "인쇄 순간 감춰진 칸 " + 인쇄때감춰진수 + "개");
  $("#findclose").click();
  await wait(200);

  // ── 전부 빼 두면 왜 못 내보내는지 말한다 ──
  docInto({ id: null, name: "전부 뺀 시험", steps: [
    { sec: true, title: "묶음", off: true },
    { title: "가", desc: "", img: 그림("#444") },
  ] });
  await wait(300);
  exportHTML();
  await wait(300);
  ok("전부 빼 두면 «만들어 주세요» 가 아니라 «빼 두었다» 고 말한다",
     /해 두었/.test($("#status").textContent), $("#status").textContent);

  // ── 다른 탭 경고 ──
  const 남의탭 = JSON.stringify({ tab: "다른탭", doc: state.id, at: Date.now() });
  window.dispatchEvent(Object.assign(new Event("storage"), { key: "manualTabAsk", newValue: 남의탭 }));
  await wait(250);
  ok("다른 탭이 같은 매뉴얼을 열면 이 탭에도 경고가 뜬다", $("#tabwarn").classList.contains("on"));
  $("#tabwarn-close").click();
  await wait(150);
  ok("경고는 닫을 수 있다", !$("#tabwarn").classList.contains("on"));

  return out.join("\n");
})()
