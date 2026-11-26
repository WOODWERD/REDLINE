# REDLINE

Mark up a PDF drawing set in the browser and send it back to WOODWERD.

Part of the Ctrl toolkit, a WOODWERD toolkit. Review group: drawing sets.

## For customers

1. Open the link WOODWERD sent you, then open the PDF you received (drag it onto the page or press **Open a PDF**).
2. Mark it up: Cloud, Box, Arrow, Callout, Pen, Highlight and Measure. Type what should change beside each markup.
3. Type your name and press **Download marked-up PDF**. Email that file back to WOODWERD.

Each markup is written into the PDF as a real comment, so it shows and lists in Bluebeam, Acrobat, Preview or any PDF viewer.

## Privacy

The PDF never leaves your computer. Nothing is uploaded and there is no account. Your markups are kept in this browser's storage until you clear it, so you can close the tab and come back by opening the same PDF again.

## How it is built

- One page, no build step. `redline.src.html` is the same page that runs as WOODWERD's private Redline on claude.ai; `build.sh` wraps it into `index.html` for GitHub Pages. Off claude.ai it runs in public mode.
- PDF rendering: pdf.js 3.11.174 (Apache-2.0). PDF writing: pdf-lib 1.17.1 (MIT). Fonts: Inter and JetBrains Mono (SIL OFL 1.1), bundled.
- Measurements use the PDF's own sheet size, so a full-size sheet measures true at its printed scale.

## Publishing

Settings → Pages → Deploy from a branch → `main` / root.
