(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const px = (t, c) => { const cv = document.createElement("canvas"); cv.width = 600; cv.height = 380;
    const g = cv.getContext("2d"); g.fillStyle = c; g.fillRect(0, 0, 600, 380);
    g.fillStyle = "#222"; g.font = "24px sans-serif"; g.fillText(t, 30, 60); return cv.toDataURL("image/png"); };

  // 내려받기를 가로챈다 — 파일이 진짜로 무엇을 담고 있는지 보기 위해
  const got = [];
  const realCreate = URL.createObjectURL;
  URL.createObjectURL = b => { got.push(b); return "blob:fake"; };
  const realClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { got.name = this.download; };

  docInto({ id: null, name: "설치 안내서", steps: [
    { sec: true, title: "처음 설정하기" },
    { title: "프로그램을 연다", desc: "바탕화면 아이콘을 두 번 누릅니다.", img: px("첫 화면", "#e8eef6") },
    { title: "이름을 넣는다",   desc: "칸에 회사 이름을 씁니다.",       img: px("이름 입력", "#f6efe8") },
    { sec: true, title: "관리자만", off: true },
    { title: "비밀 설정", desc: "밖에 나가면 안 되는 내용", img: px("비밀", "#f0d8d8") },
  ] });
  applyForm({ name: "표준", org: "마이크림 마케팅팀", sub: "신입용",
              intro: "따라 하면 됩니다.", outro: "문의 · 마케팅팀" });
  await wait(50);

  const bytes = async b => new Uint8Array(await b.arrayBuffer());
  const nameList = async b => {                     // ZIP 안에 든 파일 이름을 읽는다
    const u = await bytes(b), td = new TextDecoder(), names = [];
    for (let i = 0; i < u.length - 4; i++) {
      if (u[i] === 0x50 && u[i + 1] === 0x4B && u[i + 2] === 0x03 && u[i + 3] === 0x04) {
        const n = u[i + 26] | (u[i + 27] << 8);
        names.push(td.decode(u.slice(i + 30, i + 30 + n)));
      }
    }
    return names;
  };

  // ① 파워포인트
  got.length = 0;
  exportPPT();
  await wait(200);
  ok("PPT 파일이 나온다", got.length === 1, got.length + "개");
  const ppt = got[0];
  const pn = await nameList(ppt);
  ok("압축 파일 형식이 맞다", (await bytes(ppt))[0] === 0x50);
  ok("파워포인트 뼈대가 다 들어 있다",
     ["[Content_Types].xml", "ppt/presentation.xml", "ppt/slides/slide1.xml", "ppt/slideMasters/slideMaster1.xml"]
       .every(f => pn.includes(f)), pn.length + "개 부품");
  const nSlides = pn.filter(f => /^ppt[/]slides[/]slide[0-9]+[.]xml$/.test(f)).length;
  ok("장 구성이 맞다 (표지1+섹션1+단계2+맺음말1)", nSlides === 5, nSlides + "장");
  ok("사진이 들어 있다", pn.some(f => /^ppt\/media\//.test(f)));
  const slideText = new TextDecoder().decode(await bytes(ppt));
  ok("뺀 섹션은 안 들어간다", !slideText.includes("비밀 설정"));
  ok("한글이 깨지지 않는다", slideText.includes("프로그램을 연다"));
  ok("파일 이름이 문서 이름을 따른다", String(got.name || "").includes("설치 안내서"), got.name);

  // ② 사진 원본 묶음
  got.length = 0;
  exportImages();
  await wait(300);
  const zn = await nameList(got[0]);
  ok("사진 묶음이 나온다", got.length === 1);
  ok("단계마다 사진이 한 장씩", zn.filter(f => /\.png$/.test(f)).length === 2, zn.join(" / ").slice(0, 90));
  ok("순서가 이름에 남는다", zn.some(f => /01/.test(f)) && zn.some(f => /02/.test(f)));

  // ③ 혼자 도는 한 장짜리 문서
  got.length = 0;
  exportHTML();
  await wait(150);
  const html = await got[0].text();
  ok("한 장짜리 문서가 나온다", got.length === 1);
  ok("브라우저가 열 수 있는 문서다", html.startsWith("<!DOCTYPE html>") && html.trim().endsWith("</html>"));
  ok("표지·머리말이 들어간다", html.includes("마이크림 마케팅팀") && html.includes("따라 하면 됩니다."));
  ok("사진이 파일 안에 박혀 있다", (html.match(/data:image\/png;base64,/g) || []).length === 2);
  ok("뺀 섹션은 안 들어간다", !html.includes("비밀 설정"));
  ok("바깥으로 부르는 곳이 없다", !/https?:\/\/|fetch\(|<script/.test(html));

  // ④ 그 문서를 진짜로 열어 본다
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;width:900px;height:600px";
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
  await new Promise(r => { iframe.onload = r; setTimeout(r, 1200); });
  const doc = iframe.contentDocument;
  ok("열면 제목이 보인다", doc.querySelector("h1") && doc.querySelector("h1").textContent === "설치 안내서",
     doc.querySelector("h1") && doc.querySelector("h1").textContent);
  ok("열면 단계가 순서대로 보인다",
     [...doc.querySelectorAll("section h3")].map(h => h.textContent).join("|") === "1프로그램을 연다|2이름을 넣는다",
     [...doc.querySelectorAll("section h3")].map(h => h.textContent).join("|"));
  const imgs = [...doc.querySelectorAll("img")];
  await wait(400);
  ok("열면 사진이 실제로 그려진다", imgs.length === 2 && imgs.every(i => i.naturalWidth > 0),
     imgs.map(i => i.naturalWidth + "x" + i.naturalHeight).join(" "));
  ok("글자가 읽을 만한 크기다", parseFloat(getComputedStyle(doc.body).fontSize) >= 16,
     getComputedStyle(doc.body).fontSize);

  URL.createObjectURL = realCreate;
  HTMLAnchorElement.prototype.click = realClick;
  iframe.remove();
  return out.join("\n");
})()
