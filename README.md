# Redline Ctrl

Mark up any PDF in the browser, then download it or share it back to whoever sent it.

Part of the Ctrl toolkit, a WOODWERD toolkit. Review group: drawing sets.

## For customers

1. Open the link you were sent, then open the PDF (drag it onto the page or press **Open a PDF**).
2. Mark it up: Cloud, Box, Arrow, Centerline, Dashed line, hatched Area, Remove (box with an X), Callout, Pen, Highlight and Measure. Type what should change beside each markup.
3. Type your name and press **Download marked-up PDF**. Send the file back however you like: email, text, a shared folder. On phones and some browsers a **Share** button sends it straight to Mail, Messages and other apps.

## Sending someone the link

`https://woodwerd.github.io/REDLINE/` works as is. To name who the file goes back to, add `?to=Name`, and add `&email=address` for an **Email** button that opens a message to that address (the person attaches the downloaded PDF). Example: `https://woodwerd.github.io/REDLINE/?to=Drew&email=you@example.com`.

Each markup is written into the PDF as a real comment, so it shows and lists in Bluebeam, Acrobat, Preview or any PDF viewer.

## WOODWERD Loop

The same page can run inside your own Claude account as WOODWERD Loop, a review cycle where Claude works your markups and issues the next revision. Setup and the skill download: [loop/](https://woodwerd.github.io/REDLINE/loop/). The skill source is `loop/woodwerd-loop/SKILL.md`.

## Optional: your own GitHub

Press **Connect GitHub** on the start page to open PDFs straight from a private repository and save marked-up copies back to it. Each save is a commit beside the original, so you keep the history. Use a [fine-grained token](https://github.com/settings/personal-access-tokens/new) limited to that one repository with **Contents: Read and write**. The token stays in your browser (for this tab only, unless you tick *Remember on this device*) and is only ever sent to `api.github.com`.

## Privacy

The PDF never leaves your computer. Nothing is uploaded and there is no account. Your markups are kept in this browser's storage until you clear it, so you can close the tab and come back by opening the same PDF again.

## How it is built

- One page, no build step. `redline.src.html` is the same page that runs as WOODWERD Loop on claude.ai (Drew's private review cycle with Claude); `build.sh` wraps it into `index.html` for GitHub Pages. Off claude.ai it runs in public mode.
- PDF rendering: pdf.js 3.11.174 (Apache-2.0). PDF writing: pdf-lib 1.17.1 (MIT). Fonts: Inter and JetBrains Mono (SIL OFL 1.1), bundled.
- Measurements use the PDF's own sheet size, so a full-size sheet measures true at its printed scale.

## Publishing

Settings → Pages → Deploy from a branch → `main` / root.
