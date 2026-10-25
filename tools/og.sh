#!/bin/zsh
# Renders og/<key>.png for every entry in tools/og-jobs.json (written by build.js) + og/icon.png.
# Needs the preview server on :8746 (python3 -m http.server from the site root) and Chrome.
cd "$(dirname "$0")/.." || exit 1
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; mkdir -p og
WM=$(node -e "const s=require('./data/site.js');process.stdout.write(s.wordmark.a+'|'+s.wordmark.x+'|'+s.wordmark.b)")
shot(){ D=$(mktemp -d); rm -f "$2"
  "$C" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=${3:-1200},${4:-630} --virtual-time-budget=4000 --user-data-dir="$D" --screenshot="$2" "$1" >/dev/null 2>&1 &
  P=$!; for i in $(seq 1 40); do sleep .5; [[ -f "$2" ]] && { a=$(stat -f%z "$2"); sleep .4; b=$(stat -f%z "$2"); [[ "$a" == "$b" && "$a" -gt 5000 ]] && break; }; done
  kill -9 $P 2>/dev/null; wait $P 2>/dev/null; rm -rf "$D"; }
node -e '
const jobs=require("./tools/og-jobs.json");const enc=encodeURIComponent;
for(const j of jobs) console.log(j.key+"\t"+"http://localhost:8746/tools/og.html?wm="+enc(process.argv[1])+"&t="+enc(j.title)+"&k="+enc(j.kicker||"")+"&s="+enc(j.sub||"")+(j.colour?"&c="+enc(j.colour):"")+(j.phone?"&p="+enc(j.phone):""));
' "$WM" | while IFS=$'\t' read -r key url; do shot "$url" "og/$key.png"; [[ -f "og/$key.png" ]] && echo "ok $key" || echo "FAIL $key"; done
# icon: 512×512, the s-monogram (favicon, home-screen and manifest icon)
shot "http://localhost:8746/tools/logo.html?v=mono&wm=$WM" "og/icon.png" 512 512; echo "icon $( [[ -f og/icon.png ]] && echo ok || echo FAIL )"
# LinkedIn: the Company Page logo, the personal profile banner and the Company Page cover
shot "http://localhost:8746/tools/logo.html?v=word&wm=$WM" "og/linkedin-logo.png" 400 400; echo "linkedin-logo $( [[ -f og/linkedin-logo.png ]] && echo ok || echo FAIL )"
shot "http://localhost:8746/tools/linkedin.html?f=profile&wm=$WM" "og/linkedin-banner.png" 1584 396; echo "linkedin-banner $( [[ -f og/linkedin-banner.png ]] && echo ok || echo FAIL )"
shot "http://localhost:8746/tools/linkedin.html?f=page&wm=$WM" "og/linkedin-cover.png" 1512 256; echo "linkedin-cover $( [[ -f og/linkedin-cover.png ]] && echo ok || echo FAIL )"
# compress: PNG → keep as PNG but strip to 8-bit palette via sips is lossy; keep PNG, they are ~200KB each
echo "done: $(ls og | wc -l | tr -d ' ') images"
