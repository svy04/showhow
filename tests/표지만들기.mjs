// 저장소 표지를 만든다. 배경은 그림, 글자는 코드로 — 글자가 뭉개지지 않게.
// 화면 값은 전부 마이크림 디자인 시스템 토큰에서 온다.
// 쓰기: node tests/표지만들기.mjs <배경그림.png>
import { open, ROOT } from "./브라우저.mjs";
import fs from "fs";
import path from "path";

const BG = process.argv[2];
const 배경 = BG && fs.existsSync(BG) ? fs.readFileSync(BG).toString("base64") : "";
const 토큰 = fs.readFileSync(
  "C:/Users/admin/Documents/mycream/mycream-dev/product-docs/design/tokens.css", "utf8");

const html = `<!DOCTYPE html><html lang="ko" class="dark"><head><meta charset="utf-8"><style>
${토큰}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1280px; height: 640px; overflow: hidden;
    background: var(--colors-background);
    font-family: var(--font-family-default);
    word-break: keep-all;
  }
  .wrap { position: relative; width: 1280px; height: 640px; }
  ${배경 ? `.bg { position: absolute; inset: 0;
      background: url(data:image/png;base64,${배경}) center/cover no-repeat; opacity: .9; }
    .fade { position: absolute; inset: 0;
      background: linear-gradient(90deg, var(--colors-background) 32%,
        color-mix(in srgb, var(--colors-background) 82%, transparent) 50%, transparent 72%); }` : ""}
  .text { position: absolute; left: 80px; top: 150px; width: 660px; }
  .mark {
    font: var(--typography-6-semibold); color: var(--colors-label-brand);
    letter-spacing: .04em; margin-bottom: var(--spacing-6);
  }
  h1 {
    font: var(--typography-1-size)/1.25 var(--font-family-default); font-weight: 700;
    color: var(--colors-label-normal); font-size: 52px; letter-spacing: -1.2px;
  }
  h1 em { font-style: normal; color: var(--colors-label-brand); }
  .p {
    margin-top: var(--spacing-6); font: var(--typography-4-size)/1.5 var(--font-family-default);
    color: var(--colors-label-neutral);
  }
  .b {
    margin-top: var(--spacing-10); font: var(--typography-7-regular);
    color: var(--colors-label-assistive); letter-spacing: .03em;
  }
</style></head><body><div class="wrap">
  ${배경 ? '<div class="bg"></div><div class="fade"></div>' : ""}
  <div class="text">
    <div class="mark">showhow</div>
    <h1>하던 일만 하세요.<br><em>문서는 알아서 남습니다.</em></h1>
    <div class="p">클릭하지 않아도 담깁니다 — 타이핑도, 단축키도, 창이 뜨는 것도.</div>
    <div class="b">파일 하나 · 설치 없음 · 사진은 컴퓨터 밖으로 안 나감</div>
  </div>
</div></body></html>`;

const tmp = path.join(ROOT, ".표지.html");
fs.writeFileSync(tmp, html, "utf8");

const browser = await open();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 });
await page.goto("file:///" + tmp.split(path.sep).join("/"));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(ROOT, "docs", "표지.png") });
await browser.close();
fs.unlinkSync(tmp);
console.log("표지 만듦: docs/표지.png");
