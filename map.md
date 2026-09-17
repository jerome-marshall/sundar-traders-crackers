# Wayfinder map: Sundar Traders crackers website

## Destination

A live replacement website for the current Google Apps Script order page:
customer-facing catalog + checkout that saves real orders (today: `sundar_app.html`
in this folder, decoded from the Apps Script `exec` URL). Done = shareable URL,
real orders saved somewhere the shop can see them, prices/products editable
without a developer.

## Notes

- Current app analysis: single page — hero (shop name, tagline, WhatsApp
  919600219655), search + category chips, product cards (MRP struck through,
  discount price, qty stepper, max 500), sticky total bar, checkout (name,
  10-digit mobile starting 6-9, address, notes), success view (order id,
  WhatsApp send link, print receipt). Backend: `getClientConfig` /
  `getProducts` / `placeOrder` → Google Sheets. Demo fallback: sample products.
- Domain glossary: see `CONTEXT.md`.
- Planning only: tickets resolve decisions, not builds.

## Decisions so far

- [T1 — Scope and destination lock](tickets/T1-scope.md): faithful rebuild of
  the current page, no new features Day 1.
- [T2 — Product catalog source of truth](tickets/T2-catalog.md): Google Sheets
  stays the database; site reads products/prices from it.
- [T3 — Order handling](tickets/T3-orders.md): no online payment Day 1; keep
  call-to-confirm + WhatsApp link, courier note unchanged.
- [T4 — Backend and hosting choice](tickets/T4-backend.md): free static host +
  existing Apps Script/Sheet as backend (small JSON-endpoint addition at build).

## Not yet specified

- Order notifications: WhatsApp/call/SMS to shop, customer confirmation flow.
- Delivery/courier charge calculation (current: "courier extra" note only).
- Admin view: how the shop sees/tracks orders (Sheets is today's admin).
- Language: English only vs Tamil.
- Launch timing: ASAP once ready (no fixed date); no custom domain, free URL.
- Data: mock-first (no Sheet access yet) — `site/products.json`, one-fetch
  swap later. Photos: 11 category photos in `site/assets/` (Commons, credited).

## Build status (2026-09-17)

- Site built at `site/`: 146 products, 19 categories, photos, search, checkout
  with validation, mock orders (WhatsApp send + print + localStorage).
- Verified in browser: 146/146 items render, 0 broken images, order flow
  end-to-end (qty → totals → order id → WhatsApp link).
- Left: Sheet read/write wiring once script access arrives. Staging live at
  https://sundar-traders.cottony-joggers.workers.dev (anonymous Cloudflare
  Drop deploy, 2026-09-17).

## Out of scope

- Online payments (UPI/gateway) — deferred past Day-1 launch, not rejected.

