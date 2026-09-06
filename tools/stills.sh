#!/bin/zsh
# Renders assets/stills/NN.webp (800×500) for the builds given as NN args, or for every entry in data/builds.js.
# Usage: tools/stills.sh            # all
#        tools/stills.sh 17 18      # just those
cd "$(dirname "$0")/.." || exit 1
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; mkdir -p assets/stills
list=$(node -e 'const b=require("./data/builds.js");for(const x of b)console.log(String(x.n).padStart(2,"0")+"\t"+x.file)')
[[ $# -gt 0 ]] && list=$(echo "$list" | grep -E "^($(echo $@ | sed 's/ /|/g'))\t")
echo "$list" | while IFS=$'\t' read -r nn file; do
  src="../showcase/$file"; [[ -f "$src" ]] || { echo "missing $src"; continue; }
  D=$(mktemp -d); png="$D/shot.png"
  "$C" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1600,1000 --virtual-time-budget=6000 --timeout=15000 --user-data-dir="$D/p" --screenshot="$png" "file://$PWD/$src" >/dev/null 2>&1 &
  P=$!; for i in $(seq 1 30); do sleep 1; [[ -s "$png" ]] && { a=$(stat -f%z "$png"); sleep 1; b=$(stat -f%z "$png"); [[ "$a" == "$b" ]] && break; }; done; kill $P 2>/dev/null; wait $P 2>/dev/null
  if [[ -s "$png" ]]; then
    python3 -c "from PIL import Image; im=Image.open('$png').convert('RGB').resize((800,500), Image.LANCZOS); im.save('assets/stills/$nn.webp','WEBP',quality=84,method=6); print('ok $nn ->', 'assets/stills/$nn.webp')"
  else echo "FAIL $nn"; fi
  rm -rf "$D"
done
