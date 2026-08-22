<img src="docs/표지.png" alt="showhow — Just do your work. The document stays behind." width="100%">

<p align="center">
  <a href="https://github.com/svy04/showhow/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-b25683" alt="License GPL-3.0"></a>
  <a href="https://github.com/svy04/showhow/stargazers"><img src="https://img.shields.io/github/stars/svy04/showhow?color=b25683&label=%E2%98%85" alt="Stars"></a>
  <img src="https://img.shields.io/badge/HTML-1%20file-b25683" alt="One HTML file">
  <img src="https://img.shields.io/badge/install-none-6b6470" alt="No install">
</p>

# showhow

**Just do your work. The document stays behind.** A single browser file that records your screen as you work and exports it as PDF, PowerPoint or Word.

[한국어](README.md) · [Open it](https://svy04.github.io/showhow/) · [Download the file](https://github.com/svy04/showhow/raw/main/index.html)

- **Captures without a click.** Typing, keyboard shortcuts, dialogs opening, loading finishing — if the screen changes, it lands in the document.
- **One shot per change, taken when things settle.** A moving cursor or a playing video does not produce shots.
- **Brings back what it missed.** Recent frames stay in memory, so you can rewind and pull one out.
- **Exports to PDF, PPTX, DOCX, a standalone HTML file, raw images, or Markdown.** The Office files open and edit like any other.
- **Cuts per audience.** Mark a section as excluded and it disappears from every export.
- **Screenshots never leave the machine.** No code in this file sends anything anywhere. It works offline (auto-titles are the one exception — see below).
- **Drafts the step titles.** It reads the text inside the changed region and fills in a title like "다음 누르기" (press Next). Measured on 16 common button labels drawn at four sizes — 64 runs: **44 correct**, 10 wrong, 10 blank. The reading happens on your machine.
- **Ships with 498 passing tests.** 349 run in a real browser, 8 reload the page for real, and 10 run against a real screen-share stream with nothing stubbed.

## Try it in 30 seconds

1. [Download index.html](https://github.com/svy04/showhow/raw/main/index.html), or just [open it here](https://svy04.github.io/showhow/).
2. Double-click it. Chrome or Edge.
3. Press **화면 찍기 시작** (Start capturing) and pick a screen to share — once.
4. Go back to work.

![First screen](docs/1_첫화면.png)

> The interface is Korean. It was built for a Korean request (see *Why this exists*), and the labels have not been translated yet.

## What is different

Most screenshot-based manual tools only take a picture **when you click.**

> "StepCapture records cursor clicks and drags, but does not capture non-click actions, such as text entry or keyboard shortcuts."
> — [Snagit documentation](https://www.techsmith.com/learn/tutorials/snagit/create-step-by-step-instructions/) (checked 2026-08-21)

> "Recorded steps don't capture anything that's typed during the recording."
> — [Microsoft Steps Recorder documentation](https://support.microsoft.com/en-us/windows/record-steps-to-reproduce-a-problem-46582c9b-620f-2e36-00c9-04e25d784e47) (checked 2026-08-21)

So steps go missing, and you only notice afterwards. Not because editing was late — because no picture was ever taken.

showhow watches **how much the screen changed** instead. It compares frames about 7 times a second and takes a shot once the screen has held still for **0.7 seconds**.

That 0.7 second matters. Screen sharing delivers about 5 frames a second while we look 7 times a second, so seeing the same frame two or three times in a row is normal. Read that as "it stopped" and a playing video fills your document with junk. So stillness is measured on a clock, not in ticks.

| While you | Click-based tools | showhow |
|---|---|---|
| press a button | captured | captured |
| type into a field | missed | captured |
| use a keyboard shortcut | missed | captured |
| wait for a dialog or a load | missed | captured |
| just move the cursor | captured (to be deleted) | ignored |
| play a video | captured repeatedly | ignored |

A screen that moved for a long stretch is remembered as "video" for 3 seconds, and during that time it must hold still for 1.5 seconds instead. That is why scrolling and video do not pile up shots.

If the screen never holds still long enough to capture, showhow says so. Press <kbd>Space</kbd> to take one by hand.

## Shape it

![Steps](docs/2_단계.png)

The changed region gets a red outline, and the description field shows a faint hint like `오른쪽 아래 부분이 바뀌었습니다` ("the bottom-right area changed"). Hints are placeholders — they never reach the exported document.

Turn on **제목 자동 작성** (auto-title) and it reads the text inside the changed region to draft a title. Drafted titles are labelled **짐작** ("a guess") because that is what they are. Measured over 16 common button labels drawn at four sizes:

| | correct | wrong | blank |
|---|---|---|---|
| all 64 | 44 | 10 | 10 |
| Korean 40 | 26 | — | — |
| English 24 | 18 | — | — |

Run `node tests/검사_제목.mjs` to measure it again. The suite fails below **40 correct · 24 Korean · 16 English** — four below the measured 44 · 26 · 18.

Per step: draw boxes, arrows, numbered badges and text labels in five colours and three weights; blur what must be hidden; crop; erase a single mark; merge, split or duplicate; drag the numbered circle to reorder. Ctrl+Z undoes, Ctrl+Shift+Z redoes.

Across steps:

- **Select many at once.** Click a step number to select it, Shift-click to take the whole range, then delete them together or wrap them in a section.
- **Find and replace.** <kbd>Ctrl</kbd>+<kbd>F</kbd> searches titles and descriptions; the word you found can be replaced everywhere in one go. When a term changes you do not hand-edit sixty steps. (Text baked into screenshots is not touched, and it says so.)
- **Add or swap a screenshot.** Drop an image file onto the window and it lands in place; a screenshot that came out wrong can be swapped for another.

![Annotating](docs/6_표시.png)

## Export it

![Export menu](docs/3_내보내기.png)

| Format | Use it when |
|---|---|
| PDF | printing, or sending something that looks identical everywhere |
| PPTX | presenting, or letting the recipient edit |
| DOCX | continuing in a company document template (opens in Hangul too) |
| One HTML file | sending something that opens on double-click, no software needed |
| Raw images | pasting the screenshots into another document |
| Markdown | moving it into a wiki, GitHub or Notion |
| Preview | looking at it with the recipient's eyes before you send it (opens in a new tab) |

Exported files carry the date — `Filing expenses_2026-08-21.pptx`. Once your downloads folder starts appending `(1)` and `(2)`, nobody can tell which one is current.

The `.pptx` and `.docx` are written from scratch — ZIP container and OOXML parts, no library. The tests parse the generated XML to confirm it is well formed. PDF goes through browser printing, so Korean text stays selectable and searchable rather than becoming an image.

![Print layout](docs/5_인쇄.png)

## Templates and multiple manuals

Save a cover, an intro and a closing line as a template, then reuse it. Templates travel between machines as `.manualform.json` files.

Manuals are kept in a list. Open one, continue it, or duplicate it and edit the copy.

![Manual list](docs/4_목록.png)

## Where things are stored

| What | Where | Until |
|---|---|---|
| the master copy, screenshots included | browser IndexedDB | you clear browser data |
| the text without screenshots | small browser storage | the same — text survives if IndexedDB goes bad |
| the last five earlier versions | browser IndexedDB | one every ten minutes; the sixth pushes out the oldest |
| saved work files | a folder you chose | you delete them |

Screenshots never go into the small storage, so no amount of them can fill it up and block a save.

The exception: where the browser blocks IndexedDB (private mode and similar), the app falls back to the small storage and screenshots do go there. When it fills up, a banner says saving has stopped — export a work file at that point.

If an edit went badly wrong, the earlier versions listed under **매뉴얼 목록** (the manual list) take you back further than undo reaches.

Everything lives inside this one browser. Change machines or clear the browser and it goes with it. **매뉴얼 목록 → 전부 파일 하나로** packs every manual into a single file; **파일에서 전부 가져오기** unpacks it on the other side. Colliding ids are never overwritten — the incoming copy is placed beside the existing one.

## Six things to know

1. **Auto-titles only work over an address, not from a downloaded file.** The text-reading files live in `ocr/`, and a lone downloaded `index.html` cannot read a sibling folder. Use [the live page](https://svy04.github.io/showhow/) or put the whole repository on a server inside your company. Screenshots still never leave the machine — the reading runs locally too.
2. **Tested on Chrome and Edge.** Firefox and Safari were not run. To check one, open it there and walk through the steps `tests/검사_촬영.mjs` performs.
3. **The screen-picker dialog needs a real human click.** That is a browser rule; automation cannot press it. `tests/검사_진짜공유.mjs` gets around it with a browser launch flag, so that suite runs against a real screen-share stream with nothing stubbed.
4. **Sharing a screen that shows this window captures itself.** Every shot lengthens the step list, which changes the screen again. Measured, it settles after about 3 shots; if shots keep coming faster than that, auto-capture switches off and says why.
5. **There is no share-by-link.** There is no server. The standalone HTML export takes its place.
6. **No audio, no video.** Screenshots and text only.

## Run the tests

```bash
git clone https://github.com/svy04/showhow.git
cd showhow
node tests/검사_전체.mjs        # 75 tests, no browser needed

npm i -D playwright             # for the browser tests
npx playwright install msedge
node tests/검사_전부.mjs        # all 498
```

`tests/검사_브라우저_길.js` calls no internal function: it clicks the on-screen buttons, drops files onto the real file inputs, and presses the real keys — so a broken wire in between still fails the suite.

`tests/검사_브라우저_약속.js` checks the promises the UI makes — "the covered area is erased from the original too" is verified pixel by pixel, and "both screenshots are kept" by opening the produced PPTX, DOCX, Markdown and image zip.

`tests/검사_저장.mjs` reloads the page for real: it checks that the master copy is written even while you type without pausing, that steps you deleted stay deleted across a reload, and that a failed save never reports "saved".

`tests/검사_기능표.mjs` checks 34 features found in commercial tools against this source file, so the parity claim is verified by the file rather than by memory. 14 of them are ones the commercial tools were confirmed to charge for; for 13 the price could not be confirmed, and the test says so rather than counting them in our favour.

`tests/검사_요청대조.mjs` checks the seven things the original requester asked for — plus the two she gave up on as "probably too hard".

`tests/검사_진짜공유.mjs` stubs nothing: it captures a real window through real `getDisplayMedia`, and it reproduces the self-capture loop on purpose to prove the guard holds.

## Hack on it

Everything is in `index.html`. No build step, so edit it and reload the browser.

Three things come from outside. All of them are vendored into the repository rather than fetched from a CDN.

| What | From | Licence |
|---|---|---|
| Screen values (colour, type, spacing, radius) | MYCREAM design system | internal |
| 38 icons | picked from [Lucide](https://lucide.dev)'s 2,034 | ISC |
| Text reading (`ocr/`) | [Tesseract](https://github.com/naptha/tesseract.js) | Apache-2.0 |

## A manual made by this tool

Rather than describing it: **[showhow 쓰는 법](https://svy04.github.io/showhow/docs/showhow-%EC%93%B0%EB%8A%94%EB%B2%95.html)** (How to use showhow). That document was not written by hand — showhow captured it.

Two windows were opened, and one captured the other through a real screen share. Nothing was stubbed. Only the titles and descriptions were typed by a human.

![A document made by the tool](docs/8_만든문서.png)

Regenerate it yourself:

```bash
node tests/만들기_사용법.mjs     # two windows appear briefly
```

## Why this exists

On 17 August 2026 someone described what they wanted: capture screens, write a title and body, mark things up, organise into projects and sections, export to PDF and PPT, keep the original images separately, and save per-company templates. Free or open source, ideally.

One sentence set the direction: *"when I go back to edit it later, sometimes things are missing."*

## License

GPL-3.0-or-later.
