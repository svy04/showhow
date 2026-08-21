<img src="docs/표지.png" alt="showhow — the manual survives even when you forget to capture" width="100%">

# showhow

**The manual survives even when you forget to capture.** A single browser file that records your screen as you work and exports it as PDF or PowerPoint.

[한국어](README.md) · [Open it](https://svy04.github.io/showhow/) · [Download the file](https://github.com/svy04/showhow/raw/main/index.html)

- **Captures without a click.** Typing, keyboard shortcuts, dialogs opening, loading finishing — if the screen changes, it lands in the document.
- **One shot per change, taken when things settle.** A moving cursor or a playing video does not produce shots.
- **Brings back what it missed.** Recent frames stay in memory, so you can rewind and pull one out.
- **Exports to PDF, PPTX, a standalone HTML file, or raw images.** The PowerPoint file opens and edits like any other.
- **Cuts per audience.** Mark a section as excluded and it disappears from every export.
- **Screenshots never leave the machine.** No code in this file sends anything anywhere. It works offline.
- **Ships with 192 passing tests.** Run `node tests/검사_전부.mjs` yourself.

## Try it in 30 seconds

1. [Download index.html](https://github.com/svy04/showhow/raw/main/index.html), or just [open it here](https://svy04.github.io/showhow/).
2. Double-click it. Chrome or Edge.
3. Press **화면 찍기 시작** (Start capturing) and pick a screen to share — once.
4. Go back to work.

![First screen](docs/1_첫화면.png)

> The interface is Korean. It was built for a Korean request (see *Why this exists*), and the labels have not been translated yet.

## What is different

Most screenshot-based manual tools only take a picture **when you click.**

> "StepCapture records cursor clicks and drags, but does not capture non-click actions, such as text entry or keyboard shortcuts." — Snagit documentation

> "Recorded steps don't capture anything that's typed during the recording." — Microsoft Steps Recorder documentation

So steps go missing, and you only notice afterwards. Not because editing was late — because no picture was ever taken.

showhow watches **how much the screen changed** instead. It compares frames about 7 times a second and takes one shot when a change starts and then settles.

| While you | Click-based tools | showhow |
|---|---|---|
| press a button | captured | captured |
| type into a field | missed | captured |
| use a keyboard shortcut | missed | captured |
| wait for a dialog or a load | missed | captured |
| just move the cursor | captured (to be deleted) | ignored |
| play a video | captured repeatedly | ignored |

The longer the screen kept moving, the longer it must stay still before a shot is taken. That is why scrolling and video do not pile up shots.

## Shape it

![Steps](docs/2_단계.png)

The changed region gets a red outline, and the description field shows a faint hint like `오른쪽 아래 부분이 바뀌었습니다` ("the bottom-right area changed"). Hints are placeholders — they never reach the exported document.

Per step: draw boxes, arrows and numbered badges; blur what must be hidden; crop; merge with the step above or split into two; reorder; delete. Ctrl+Z undoes.

## Export it

![Export menu](docs/3_내보내기.png)

| Format | Use it when |
|---|---|
| PDF | printing, or sending something that looks identical everywhere |
| PPTX | presenting, or letting the recipient edit |
| One HTML file | sending something that opens on double-click, no software needed |
| Raw images | pasting the screenshots into another document |

The `.pptx` is written from scratch — ZIP container and OOXML parts, no library. PDF goes through browser printing, so Korean text stays selectable and searchable rather than becoming an image.

![Print layout](docs/5_인쇄.png)

## Templates and multiple manuals

Save a cover, an intro and a closing line as a template, then reuse it. Templates travel between machines as `.manualform.json` files.

Manuals are kept in a list. Open one, continue it, or duplicate it and edit the copy.

![Manual list](docs/4_목록.png)

## Where things are stored

| What | Where | Until |
|---|---|---|
| the document you are editing | browser storage | you clear browser data |
| your list of manuals | browser IndexedDB | the same |
| saved work files | a folder you chose | you delete them |

A banner appears when browser storage fills up. Export a work file and you are safe. Browser storage is not a backup.

## Four things to know

1. **Tested on Chrome and Edge.** Firefox and Safari were not run. To check one, open it there and walk through the same steps `tests/검사_촬영.mjs` performs.
2. **The screen-picker dialog needs a real human click.** That is a browser rule; automation cannot press it. The test suite substitutes only that dialog and runs everything below it for real — see the comment at the top of `tests/검사_촬영.mjs`.
3. **There is no share-by-link.** There is no server. The standalone HTML export takes its place.
4. **No audio, no video.** Screenshots and text only.

## Run the tests

```bash
git clone https://github.com/svy04/showhow.git
cd showhow
node tests/검사_전체.mjs        # 56 tests, no browser needed

npm i -D playwright             # for the browser tests
npx playwright install msedge
node tests/검사_전부.mjs        # all 192
```

`tests/검사_기능표.mjs` checks 18 features found in commercial tools against this source file, so the parity claim is verified by the file rather than by memory.

## Hack on it

Everything is in `index.html`. No build step, no dependencies. Edit it and reload the browser.

## Why this exists

On 17 August 2026 someone described what they wanted: capture screens, write a title and body, mark things up, organise into projects and sections, export to PDF and PPT, keep the original images separately, and save per-company templates. Free or open source, ideally.

One sentence set the direction: *"when I go back to edit it later, sometimes things are missing."*

## License

MIT.
