import json, urllib.parse, urllib.request

TERMS = {
    "SPARKLERS": "sparkler diwali",
    "FLOWER POTS": "flower pot firework anar",
    "GROUND CHAKKAR": "ground spinner firework",
    "SINGLE SOUND": "diwali crackers lakshmi",
    "ATOM BOMBS": "diwali bomb crackers",
    "ROCKETS": "diwali rocket firework",
    "TWINKLING STAR": "twinkling star firework",
    "PEACOCK FANCY": "peacock fountain firework",
    "KIDS FANCY": "kids fireworks pop popsnakes",
    "FOUNTAINS": "fountain firework diwali",
    "SPECIAL FANCY": "diwali fancy fireworks",
    "MEGA BOMB": "big bomb firecrackers",
    "GARLAND": "1000 wala garland crackers",
    "SKY SHOT": "roman candle sky shot",
    "MULTI SHOT": "multi shot cake fireworks",
    "GIFT BOX": "diwali fireworks gift box",
}

def search(term):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json",
        "generator": "search", "gsrsearch": f"filetype:bitmap {term}",
        "gsrnamespace": 6, "gsrlimit": 8,
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
            "thumb": ii.get("thumburl", ""), "url": ii.get("url", ""),
        })
    return out

allres = {}
for cat, term in TERMS.items():
    try:
        allres[cat] = search(term)
    except Exception as e:
        allres[cat] = [{"error": str(e)}]
    print("=" * 20, cat, "<-", term)
    for r in allres[cat]:
        print("  ", r.get("title"), r.get("w"), "x", r.get("h"))
        print("    ", r.get("thumb") or r.get("url") or r.get("error"))

json.dump(allres, open("/home/machine01/Workspace/sundar-traders-crackers/imgsearch.json", "w"), indent=1)
