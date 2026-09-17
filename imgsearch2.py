import json, time, urllib.parse, urllib.request

TERMS = {
    "FLOWER POTS": "fountain firework",
    "GROUND CHAKKAR": "catherine wheel firework",
    "SINGLE SOUND": "firecrackers",
    "ROCKETS": "bottle rocket firework",
    "KIDS": "party popper",
    "SKY SHOT": "roman candle firework",
    "MULTI SHOT": "cake firework",
    "FOUNTAIN2": "fountain firework night",
    "CRACKER SHOP": "diwali firecracker shop",
    "GARLAND2": "firecracker string",
}

def search(term):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json",
        "generator": "search", "gsrsearch": f"filetype:bitmap {term}",
        "gsrnamespace": 6, "gsrlimit": 5,
        "prop": "imageinfo", "iiprop": "url|size",
        "iiurlwidth": 600,
    })
    url = "https://commons.wikimedia.org/w/api.php?" + q
    req = urllib.request.Request(url, headers={"User-Agent": "sundar-traders-build/1.0"})
    data = json.load(urllib.request.urlopen(req, timeout=30))
    pages = (data.get("query") or {}).get("pages") or {}
    out = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        out.append({
            "title": p.get("title", ""),
            "w": ii.get("width"), "h": ii.get("height"),
            "thumb": (ii.get("thumburl", "") or "").split("?")[0],
        })
    return out

allres = json.load(open("/home/machine01/Workspace/sundar-traders-crackers/imgsearch.json"))
for cat, term in TERMS.items():
    time.sleep(3)
    try:
        allres[cat] = search(term)
    except Exception as e:
        allres[cat] = [{"error": str(e)}]
    print("=" * 20, cat, "<-", term)
    for r in allres[cat]:
        print("  ", r.get("title"), r.get("w"), "x", r.get("h"))
        print("    ", r.get("thumb") or r.get("error"))

json.dump(allres, open("/home/machine01/Workspace/sundar-traders-crackers/imgsearch.json", "w"), indent=1)
