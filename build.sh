#!/bin/sh
# Wraps the shared page source (the same file the claude.ai version publishes) into a standalone index.html.
cd "$(dirname "$0")"
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="Mark up a PDF in your browser, then download it or share it back. Nothing is uploaded.">\n<meta name="robots" content="noindex">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n</head>\n<body>\n'; sed "s#<title>WOODWERD Loop</title>#<title>WOODWERD Redline</title>#" redline.src.html; printf '\n</body>\n</html>\n'; } > index.html
