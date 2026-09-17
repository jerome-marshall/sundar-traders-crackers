import json

CAT_IMG = {
    "SPARKLERS": "sparklers.jpg",
    "TWINKLING STAR": "sparklers.jpg",
    "FLOWER POTS": "fountain.jpg",
    "WOUNDERFULL FOUNTAINS": "fountain.jpg",
    "PEACOCK FANCY": "fountain.jpg",
    "GROUND CHAKKAR": "chakkar.jpg",
    "SINGLE SOUND": "string.jpg",
    "MULTI SOUND CRACKERS (MOTHERS)": "string.jpg",
    "ATOM BOMBS": "bomb.jpg",
    "MEGA BOMB": "bomb.jpg",
    "ROCKETS": "rocket.jpg",
    "KIDS FANCY": "kids.jpg",
    "KIDS FAVORITES": "kids.jpg",
    "SINGLE SKY SHOT": "skyshot.jpg",
    "FANTACY SHOTS": "cake.jpg",
    "COLOUR SHOT RIDER": "cake.jpg",
    "MULTI COLOUR SHY SHOT": "cake.jpg",
    "GIFT BOX": "giftbox.jpg",
    "SPECIAL FANCY": "fancy.jpg",
}

products = json.load(open("/home/machine01/Workspace/sundar-traders-crackers/products.json"))
missing = {p["category"] for p in products} - set(CAT_IMG)
assert not missing, f"unmapped categories: {missing}"
for p in products:
    p["img"] = "assets/" + CAT_IMG[p["category"]]

json.dump(products, open("/home/machine01/Workspace/sundar-traders-crackers/site/products.json", "w"), indent=1)
print("products:", len(products), "all mapped")
