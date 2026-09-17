# T4 — Backend and hosting choice

Type: research (AFK). Blocked by: T1, T2, T3.

## Question

Given the locked scope, catalog source, and order flow, recommend the
simplest stack: static site + Sheets/Apps Script kept as backend vs tiny
backend (orders API + DB) + hosting (options with cost/effort). Output: one
recommended stack with reasons, not a menu.

## Resolution (2026-09-17, research)

Recommended: static single-page site on a free host (GitHub Pages /
Cloudflare Pages / Netlify — all ₹0, pick whichever account exists) that
keeps the existing Apps Script + Google Sheet as its backend.

Why: scope is a faithful rebuild (T1), Sheets stays the database (T2), no
payments (T3). The current catalog/checkout logic is already client-side JS
(see `sundar_app.html`) — it ports directly. Zero running cost, no new
database, shop keeps editing prices in Sheets.

Two facts verified by probe:
- The `exec` URL serves the HTML app today (`doGet` → page, HTTP 200).
- Plain POST to `exec` returns HTTP 200 (endpoint reachable cross-origin).

One thing NOT verifiable from outside, first job at build time: the script
currently talks to the page via `google.script.run` (only works inside the
Apps Script iframe). An external site needs two small JSON endpoints added
to the same script (`doGet?action=products`, `doPost` order) plus one
redeploy — ~15 lines of server code, same Sheet untouched. Needed edit access
to the script, which is unavailable — hence the mock-first update below.

## Update (2026-09-17, decided by Jerome)

Mock-first: ship the static site with `products.json` baked in and orders
kept client-side (WhatsApp send + printable receipt, as today). No script
changes needed. Sheet read/write endpoints get added later when access
arrives — the code reads products through one fetch call so the swap is
trivial. Photos: no shop assets exist; use representative internet photos,
one per category (146 SKUs have no distinct photos).
