#!/usr/bin/env python3
"""
Generates the NexVora AI Workspace brand assets (launcher icons, adaptive icon layers, splash logo,
in-app wordmarks, base64 logo modules). Re-run from the project root after changing the design:

    python3 scripts/brand/generate-brand-assets.py

Requires: Pillow, numpy. Fonts: DejaVu Sans (any bold sans TTF works - change FONT_BOLD/FONT_REG).
"""
import base64, io, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RES = os.path.join(ROOT, 'android/app/src/main/res')
CYAN = (0x22, 0xD3, 0xEE)
VIOLET = (0x8B, 0x5C, 0xF6)
BG = (0x09, 0x0B, 0x14)
TEXT = (0xF8, 0xFA, 0xFC)
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SS = 4  # supersampling factor


def shape_mask(px, box):
    """Mask of the NexVora 'N' mark. Coordinates are in a 108-unit adaptive-icon grid; `box` is the
    (x0, y0, x1, y1) region of that grid mapped onto the px*px canvas."""
    big = px * SS
    x0, y0, x1, y1 = box
    sx, sy = big / (x1 - x0), big / (y1 - y0)
    T = lambda x, y: ((x - x0) * sx, (y - y0) * sy)
    m = Image.new('L', (big, big), 0)
    d = ImageDraw.Draw(m)
    d.polygon([T(33, 30), T(41.5, 30), T(41.5, 78), T(33, 78)], fill=255)          # left bar
    d.polygon([T(66.5, 44), T(75, 44), T(75, 78), T(66.5, 78)], fill=255)          # right bar
    d.polygon([T(33, 30), T(42.5, 30), T(75, 78), T(65.5, 78)], fill=255)          # diagonal
    cx, cy = T(70.75, 33.5); r = 5.2 * sx
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)                           # "node" dot
    return m.resize((px, px), Image.LANCZOS)


def gradient(px, c0=CYAN, c1=VIOLET):
    y, x = np.mgrid[0:px, 0:px].astype(np.float32)
    t = ((x + y) / (2 * (px - 1)))[..., None]
    a, b = np.array(c0, np.float32), np.array(c1, np.float32)
    return Image.fromarray((a * (1 - t) + b * t).astype(np.uint8), 'RGB')


def mark(px, box=(0, 0, 108, 108), color=None):
    m = shape_mask(px, box)
    fill = Image.new('RGB', (px, px), color) if color else gradient(px)
    out = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    out.paste(fill, (0, 0), m)
    return out


def background(px):
    y, x = np.mgrid[0:px, 0:px].astype(np.float32) / (px - 1)
    base = np.zeros((px, px, 3), np.float32) + np.array(BG, np.float32)
    def glow(cx, cy, col, strength, rad):
        d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / rad
        a = np.clip(1 - d, 0, 1)[..., None] ** 2 * strength
        return a * np.array(col, np.float32)
    img = base + glow(0.15, 0.1, CYAN, 0.35, 0.85) + glow(0.9, 0.95, VIOLET, 0.45, 0.9)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')


def rounded(img, radius_frac=0.22):
    px = img.size[0]
    m = Image.new('L', (px * SS, px * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, px * SS - 1, px * SS - 1], radius=int(px * SS * radius_frac), fill=255)
    m = m.resize((px, px), Image.LANCZOS)
    out = Image.new('RGBA', (px, px), (0, 0, 0, 0)); out.paste(img, (0, 0), m)
    return out


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)


def wordmark(w, h, text_color, with_ai=True):
    """Mark + 'NexVora' (bold) + 'AI Workspace' (regular) on a transparent canvas of w x h."""
    S = 4
    img = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
    pad = int(h * S * 0.06)
    mh = h * S - 2 * pad
    # tight box around the N + dot so the mark fills its square
    mk = mark(mh, box=(27, 22.5, 81, 82))
    img.alpha_composite(mk, (pad, pad))
    x = pad + mh + int(h * S * 0.22)
    avail = w * S - x - pad
    d = ImageDraw.Draw(img)
    size = int(h * S * 0.52)
    while True:  # shrink the text until "NexVora AI Workspace" fits the canvas
        f1 = ImageFont.truetype(FONT_BOLD, size)
        f2 = ImageFont.truetype(FONT_REG, size)
        gap = int(size * 0.3)
        total = d.textlength('NexVora', font=f1) + (gap + d.textlength('AI Workspace', font=f2) if with_ai else 0)
        if total <= avail or size < 8:
            break
        size -= 2
    asc, desc = f1.getmetrics()
    ty = (h * S - (asc + desc)) // 2
    d.text((x, ty), 'NexVora', font=f1, fill=text_color + (255,))
    x += int(d.textlength('NexVora', font=f1)) + gap
    if with_ai:
        d.text((x, ty), 'AI Workspace', font=f2, fill=text_color + (190,))
    return img.resize((w, h), Image.LANCZOS)


def b64(img):
    buf = io.BytesIO(); img.save(buf, 'PNG', optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def main():
    # --- launcher icons -------------------------------------------------
    dens = {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}
    for name, (legacy, layer) in dens.items():
        d = os.path.join(RES, f'mipmap-{name}')
        save(background(layer), os.path.join(d, 'ic_launcher_background.png'))
        save(mark(layer), os.path.join(d, 'ic_launcher_foreground.png'))
        save(mark(layer, color=(255, 255, 255)), os.path.join(d, 'ic_launcher_monochrome.png'))
        # legacy (API < 26): background + mark, cropped to the adaptive "visible" 72-unit window, rounded
        bgc = background(legacy)
        fg = mark(legacy, box=(18, 18, 90, 90))
        bgc.alpha_composite(fg)
        save(rounded(bgc), os.path.join(d, 'ic_launcher.png'))
    # --- splash logo (transparent) -------------------------------------------------
    save(mark(384, box=(27, 22.5, 81, 82)), os.path.join(RES, 'drawable-nodpi/splash_logo.png'))
    # --- in-app logos -------------------------------------------------
    L = os.path.join(ROOT, 'src/assets/logo')
    save(wordmark(704, 99, TEXT), os.path.join(L, 'nexvora.png'))
    save(wordmark(947, 112, (0x0B, 0x10, 0x20)), os.path.join(L, 'nexvora-dark.png'))
    icon = background(1024); icon.alpha_composite(mark(1024, box=(18, 18, 90, 90))); save(rounded(icon), os.path.join(L, 'nexvora-icon.png'))
    small = Image.new('RGBA', (35, 22), (0, 0, 0, 0)); small.alpha_composite(mark(22, box=(27, 22.5, 81, 82)), (6, 0))
    save(small, os.path.join(L, 'nexvora-infinity.png'))
    # --- base64 modules used by PDF/DOCX/PPTX exporters -------------------------------------------------
    dark = wordmark(1200, 300, (0x0B, 0x10, 0x20))
    light = wordmark(704, 99, TEXT)
    open(os.path.join(ROOT, 'src/utils/chat/export/pdf/logo.ts'), 'w').write(
        "/**\n * NexVora AI Workspace wordmark (dark text, transparent background, 1200x300) as a base64 PNG.\n"
        " * Baked in as a constant so the exporters can embed it without touching the native asset pipeline\n"
        " * (bundled images are not readable as files in release builds).\n *\n"
        " * Regenerate with: python3 scripts/brand/generate-brand-assets.py\n */\n"
        "export const NEXVORA_LOGO_PNG_BASE64 =\n  '" + b64(dark) + "';\n")
    open(os.path.join(ROOT, 'src/utils/documents/logoLight.ts'), 'w').write(
        "/**\n * NexVora AI Workspace wordmark (light text, transparent background, 704x99) as a base64 PNG - the counterpart\n"
        " * of the dark-text mark in `@/utils/chat/export/pdf/logo.ts`, for branding dark slide backgrounds.\n"
        " * Regenerate with: python3 scripts/brand/generate-brand-assets.py\n */\n"
        "export const NEXVORA_LOGO_LIGHT_PNG_BASE64 =\n  '" + b64(light) + "';\n")
    # --- store / README artwork -------------------------------------------------
    store = background(512); store.alpha_composite(mark(512, box=(18, 18, 90, 90))); save(rounded(store), os.path.join(ROOT, 'images/nexvora-icon-512.png'))
    print('brand assets written')


if __name__ == '__main__':
    main()
