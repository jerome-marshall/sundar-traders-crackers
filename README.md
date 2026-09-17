# Sundar Traders website (mock-first build)

Static site in `site/`. No build step, no server needed.

## View locally

```sh
cd site
python3 -m http.server 8901
# open http://localhost:8901
```

## Deploy free (pick one)

- **Netlify Drop**: drag the `site/` folder onto https://app.netlify.com/drop —
  live URL in seconds, no account needed to start.
- **Cloudflare Pages / GitHub Pages**: upload `site/` contents, same result.
- No environment variables, no backend. Custom domain can attach later.

## Later: Google Sheet plumbing (needs script access)

1. In the Apps Script project, add `doGet?action=products` (return products
   as JSON) and `doPost` (append order, return order id), redeploy as Web App.
2. In `site/app.js`: point `DATA_URL` at the products endpoint and replace
   the MOCK block in `submitOrder()` with a `fetch` POST. Nothing else changes.

## Photos

One representative photo per category (11 files, `site/assets/`). Sources and
licence pages in `site/assets/credits.json` — all Wikimedia Commons (CC BY /
CC BY-SA), attribution in the site footer. Individual SKUs have no distinct
public photos; swap in real pack shots per product any time by adding files
to `assets/` and an `img` field per row in `products.json`.
