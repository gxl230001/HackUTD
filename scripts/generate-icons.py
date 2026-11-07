"""Generate placeholder PWA icons (magenta rounded square + white shield).

Uses Pillow, which is already available on the dev machine; it is NOT a
project dependency. Run: python3 scripts/generate-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

PRIMARY = (194, 0, 129)  # #c20081, matches --primary in globals.css
WHITE = (255, 255, 255)
ROOT = Path(__file__).resolve().parent.parent


def shield(draw: ImageDraw.ImageDraw, size: int, scale: float) -> None:
    """Draw a simple shield centered in the canvas. scale = glyph height / size."""
    h = size * scale
    w = h * 0.8
    cx, top = size / 2, (size - h) / 2
    pts = [
        (cx, top),
        (cx + w / 2, top + h * 0.12),
        (cx + w / 2, top + h * 0.48),
        (cx + w * 0.42, top + h * 0.68),
        (cx + w * 0.25, top + h * 0.86),
        (cx, top + h),
        (cx - w * 0.25, top + h * 0.86),
        (cx - w * 0.42, top + h * 0.68),
        (cx - w / 2, top + h * 0.48),
        (cx - w / 2, top + h * 0.12),
    ]
    draw.polygon(pts, fill=WHITE)
    # check mark in brand color
    lw = max(1, int(w * 0.11))
    check = [
        (cx - w * 0.22, top + h * 0.47),
        (cx - w * 0.05, top + h * 0.63),
        (cx + w * 0.24, top + h * 0.33),
    ]
    draw.line(check, fill=PRIMARY, width=lw, joint="curve")


def make(size: int, path: Path, maskable: bool = False, rounded: bool = True) -> None:
    ss = 4  # supersample for smoother edges
    big = size * ss
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable or not rounded:
        d.rectangle((0, 0, big, big), fill=PRIMARY)
    else:
        d.rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.22), fill=PRIMARY)
    # maskable icons keep the glyph inside the central 80% safe zone
    shield(d, big, 0.45 if maskable else 0.6)
    img = img.resize((size, size), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    print("wrote", path.relative_to(ROOT))


make(192, ROOT / "public/icons/icon-192.png")
make(512, ROOT / "public/icons/icon-512.png")
make(512, ROOT / "public/icons/maskable-512.png", maskable=True)
# Apple ignores transparency and applies its own rounding: use a full square.
make(180, ROOT / "public/icons/apple-touch-icon.png", rounded=False)
make(32, ROOT / "src/app/icon.png")
