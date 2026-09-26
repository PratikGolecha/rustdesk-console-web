#!/bin/sh
# Fetch the self-hostable RustDesk browser ("web") client and prepare it for
# being served at /webclient/ next to the console.
#
#   scripts/fetch-web-client.sh [DEST_DIR]        (default: public/webclient)
#
# Reproducible: the upstream archive is pinned by URL + SHA-256; the script
# refuses to continue when the checksum differs. Nothing is committed to git
# (public/webclient/ is git-ignored) - run this before `npm run build`, or
# against dist/ when bind-mounting a pre-built dist into nginx:
#   scripts/fetch-web-client.sh dist/webclient
#
# Source of the assets: the `resources/web` folder of the lejianwen/rustdesk-api
# release below. That folder is a Flutter-web build of the RustDesk client
# (flutter/web of github.com/rustdesk/rustdesk, AGPL-3.0) plus the TypeScript
# connection layer (js/src, included in the folder). See docs/WEB-CLIENT.md.
#
# Privacy patches applied after extraction (the stock build phones home):
#   1. index.html: drop the RustDesk Firebase Analytics initialisation
#      (`firebase.analytics()` would report every page view to Google).
#   2. js/dist/index.js: drop the start-up latency probe that opens WebSockets
#      to rs-sg/rs-cn/rs-us.rustdesk.com (the public RustDesk servers).
#   3. index.html: add a Content-Security-Policy that only allows same-origin
#      requests, WebSockets and the Roboto font, which blocks the Dart code's own Firebase
#      Analytics / Google Tag Manager / gstatic.com calls (removing the SDK
#      breaks the app).
#   4. CanvasKit (Flutter renderer, normally loaded from unpkg.com) is downloaded
#      once here, sha256-pinned, and served from canvaskit/ next to the client.
#   5. Add the AGPL notice file WEB-CLIENT-NOTICE.txt.
# Still contacted (allowed by the CSP, needed - text is blank without it): one Roboto
# font file from fonts.gstatic.com. Self-host it if that is unacceptable.
set -eu

VERSION="v2.7"
ARCHIVE="linux-amd64.tar.gz"
URL="https://github.com/lejianwen/rustdesk-api/releases/download/${VERSION}/${ARCHIVE}"
SHA256="d0689a353fd756815cfe560ce7cb98f764602de60d0403b51db4e5a9bd84d22a"
MEMBER="release/resources/web"
CK_BASE="https://unpkg.com/canvaskit-wasm@0.37.1/bin"
CK_JS_SHA256="c4de5e9fe0f6bff1f36eed04e68c6f65c12cc5af9b4b5e9cb4cd2d48dbcb6a66"
CK_WASM_SHA256="4bde01af0b438db774fcc060b07c0787bc67167831fcbc8c3c9157616dc6b330"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$ROOT/public/webclient}"
CACHE="${WEB_CLIENT_CACHE_DIR:-${TMPDIR:-/tmp}/rustdesk-web-client-cache}"
mkdir -p "$CACHE"
TARBALL="$CACHE/${VERSION}-${ARCHIVE}"

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
  else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

if [ -f "$TARBALL" ] && [ "$(sha256_of "$TARBALL")" != "$SHA256" ]; then
  rm -f "$TARBALL"
fi
if [ ! -f "$TARBALL" ]; then
  echo "Downloading $URL"
  if command -v curl >/dev/null 2>&1; then curl -fsSL -o "$TARBALL.part" "$URL"
  else wget -q -O "$TARBALL.part" "$URL"; fi
  mv "$TARBALL.part" "$TARBALL"
fi
GOT="$(sha256_of "$TARBALL")"
if [ "$GOT" != "$SHA256" ]; then
  echo "SHA-256 mismatch for $ARCHIVE: expected $SHA256, got $GOT" >&2
  rm -f "$TARBALL"
  exit 1
fi
echo "Checksum OK ($SHA256)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
tar -xzf "$TARBALL" -C "$TMP" "$MEMBER"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$TMP/$MEMBER/." "$DEST/"

fetch_pinned() { # name sha256
  f="$CACHE/canvaskit-0.37.1-$1"
  if [ -f "$f" ] && [ "$(sha256_of "$f")" != "$2" ]; then rm -f "$f"; fi
  if [ ! -f "$f" ]; then
    echo "Downloading $CK_BASE/$1"
    if command -v curl >/dev/null 2>&1; then curl -fsSL -o "$f.part" "$CK_BASE/$1"
    else wget -q -O "$f.part" "$CK_BASE/$1"; fi
    mv "$f.part" "$f"
  fi
  if [ "$(sha256_of "$f")" != "$2" ]; then
    echo "SHA-256 mismatch for canvaskit $1" >&2; rm -f "$f"; exit 1
  fi
  mkdir -p "$DEST/canvaskit"
  cp "$f" "$DEST/canvaskit/$1"
}
fetch_pinned canvaskit.js "$CK_JS_SHA256"
fetch_pinned canvaskit.wasm "$CK_WASM_SHA256"

# Files that are not needed at runtime (dev leftovers of the upstream build).
rm -f "$DEST/start-server.bat" "$DEST/web_deps.tar.gz" "$DEST/yarn.lock" \
  "$DEST/.gitignore" "$DEST/js/.gitignore" "$DEST/js/.gitattributes"

# Patches are exact-match and fail loudly: the input is pinned by SHA-256, so a
# non-match means this script and the pinned archive are out of sync.
node - "$DEST" <<'JS'
const fs = require('fs');
const path = require('path');
const dest = process.argv[2];

function patch(file, from, to) {
  const p = path.join(dest, file);
  const s = fs.readFileSync(p, 'utf8');
  const parts = s.split(from);
  if (parts.length !== 2) {
    console.error(`patch failed for ${file}: expected 1 match, got ${parts.length - 1}`);
    process.exit(1);
  }
  fs.writeFileSync(p, parts.join(to));
}

// 1. Firebase Analytics: keep the local SDK scripts (the app looks for a global
//    `firebase` and would otherwise download it from gstatic.com) but never
//    initialise the RustDesk analytics project (the Dart side still tries; see 3).
const idx = path.join(dest, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
const re = /\n<script>\s*\/\/ Your web app's Firebase configuration.*?firebase\.analytics\(\);\s*<\/script>/s;
if (!re.test(html)) {
  console.error('patch failed for index.html: firebase block not found');
  process.exit(1);
}
fs.writeFileSync(idx, html.replace(re, '\n<!-- Firebase analytics initialisation removed by fetch-web-client.sh -->'));

// 3. CSP + local CanvasKit. The Dart code initialises Firebase Analytics itself
//    (hard-coded RustDesk project), so instead of patching minified Dart we forbid
//    every cross-origin request except WebSockets: the analytics calls are blocked
//    by the browser. Removing the SDK instead breaks the app (verified).
html = fs.readFileSync(idx, 'utf8');
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; " +
  "connect-src 'self' ws: wss: blob: data: https://fonts.gstatic.com; img-src 'self' data: blob:; font-src 'self' data:; " +
  "style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; media-src 'self' blob: data:";
const head = '<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n' +
  '<script>window.flutterConfiguration={canvasKitBaseUrl:"canvaskit/"};</script>\n';
const anchor = '<script src="ogvjs-1.8.6/ogv.js"></script>';
if (!html.includes(anchor)) {
  console.error('patch failed for index.html: ogv anchor not found');
  process.exit(1);
}
fs.writeFileSync(idx, html.replace(anchor, head + anchor));

// 2. Latency probe against the public RustDesk servers.
patch('js/dist/index.js', '}nn();function ri(', '}function ri(');
JS

cat > "$DEST/WEB-CLIENT-NOTICE.txt" <<NOTICE
RustDesk web client - third-party assets
========================================
This directory is generated by scripts/fetch-web-client.sh; it is not part of the
console source tree.

Origin  : ${URL}
          (folder ${MEMBER}, sha256 of the archive: ${SHA256})
Derived from the RustDesk client, https://github.com/rustdesk/rustdesk
          (flutter/web + flutter/web/js), Copyright (C) Purslane Ltd., AGPL-3.0.
Corresponding source for the TypeScript layer is shipped in js/src; the Dart part
(main.dart.js) is built from flutter/ of the RustDesk repository. Licences of all
bundled libraries are listed in assets/NOTICES.

Local modifications (see the script): CSP added (blocks the built-in Firebase Analytics), start-up
probe of the public RustDesk servers removed, CanvasKit 0.37.1 (BSD-3-Clause)
bundled from unpkg.com/canvaskit-wasm instead of loaded at runtime.

The console (AGPL-3.0) serves these files unchanged otherwise. Under AGPL section 13
users interacting with this client over a network are entitled to the source above.
NOTICE

echo "Web client ready in $DEST ($(du -sh "$DEST" | cut -f1))"
