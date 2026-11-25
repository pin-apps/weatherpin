# Usage: python3 scripts/make-land-mask.py ne_50m_land.geojson > src/places/land-mask.ts
# The rough land map for "Random place" (src/places/random-place.ts): which
# 0.5° squares of the Earth are land, from Natural Earth's 1:50m land
# polygons (public domain; https://www.naturalearthdata.com/, the GeoJSON
# from github.com/nvkelso/natural-earth-vector, geojson/ne_50m_land.geojson).
# A square counts as land if its centre is. Latitudes 75° N to 60° S: no
# polar ice caps. Each row (north to south) is run lengths in hex,
# alternating sea and land, starting with sea.
import json, sys

STEP = 0.5
NORTH, SOUTH = 75, -60

data = json.load(open(sys.argv[1]))
edges = []
for feature in data["features"]:
    geometry = feature["geometry"]
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    for polygon in polygons:
        for ring in polygon:
            for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
                if y1 != y2:
                    edges.append((x1, y1, x2, y2))

def land_row(lat):
    # Where the line of latitude crosses the coasts; inside between pairs.
    xs = sorted(
        x1 + (lat - y1) * (x2 - x1) / (y2 - y1)
        for x1, y1, x2, y2 in edges
        if (y1 <= lat < y2) or (y2 <= lat < y1)
    )
    cols = int(360 / STEP)
    row = [0] * cols
    for a, b in zip(xs[::2], xs[1::2]):
        for c in range(cols):
            if a <= -180 + (c + 0.5) * STEP < b:
                row[c] = 1
    return row

rows = []
for i in range(int((NORTH - SOUTH) / STEP)):
    row = land_row(NORTH - (i + 0.5) * STEP)
    runs, current, length = [], 0, 0
    for value in row:
        if value == current:
            length += 1
        else:
            runs.append(length)
            current, length = value, 1
    runs.append(length)
    rows.append(",".join(format(n, "x") for n in runs))

print("// Made by scripts/make-land-mask.py from Natural Earth (public domain).")
print("// Do not edit by hand. See that script for the format.")
print()
print(f"export const STEP = {STEP};")
print(f"export const NORTH = {NORTH};")
print(f"export const SOUTH = {SOUTH};")
print()
print("export const LAND_ROWS =")
# Several string pieces so the file stays readable in an editor.
for i in range(0, len(rows), 10):
    piece = ";".join(rows[i : i + 10]) + (";" if i + 10 < len(rows) else "")
    end = " +" if i + 10 < len(rows) else ";"
    print(f"  '{piece}'{end}")
