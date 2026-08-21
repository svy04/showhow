(async () => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? "통과  " : "실패! ") + n + (e ? " — " + e : ""));
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const px = c => { const cv = document.createElement("canvas"); cv.width = 400; cv.height = 250;
    const g = cv.getContext("2d"); g.fillStyle = c; g.fillRect(0, 0, 400, 250); return cv.toDataURL("image/png"); };
  const txt = () => $("#boxlist").textContent.replace(/\s+/g, " ");

  // ① 첫 매뉴얼을 만들어 보관함에 넣는다
  docInto({ id: null, name: "첫 매뉴얼", steps: [
    { title: "하나", desc: "첫째 단계", img: px("#456") },
    { title: "둘",  desc: "둘째 단계", img: px("#654") },
  ] });
  await boxSave();
  await boxShow(true);
  ok("보관함이 열린다", $("#box").classList.contains("on"));
  ok("보는 중인 것이 목록에 있다", txt().includes("첫 매뉴얼"));
  ok("단계 수가 보인다", txt().includes("2단계"), txt().slice(0, 70));

  // ② 새 매뉴얼로 갈아탄다
  await boxNew();
  ok("새 매뉴얼은 비어 있다", docNow().steps.length === 0, docNow().steps.length + "단계");
  const id2 = docNow().id;
  docInto({ id: id2, name: "둘째 매뉴얼", steps: [{ title: "가", desc: "새 것의 단계", img: px("#333") }] });
  await boxSave();
  await boxShow(true);
  ok("두 개가 나란히 있다", txt().includes("첫 매뉴얼") && txt().includes("둘째 매뉴얼"), txt().slice(0, 110));

  // ③ 옛 것으로 돌아간다
  const pick = name => [...document.querySelectorAll("#boxlist .boxrow")]
    .find(r => r.textContent.includes(name) && !r.textContent.includes("복사본"));
  pick("첫 매뉴얼").querySelector('button[data-box="open"]').click();
  await wait(200);
  const d = docNow();
  ok("옛 매뉴얼이 사진까지 살아 돌아온다",
     d.steps.length === 2 && d.steps[0].title === "하나" && String(d.steps[0].img).startsWith("data:image"),
     d.steps.length + "단계 · " + d.steps[0].title);
  ok("이름도 따라온다", $("#docname").value === "첫 매뉴얼", $("#docname").value);

  // ④ 복제한 뒤 고쳐도 원본은 그대로
  await boxCopy();
  await wait(150);
  ok("복제본에 사본 표시가 붙는다", $("#docname").value.includes("복사본"), $("#docname").value);
  ok("복제본에 단계가 그대로다", docNow().steps.length === 2);
  docNow().steps[0].title = "고친 제목";
  await boxSave();
  await boxShow(true);
  pick("첫 매뉴얼").querySelector('button[data-box="open"]').click();
  await wait(200);
  ok("복제본을 고쳐도 원본은 그대로다", docNow().steps[0].title === "하나", docNow().steps[0].title);

  // ⑤ 보는 중인 것은 못 지운다
  await boxShow(true);
  const rows = [...document.querySelectorAll("#boxlist .boxrow")];
  const cur = rows.find(r => r.textContent.includes("보는 중"));
  ok("보는 중인 것엔 삭제 버튼이 없다", cur && !cur.querySelector('button[data-box="del"]'));
  const before = rows.length;
  rows.find(r => !r.textContent.includes("보는 중")).querySelector('button[data-box="del"]').click();
  await wait(220);
  ok("다른 것은 지워진다", document.querySelectorAll("#boxlist .boxrow").length === before - 1,
     document.querySelectorAll("#boxlist .boxrow").length + "개 남음");

  // ⑥ 큰 저장칸에 실물로 들어갔는가
  const all = await boxAll();
  const names = all.map(x => x.name).join(" / ");
  ok("큰 저장칸에 실물로 들어 있다", all.length >= 2 && all.every(x => x.steps.length > 0), all.length + "건: " + names);
  ok("사진까지 통째로 보관된다", JSON.stringify(all).length > 4000,
     Math.round(JSON.stringify(all).length / 1024) + "KB 보관됨");
  ok("작은 칸이 아니라 큰 칸을 쓴다", !localStorage.getItem("manualBox"), "IndexedDB 사용");

  return out.join("\n");
})()
