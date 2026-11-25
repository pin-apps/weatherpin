# Usage: python3 scripts/make-icons.py public
# Draws the app icon as PNGs (no image libraries): a white cloud and a yellow
# sun on the app's blue, supersampled for smooth edges. Also the link-preview
# picture (og-image.png, 1200×630) that chat apps and social sites show
# next to a shared link: the same drawing, large, on the app's blue (the
# site's name and description come as text from the page's tags).
import struct, sys, zlib

BLUE = (11, 99, 206)
SUN = (255, 210, 63)
WHITE = (255, 255, 255)

# Shapes in 0..1 units (same as public/favicon.svg, viewBox 0 0 100 100).
SUN_C = (0.63, 0.37, 0.17)
CLOUD = [(0.36, 0.62, 0.14), (0.52, 0.54, 0.19), (0.68, 0.63, 0.13)]
CLOUD_RECT = (0.22, 0.62, 0.81, 0.76)  # x0, y0, x1, y1 (bottom band)
CLOUD_RECT_R = 0.07

def in_circle(x, y, c):
    return (x - c[0]) ** 2 + (y - c[1]) ** 2 <= c[2] ** 2

def in_round_rect(x, y, r, rad):
    x0, y0, x1, y1 = r
    if not (x0 <= x <= x1 and y0 <= y <= y1):
        return False
    cx = min(max(x, x0 + rad), x1 - rad)
    cy = min(max(y, y0 + rad), y1 - rad)
    return (x - cx) ** 2 + (y - cy) ** 2 <= rad ** 2

def colour_at(x, y, rounded):
    if rounded and not in_round_rect(x, y, (0, 0, 1, 1), 0.22):
        return None  # transparent corner
    if any(in_circle(x, y, c) for c in CLOUD) or in_round_rect(x, y, CLOUD_RECT, CLOUD_RECT_R):
        return WHITE
    if in_circle(x, y, SUN_C):
        return SUN
    return BLUE

def png(size, rounded, path, ss=4, height=None, scale=1.0):
    # A wider picture (height given) has the drawing in its middle, at
    # `scale` times the picture's height; the rest is the background blue.
    width, height = size, height or size
    side = height * scale

    def colour(x, y):
        u = (x - (width - side) / 2) / side
        v = (y - (height - side) / 2) / side
        if 0 <= u <= 1 and 0 <= v <= 1:
            return colour_at(u, v, rounded)
        return BLUE

    rows = []
    for py in range(height):
        row = bytearray([0])
        for px in range(width):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    c = colour(px + (sx + 0.5) / ss, py + (sy + 0.5) / ss)
                    if c:
                        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            n = ss * ss
            a = acc[3] / n
            if a:
                row += bytes([round(acc[0] * 255 / acc[3]), round(acc[1] * 255 / acc[3]), round(acc[2] * 255 / acc[3]), round(a)])
            else:
                row += bytes(4)
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")
    open(path, "wb").write(data)

out = sys.argv[1]
# Home-screen icons are full squares: iOS and Android round the corners
# themselves (and "maskable" Android icons may be cut to any shape; the
# drawing stays inside the safe middle 80%).
png(180, False, f"{out}/apple-touch-icon.png")
png(192, False, f"{out}/icon-192.png")
png(512, False, f"{out}/icon-512.png")
# Small browser-tab fallback for browsers without SVG favicons: rounded.
png(32, True, f"{out}/favicon-32.png", ss=8)
# Link preview: 1200×630, the size Facebook, LinkedIn, X and chat apps use.
png(1200, False, f"{out}/og-image.png", ss=2, height=630, scale=0.9)
