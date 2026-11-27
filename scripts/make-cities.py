# Usage: python3 scripts/make-cities.py cities15000.txt > src/layer/cities.ts
# The cities for the weather symbols layer (src/layer/weather-layer.ts),
# from GeoNames' cities15000 (every place of 15,000 people or more; CC BY
# 4.0, https://download.geonames.org/export/dump/, credited in the map
# attribution and About): all of 250,000 or more, every capital, and in
# the Nordic and Baltic countries everything from 15,000, so a zoomed-in
# view of Finland still has places. Biggest first (the layer takes the
# biggest that fit); city districts and near-duplicates left out.
import sys

NORDIC = {"FI", "SE", "NO", "DK", "IS", "EE", "AX", "FO", "GL"}
SKIP_CODES = {"PPLX", "PPLH", "PPLW", "PPLQ", "PPLCH"}

rows = []
with open(sys.argv[1], encoding="utf-8") as f:
    for line in f:
        c = line.rstrip("\n").split("\t")
        name, lat, lng, code, country = c[1], float(c[4]), float(c[5]), c[7], c[8]
        population = int(c[14] or 0)
        if code in SKIP_CODES:
            continue
        if population >= 250_000 or code == "PPLC" or (country in NORDIC and population >= 15_000):
            rows.append((population, name, lat, lng))
rows.sort(key=lambda row: -row[0])

kept = []
for row in rows:
    if any(abs(row[2] - k[2]) < 0.08 and abs(row[3] - k[3]) < 0.08 for k in kept):
        continue
    kept.append(row)

for _, name, _, _ in kept:
    assert ";" not in name and "`" not in name and "\\" not in name and "${" not in name, name

print("// Made by scripts/make-cities.py from GeoNames' cities15000 (CC BY 4.0):")
print("// name;latitude;longitude, one city a line, biggest first. Don't edit by hand.")
print()
print("export const CITIES = `" + "\n".join(f"{n};{la:.2f};{lo:.2f}" for _, n, la, lo in kept) + "`;")
