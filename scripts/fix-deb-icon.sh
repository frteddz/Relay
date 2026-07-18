#!/bin/bash
# Fix .deb icon directory from 0x0 to actual size
DEB="$(realpath "$1" 2>/dev/null || echo "$1")"
if [ ! -f "$DEB" ]; then
  echo "Usage: $0 <path-to.deb>"
  exit 1
fi

WORK=$(mktemp -d)
cd "$WORK"
ar x "$DEB"
mkdir data
tar -xf data.tar.xz -C data 2>/dev/null || tar -xf data.tar.gz -C data 2>/dev/null

ICON_DIR=$(find data/usr/share/icons -type d -name "0x0" 2>/dev/null)
if [ -z "$ICON_DIR" ]; then
  echo "No 0x0 icon directory found, nothing to fix"
  rm -rf "$WORK"
  exit 0
fi

python3 -c "
from PIL import Image
from pathlib import Path
import shutil
icon_dir = Path('$ICON_DIR')
for png in icon_dir.rglob('*.png'):
    img = Image.open(png)
    s = img.size[0]
    dst = icon_dir.parent / f'{s}x{s}' / png.relative_to(icon_dir).parent
    dst.mkdir(parents=True, exist_ok=True)
    shutil.copy2(png, dst / png.name)
    print(f'Moved {png.name} to {s}x{s}')
shutil.rmtree(icon_dir)
"

rm -f data.tar.xz data.tar.gz
tar cf - -C data . 2>/dev/null | xz -0 > data.tar.xz 2>/dev/null
ar rcs "$DEB" debian-binary control.tar.gz data.tar.xz 2>/dev/null
rm -rf "$WORK"
echo "Fixed icon in $DEB"
