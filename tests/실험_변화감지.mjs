// 실험: "화면이 바뀌면 자동으로 찍는다"가 실제로 쓸 만한가?
// 브라우저 없이, 가짜 화면 연속을 만들어 변화 감지 규칙을 검증한다.
// 재는 것: ① 진짜 바뀐 순간을 잡는가 ② 커서만 움직인 것에 안 속는가 ③ 한 번 바뀔 때 한 장만 찍는가

const W = 240, H = 150;                    // 비교용 축소 크기 (실제도 이 정도로 줄여서 잰다)

function frame(fill) {
  const a = new Uint8Array(W * H);
  a.fill(fill);
  return a;
}
function paint(a, x, y, w, h, v) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++)
      if (i >= 0 && i < W && j >= 0 && j < H) a[j * W + i] = v;
  return a;
}
function noise(a, amount) {                 // 압축 노이즈·안티앨리어싱 흉내
  const b = a.slice();
  for (let i = 0; i < b.length; i++) b[i] = Math.max(0, Math.min(255, b[i] + ((Math.random() * 2 - 1) * amount) | 0));
  return b;
}

// ── 판정 규칙 (실제 제품에 넣을 것과 같은 규칙) ──
function diffRatio(a, b, tol) {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > tol) n++;
  return n / a.length;
}

const TOL = 12;        // 픽셀 하나가 "달라졌다"고 볼 밝기 차
const FIRE = 0.020;    // 화면의 2% 이상 달라지면 "바뀌었다"
const CALM = 0.004;    // 0.4% 아래로 잠잠해지면 "멈췄다"

function makeWatcher() {
  let last = null, armed = true, shots = 0, pending = null;
  return {
    feed(f) {
      if (!last) { last = f; return; }
      const d = diffRatio(last, f, TOL);
      last = f;
      if (armed && d > FIRE) { armed = false; pending = true; return; }   // 바뀌기 시작
      if (!armed && d < CALM) {                                           // 멈췄다 → 지금 찍는다
        if (pending) { shots++; pending = false; }
        armed = true;
      }
    },
    get shots() { return shots; },
  };
}

const results = [];
const ok = (n, c, e = "") => { console.log((c ? "통과  " : "실패! ") + n + (e ? " — " + e : "")); results.push(c); };

// ① 화면 세 번 바뀌면 세 장
{
  const w = makeWatcher();
  let base = frame(30);
  const still = n => { for (let i = 0; i < n; i++) w.feed(noise(base, 3)); };
  still(6);
  for (const y of [20, 60, 100]) {          // 세 번 바뀜: 큰 패널이 뜬다
    base = paint(base.slice(), 20, y, 200, 40, 200);
    for (let i = 0; i < 3; i++) w.feed(noise(base, 3));   // 바뀌는 중
    still(6);                                              // 멈춤
  }
  ok("세 번 바뀌면 세 장", w.shots === 3, w.shots + "장");
}

// ② 커서만 움직이는 것(아주 작은 변화)에는 안 속는다
{
  const w = makeWatcher();
  let base = frame(30);
  for (let i = 0; i < 30; i++) {
    const b = paint(base.slice(), 10 + i * 3, 70, 4, 6, 220);   // 4×6 커서가 지나감
    w.feed(noise(b, 3));
  }
  ok("커서 움직임엔 안 속는다", w.shots === 0, w.shots + "장");
}

// ③ 한 번 바뀌는데 여러 장 찍지 않는다 (천천히 열리는 창)
{
  const w = makeWatcher();
  let base = frame(30);
  for (let i = 0; i < 6; i++) w.feed(noise(base, 3));
  for (let step = 1; step <= 10; step++) {                       // 창이 10프레임에 걸쳐 커진다
    const b = paint(base.slice(), 20, 20, 20 * step, 12 * step, 200);
    w.feed(noise(b, 3));
    base = b;
  }
  for (let i = 0; i < 8; i++) w.feed(noise(base, 3));            // 멈춤
  ok("천천히 열려도 한 장", w.shots === 1, w.shots + "장");
}

// ④ 영상이 도는 화면(계속 바뀜)에서는 마구 찍지 않는다
{
  const w = makeWatcher();
  let base = frame(30);
  for (let i = 0; i < 40; i++) {
    const b = paint(base.slice(), 20, 20, 180, 100, 60 + (i * 17) % 160);  // 계속 변함
    w.feed(noise(b, 3));
  }
  ok("계속 바뀌는 화면에선 안 찍는다", w.shots === 0, w.shots + "장");
}

// ⑤ 속도: 240×150 비교가 초당 몇 번 가능한가
{
  const a = noise(frame(30), 40), b = noise(frame(30), 40);
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 2000; i++) diffRatio(a, b, TOL);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const per = ms / 2000;
  ok("비교 한 번 1ms 미만", per < 1, per.toFixed(3) + "ms · 초당 " + Math.round(1000 / per) + "회 가능");
}

console.log("\n" + (results.every(Boolean) ? "전부 통과 — 이 규칙으로 만들 수 있다" : "실패 있음 — 규칙을 고쳐야 한다"));
process.exit(results.every(Boolean) ? 0 : 1);
