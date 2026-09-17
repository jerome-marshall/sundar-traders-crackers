import json

products = json.load(open("/home/machine01/Workspace/sundar-traders-crackers/site/products.json"))
pick_cats = ["SPARKLERS", "FLOWER POTS", "GROUND CHAKKAR", "ATOM BOMBS", "ROCKETS", "GIFT BOX"]
sample = []
for c in pick_cats:
    sample.extend([p for p in products if p["category"] == c][:2])
print(len(sample), "sample products")
json.dump(sample, open("/home/machine01/Workspace/sundar-traders-crackers/prototype/products.json", "w"), indent=1)
