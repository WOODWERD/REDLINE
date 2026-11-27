#!/usr/bin/env python3
"""Build WOODWERD Mini Loop from the WOODWERD Loop page source.

Mini Loop is Loop for images (screen grabs, Fusion captures, renders) instead of PDFs.
It is generated, not forked: this script reads Loop's source (redline/site/redline.html),
swaps the PDF parts for an image shim and the paste/calibrate/PNG features in mini-image.js,
and writes mini-loop.html beside it. When Loop changes, run this again so Mini Loop keeps
every new tool, the standards tagging and the submit flow.

  python3 -I build-mini.py [path/to/redline.html]

Every functional replacement is asserted, so a Loop change that moves an anchor fails loudly
instead of building a broken page.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "site" / "redline.html"
OUT = HERE / "mini-loop.html"
s = SRC.read_text(encoding="utf-8")


def rep(old, new, count=None, required=True):
    """Replace old with new. required: fail if missing. count: expected number of hits."""
    global s
    n = s.count(old)
    if required and n == 0:
        sys.exit(f"anchor not found: {old[:90]!r}")
    if count is not None and n != count:
        sys.exit(f"anchor found {n}x, expected {count}: {old[:90]!r}")
    s = s.replace(old, new)


def rex(pat, new, required=True, flags=re.S):
    global s
    s2, n = re.subn(pat, new, s, flags=flags)
    if required and n == 0:
        sys.exit(f"pattern not found: {pat[:90]!r}")
    s = s2


# ---------- identity ----------
rep("<title>WOODWERD Loop</title>", "<title>WOODWERD Mini Loop</title>", 1)
rep('<h1><span class="claude-only">LOOP</span>', '<h1><span class="claude-only">MINI LOOP</span>', 1)
rep("Mark up a drawing set and send the markups to Claude.",
    "Paste a screen grab, mark it up, and send the markups to Claude.", 1)
rep('<span class="nm"><span class="claude-only">Loop</span>',
    '<span class="nm"><span class="claude-only">Mini Loop</span>', 1)
rep("Review a drawing set with Claude: mark up, submit, get the next rev.",
    "Review a screen grab or render with Claude: paste, mark up, submit.", 1)

# ---------- scripts: no pdf.js or PDF writer; add the image module before the boot block ----------
rep('<script src="vendor/pdf.min.js"></script>\n', "", 1)
rep('<script src="redline-export.js"></script>\n', "", 1)
rep('if(!pdfLib())live("fault","PDF reader didn\'t load. Reload the page.");', "", 1)
mini = (HERE / "mini-image.js").read_text(encoding="utf-8")
# appended after everything else so these declarations come last and win over Loop's
i = s.rindex("</script>")
s = s[:i] + mini + "\n" + s[i:]

# ---------- styles ----------
css = (HERE / "mini.css").read_text(encoding="utf-8")
rep("</style>", css + "\n</style>", 1)

# ---------- library ----------
rep("Every set you have redlined. Open one, or drop a new PDF.",
    "Every image you have looped. Paste a screen grab, or drop an image.", 1)
rep("<strong>Drop a PDF here</strong>", "<strong>Paste or drop an image</strong>", 1)
rep("Any drawing set or document. It is stored with this page so you and Claude open the same file, and the markups stay with it.",
    "Press <b>Ctrl+V</b> (<b>⌘V</b> on a Mac) anywhere on this page to paste a screen grab, or drop a PNG or JPG. It is stored with this page so you and Claude open the same image, and the markups stay with it.", 1)
rep('<span class="btn" role="button" tabindex="0" id="choose">Open a PDF</span>',
    '<span class="drow-btns"><span class="btn primary-ish" role="button" tabindex="0" id="pastebtn">Paste from clipboard</span>'
    '<span class="btn" role="button" tabindex="0" id="choose">Open an image</span></span>', 1)
rep('accept="application/pdf,.pdf"', 'accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"', 1)
rep('<li>Attach the PDF in any chat with Claude and say <b>“redline this”</b>.</li>',
    '<li>In a chat, ask Claude for a render or capture and say <b>“mini loop this”</b>, or attach your own image. Or paste a screen grab straight onto this page.</li>', 1)
rep("<li>Claude adds it here and replies with a link straight to page one.</li>",
    "<li>Claude adds it here and replies with a link straight to it.</li>", 1)
rep("press <b>Commit changes</b> for the next set.", "press <b>Commit changes</b> for the next version.", required=False)
rep('<div class="dropveil" id="veil" hidden><div>Drop the PDF to open it</div></div>',
    '<div class="dropveil" id="veil" hidden><div>Drop the image to open it</div></div>', 1)
rex(r'window\.addEventListener\("drop",e=>\{.*?\}\);\n',
    'window.addEventListener("drop",e=>{e.preventDefault();dragDepth=0;$("#veil").hidden=true;const f=[...(e.dataTransfer?.files||[])].find(isImg);'
    'if(f)handleFile(f,S.doc?{prev:S.doc}:null);else if(e.dataTransfer?.files?.length)libMsg("That file isn\'t an image. Drop a PNG or JPG.",true)});\n')
rep('${d.pages||"?"} page${d.pages===1?"":"s"} · ${stored}', '${d.w&&d.h?d.w+" × "+d.h+" px":"Image"} · ${stored}', 1)
rep('el("div",{style:"min-width:0"},el("div",{class:"nm",text:d.name||"Untitled PDF"})',
    'libThumb(d),el("div",{style:"min-width:0"},el("div",{class:"nm",text:d.name||"Untitled image"})', 1)
rep('el("span",{text:"Set"}),el("span",{text:d.round||"—"})', 'el("span",{text:"Version"}),el("span",{text:d.round||"—"})', 1)
rep('text:PUBLIC?"Open":"Open set"', 'text:"Open"', 1)
rep('title:"Open the chat working on this set"', 'title:"Open the chat working on this image"', required=False)

rep('<h2>Documents</h2>', '<h2>Images</h2>', 1)
rep('`${docs.length} document${docs.length===1?"":"s"}`', '`${docs.length} image${docs.length===1?"":"s"}`', required=False)
rep("No documents yet.", "No images yet.", required=False)
rep("Drop a PDF above to start the first review.", "Paste a screen grab to start the first loop.", required=False)
rep("The quickest way to kick off a review on a new set.", "The quickest way to loop on a render Claude makes.", required=False)

# ---------- document view ----------
rep('<label for="round">Set</label><input id="round" placeholder="X1.0" autocomplete="off">',
    '<label for="round">Version</label><input id="round" placeholder="v1" autocomplete="off">', 1)
rex(r'<select id="scale">.*?</select>',
    '<select id="scale"><option value="-1" selected>Not to scale</option></select>'
    '<button class="btn" id="calbtn" type="button" title="Draw along something whose real length you know">Set scale</button>')
rep('<h2>Pages</h2>', '<h2>Image</h2>', 1)
rep('"Untitled PDF"', '"Untitled image"')
rep('text:"Open a PDF",onclick:()=>$("#file").click()', 'text:"Open an image",onclick:()=>$("#file").click()', 1)
rep("Download marked-up PDF", "Download marked-up PNG")
rep('measure:"Drag between two points. Set the drawing scale first. Hold Shift to snap to 45°."',
    'measure:"Drag between two points. Press Set scale first so it reads in feet and inches. Hold Shift to snap to 45°."', 1)
rep("async function create(o){", "async function create(o){if(calHook(o))return;", 1)

# ---------- what Claude is told on Submit / Commit ----------
rep('Loop SUBMIT EDITS on "', 'Mini Loop SUBMIT EDITS on image "', 1)
rep('Loop COMMIT CHANGES on "', 'Mini Loop COMMIT CHANGES on image "', 1)
rep('let told=false,why="";', 'let told=false,why="";const FLAT=await miniFlat(sid);', 1)
rep('    if(d.length)text+=`\\n${d.length} new markup',
    '    if(FLAT)text+=` Marked-up image: asset ${FLAT}.`;\n    if(d.length)text+=`\\n${d.length} new markup', 1)
rep("Draw the approved changes and issue the next set;",
    "Make the approved changes and deliver the next image version;", 1)
rep("Claude draws the approved changes and issues the next set.",
    "Claude makes the approved changes and sends the next version.", required=False)
rep("will draw the next set.", "will send the next version.", required=False)

# ---------- wording: sets -> versions ----------
for a, b in [("the next set", "the next version"), ("The next set", "The next version"),
             ("the new set", "the new version"), ("next set on ", "next version on "),
             ("drawing the approved changes", "making the approved changes")]:
    rep(a, b, required=False)

# ---------- guide ----------
rex(r'<h3>Start a review</h3>\s*<p>.*?</p>\s*<p>The same file.*?</p>',
    '<h3>Start a review</h3>\n        <p>Take a screen grab (on a Mac, <b>⌘⇧4</b> then hold <b>Control</b> as you drag puts it on the clipboard; on Windows, <b>Win+Shift+S</b>), then press <b>Ctrl+V</b> or <b>⌘V</b> on this page. You can also drop a PNG or JPG, or ask Claude in a chat to “mini loop this”.</p>\n'
    '        <p>Paste while an image is open and the grab becomes its next version (v1, v2…), so a fix in Fusion is one grab away from the next round.</p>')
rex(r'<p style="margin-top:8px">Measurements use the PDF.*?</p>',
    '<p style="margin-top:8px">Screen grabs have no scale until you set one. Press <b>Set scale</b>, drag along something whose length you know, and type it (36", 3\'-0" or 914mm). Measures then read in feet and inches and tagged ones are checked. Perspective views do not measure true; use an orthographic view.</p>', required=False)
rex(r'<p><b>Download marked-up PNG</b> writes your markups into a copy of the PDF as real comments.</p>',
    '<p><b>Download marked-up PNG</b> saves the image with your markups drawn on it.</p>', required=False)

OUT.write_text(s, encoding="utf-8")
left = [w for w in ("pdfjsLib.getDocument", "WWExport.exportPdf") if w in s]
print(f"wrote {OUT} ({len(s):,} bytes) from {SRC.name}; inert PDF code left: {left}")
