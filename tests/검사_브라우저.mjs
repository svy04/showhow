// 진짜 브라우저에서만 확인되는 것을 검사한다.
// 가짜 화면(headless 검사_전체.mjs)에는 큰 저장칸(IndexedDB)이 없어서,
// 보관함이 실제로 사진까지 담아 두는지는 여기서만 드러난다.
// 쓰기: node 검사_브라우저.mjs
import { open, APP, ROOT } from "./브라우저.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CASES = fs.readdirSync(HERE).filter(f => /^검사_브라우저_.*\.js$/.test(f)).sort();
if (!CASES.length) { console.log("검사할 것이 없습니다 (검사_브라우저_*.js)"); process.exit(1); }

const url = APP;
const browser = await open();

let fails = 0;
for (const file of CASES) {
  console.log("── " + file.replace(/^검사_브라우저_|\.js$/g, "") + " ──");
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on("pageerror", e => errs.push(String(e).slice(0, 160)));
  await page.goto(url);
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    return new Promise(res => { const r = indexedDB.deleteDatabase("manualBox"); r.onsuccess = r.onerror = r.onblocked = () => res(); });
  });
  await page.reload();
  await page.waitForTimeout(300);

  let text = "";
  try { text = await page.evaluate(fs.readFileSync(path.join(HERE, file), "utf8"), { timeout: 120000 }); }
  catch (e) { text = "실패! 검사가 도중에 죽음 — " + String(e).slice(0, 200); }
  console.log(text);
  fails += (text.match(/^실패!/gm) || []).length;
  if (errs.length) { console.log("  화면 오류 " + errs.length + "건: " + errs[0]); fails++; }
  await page.close();
}

await browser.close();
console.log("\n" + (fails ? "실패 " + fails + "건" : "전부 통과"));
process.exit(fails ? 1 : 0);
