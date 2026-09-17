# Sundar Traders crackers domain (initial glossary, from current app)

- **Shop**: Sundar Traders, Sivakasi. WhatsApp 919600219655.
- **Category**: product grouping (SPARKLERS, FLOWER POTS, GROUND CHAKKAR,
  SINGLE SOUND, ATOM BOMBS, ROCKETS, ...). Drives filter chips.
- **Product**: id, name, pack (`item`: "1 BOX" / "1 PKT"), **MRP** (`actual`,
  struck through), **discount/sale price** (`discount`), category.
- **Order**: customer (name, 10-digit mobile, address, notes) + lines
  (product id + qty) + totals (MRP total, net total, savings). Gets an order id.
- **Net total**: sum of discount price × qty. What the customer pays
  (plus courier, currently unspecified).
