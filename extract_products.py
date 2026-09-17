import re, json

html = open('/home/machine01/Workspace/sundar-traders-crackers/sundar_app.html').read()
m = re.search(r'var SAMPLE_PRODUCTS = \[(.*?)\];', html, re.S)
assert m, 'sample products not found'
body = m.group(1)
items = re.findall(r"\{\s*id:\s*'([^']+)'\s*,\s*category:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*item:\s*'([^']*)'\s*,\s*actual:\s*([0-9.]+)\s*,\s*discount:\s*([0-9.]+)\s*\}", body)
print('total products:', len(items))
products = [
    {'id': i, 'category': c, 'name': n, 'pack': p, 'mrp': float(a), 'price': float(d)}
    for (i, c, n, p, a, d) in items
]
from collections import Counter
print(json.dumps(Counter(p['category'] for p in products), indent=1))
json.dump(products, open('/home/machine01/Workspace/sundar-traders-crackers/products.json', 'w'), indent=1)
print('wrote products.json')
