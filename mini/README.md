# WOODWERD Mini Loop

WOODWERD Loop for images instead of PDFs: paste a screen grab (Fusion captures, renders), mark it up with the same tools and standards tags, and submit the markups to Claude.

Private claude.ai artifact: https://claude.ai/artifact/E55RJ7TZaXtxHcXYYqtWGJ (not part of the public GitHub Pages site).

## How it's built

`mini-loop.html` is generated from Loop's page source, not forked:

    python3 -I build-mini.py ../site/redline.html   # or the repo's redline.src.html

`build-mini.py` drops pdf.js and the PDF writer, rewords PDF/set text for images/versions, and appends `mini-image.js` (with `mini.css`) to the page. Its function declarations come last, so they replace Loop's PDF versions of `handleFile`, `openDoc`, `goPage`, `K`, `measureText`, `realInches`, `stdCheck`, `revReady` and `downloadMarked`. An image is shown through a one-page stand-in for a pdf.js document, so the rest of Loop runs unchanged. Every functional anchor is asserted, so a Loop change that moves one fails the build instead of shipping a broken page. Re-run after any Loop update and republish with `standards.js`, `fonts/` and `img/`.

## What's different from Loop

- **Paste**: Ctrl+V / ⌘V anywhere, or Paste from clipboard. Pasting or dropping while an image is open adds it as the next version (`prev` set, round v1 → v2, project, chat and scale copied).
- **Units**: markup `pts` are image pixels, origin top left. `scale` is -1 (not to scale, measures read in px) until **Set scale** calibrates it from a known length; then it is Loop's paper-inches-per-foot value and measures read in feet and inches. The doc row keeps `scale` and `scaleRef {px, inches}`.
- **Submit / Commit** also uploads the marked-up image as a PNG and stores its asset id as `markedAssetId` on the submission. The message to Claude says "Mini Loop SUBMIT EDITS on image …" and names that asset.
- **Download** saves a marked-up PNG. Build REV is hidden.
- Doc rows: `{name, kind: "image", round, assetId, pages: 1, w, h, mime, size, createdAt, touchedAt, source, project, chat, prev, scale}`.
