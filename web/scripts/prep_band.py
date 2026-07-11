#!/usr/bin/env python3
"""Prepare the WHOOP hero photo for the dark Connect stage.

Removes the light studio background in two passes so the band floats cleanly on
the dark hero:
  1. exterior background + its soft drop shadow — flood-filled inward from the
     image border through connected light pixels (can't leak into the dark band);
  2. the bright light seen *through* the band's loop opening — large enclosed
     bright regions, so the hero shows through the hole instead of a white blob.
The dark woven strap (whose highlights are never bright/large enough to qualify)
is preserved, then the cutout is feathered, trimmed and written as a PNG.

Usage:
    python3 web/scripts/prep_band.py IN.jpg [OUT.png]

Default OUT is web/public/whoop-band.png (what the hero auto-loads).
If the source already has a dark/transparent background it is left as-is.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

CAND_MIN = 140        # "light" — backdrop + grey shadow (strap is darker)
BRIGHT_MIN = 190      # "bright" — white backdrop seen through the loop opening
HOLE_FRAC = 0.01      # an enclosed bright region this big (of the image) is the hole
FEATHER = 1.1         # gaussian radius for a soft cutout edge
PAD = 44              # transparent padding around the trimmed subject


def looks_light_bg(im: Image.Image) -> bool:
    w, h = im.size
    for x, y in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]:
        r, g, b = im.getpixel((x, y))[:3]
        if min(r, g, b) < 200:
            return False
    return True


def border_labels(lbl: np.ndarray) -> np.ndarray:
    return np.unique(np.concatenate([lbl[0], lbl[-1], lbl[:, 0], lbl[:, -1]]))


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else (
        Path(__file__).resolve().parents[1] / "public" / "whoop-band.png"
    )
    im = Image.open(src).convert("RGBA")

    if not looks_light_bg(im):
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out)
        print(f"Source has a dark/transparent background — saved as-is → {out}")
        return 0

    arr = np.asarray(im)
    min_ch = arr[:, :, :3].astype(np.int16).min(axis=2)
    h, w = min_ch.shape
    conn8 = np.ones((3, 3), dtype=bool)

    # 1) exterior background + shadow: light region connected to the border
    cand = min_ch >= CAND_MIN
    seed = np.zeros_like(cand)
    seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    seed &= cand
    exterior = ndimage.binary_propagation(seed, mask=cand)

    # 2) loop opening: large, bright, enclosed (not border-touching) regions
    bright = min_ch >= BRIGHT_MIN
    lbl, n = ndimage.label(bright, structure=conn8)
    counts = np.bincount(lbl.ravel())
    on_border = np.zeros(counts.size, dtype=bool)
    on_border[border_labels(lbl)] = True
    keep_remove = (counts >= HOLE_FRAC * h * w) & (~on_border)
    keep_remove[0] = False
    hole = keep_remove[lbl]

    remove = exterior | hole
    alpha = np.where(remove, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(FEATHER))

    im.putalpha(alpha_img)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    if PAD:
        cw, ch = im.size
        canvas = Image.new("RGBA", (cw + 2 * PAD, ch + 2 * PAD), (0, 0, 0, 0))
        canvas.paste(im, (PAD, PAD), im)
        im = canvas

    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out)
    print(
        f"Removed exterior+shadow ({int(exterior.mean()*100)}%) and loop opening "
        f"({int(hole.mean()*100)}%) → {out}  ({im.size[0]}x{im.size[1]})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
