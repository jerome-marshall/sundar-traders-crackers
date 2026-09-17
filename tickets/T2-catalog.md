# T2 — Product catalog source of truth

Type: grilling (HITL). Blocks: T4.

## Question

Who updates products/prices and how? Options: keep Google Sheets as the
database the site reads/writes, a simple admin page, or a file (CSV) edited
per season. Diwali is seasonal — prices likely change yearly. Decide the
editor and the flow.

## Resolution (2026-09-17, decided by Jerome)
Google Sheets stays the price/product database; site reads from it.

## Update (2026-09-17, decided by Jerome)

No edit access to the Sheet right now → build with mock product data baked
in; Sheet plumbing gets wired later once access arrives. Data layer must be
a clean swap (one `products.json` fetch), not hardcoded prices.
