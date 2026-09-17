import json, os, urllib.request

SEARCH = json.load(open("/home/machine01/Workspace/sundar-traders-crackers/imgsearch.json"))

WANT = {
    "sparklers.jpg": "Fireworks Sparklers Diwali India.jpg",
    "chakkar.jpg": "Rotating Catherine wheel.jpg",
    "fountain.jpg": "Beautiful large flower cracker creating brilliant light and sparkles at night.jpg",
    "string.jpg": "Firecracker String.jpg",
    "bomb.jpg": "Firecracker 20230401.jpg",
    "rocket.jpg": "Skyrocket Start2.jpg",
    "kids.jpg": "Party popper-Tamil Nadu.jpg",
    "skyshot.jpg": "Romancandle.png",
    "cake.jpg": "Firework fan cake 100 shots.jpg",
    "giftbox.jpg": "Firecracker shop on Diwali.jpg",
    "fancy.jpg": "Diwali damaka.jpg",
}

# index all found files by title
by_title = {}
for results in SEARCH.values():
    for r in results:
        t = (r.get("title") or "").replace("File:", "")
        if t and (r.get("thumb") or r.get("url")):
            by_title[t] = r.get("thumb") or r.get("url")

outdir = "/home/machine01/Workspace/sundar-traders-crackers/site/assets"
os.makedirs(outdir, exist_ok=True)
credit = {}
for fname, title in WANT.items():
    url = by_title.get(title)
    assert url, f"not found: {title}"
    dest = os.path.join(outdir, fname)
    req = urllib.request.Request(url, headers={"User-Agent": "sundar-traders-build/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp, open(dest, "wb") as f:
        f.write(resp.read())
    size = os.path.getsize(dest)
    print(fname, size, "bytes <-", title)
    credit[fname] = {"title": title, "url": url,
                     "page": "https://commons.wikimedia.org/wiki/File:" + title.replace(" ", "_")}

json.dump(credit, open(os.path.join(outdir, "credits.json"), "w"), indent=1)
print("credits written")
