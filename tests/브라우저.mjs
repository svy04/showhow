// 검사용 브라우저를 찾아 연다.
// playwright 를 따로 깔았으면 그것을 쓰고, 없으면 흔한 자리를 몇 군데 뒤진다.
// 브라우저는 엣지를 먼저 찾고, 없으면 크롬, 그것도 없으면 playwright 가 받아 둔 크로미움.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const APP = "file:///" + path.join(ROOT, "index.html").split(path.sep).join("/");

function findPlaywright() {
  const tries = [
    "playwright",
    "playwright-core",
    path.join(process.env.HOME || process.env.USERPROFILE || "", ".claude/skills/gstack/node_modules/playwright"),
  ];
  for (const t of tries) {
    try { return require(t); } catch (e) {}
  }
  console.log(
    "브라우저 검사를 돌리려면 playwright 가 필요합니다.\n" +
    "  npm i -D playwright && npx playwright install msedge\n" +
    "브라우저 없이 도는 검사만 하려면: node tests/검사_전체.mjs");
  process.exit(2);
}

export async function open(opts = {}) {
  const { chromium } = findPlaywright();
  const args = ["--no-sandbox", "--disable-gpu", ...(opts.args || [])];
  for (const channel of ["msedge", "chrome", undefined]) {
    try {
      return await chromium.launch({ channel, headless: true, args });
    } catch (e) {}
  }
  console.log("검사용 브라우저를 못 찾았습니다 — npx playwright install chromium");
  process.exit(2);
}
