# Remote dev preview on your phone via Tailscale (Vite + full-stack + Hermes/T3 agents)

> Status: research synthesis, 2026-09-18. Every command/flag below was verified against the
> official docs linked inline. Forum threads are cited as field experience, not as spec.

## TL;DR (top recommendation)

1. **Default path — Option A+B combined:**
   Run Vite bound to localhost (`npm run dev`, default port `5173`), then publish it
   inside your tailnet with **`tailscale serve --bg <port>`** and open the
   `https://<machine>.<tailnet>.ts.net` URL on your phone's browser (Tailscale app on, same tailnet).
   You get a clean HTTPS URL with no port number, no firewall hole, no LAN dependency.
2. **Fix the two Vite gotchas or the page will refuse to load / hot-reload will die:**
   add your tailnet hostname to `server.allowedHosts`, and leave HMR on the default
   (Serve proxies WebSocket; if HMR breaks, pin `server.hmr.clientPort` / `server.ws` — see §5).
3. **Backend API: expose each port separately** (`tailscale serve --bg --https=<n> <api-port>`
   or bind the API to `0.0.0.0` and hit `http://<tailscale-ip>:<api-port>`), point the
   frontend at it via env var (`VITE_API_URL`), and handle CORS explicitly.
4. **Do NOT use `tailscale funnel`** for day-to-day phone preview — it publishes to the whole
   internet. Reserve Funnel / Cloudflare Tunnel for webhooks or sharing with non-tailnet people.
5. **Agent flow:** trigger work from the T3 Code / Hermes mobile app as usual, but do the
   *visual* check in the phone browser at the Serve URL (agent preview panes / `opencode web`
   do not tunnel your dev server to the phone today — see §7).

Why Serve-over-`--host`: plain `vite --host` works but forces you onto `http://<ip>:5173`
with firewall rules, mixed-content traps, and (if you bind `0.0.0.0`) exposure to the whole
LAN/coffee-shop network. Serve keeps Vite on localhost and hands the phone a proper HTTPS
MagicDNS URL that works over cellular, not just home Wi-Fi.

---

## 1. Prerequisites

| Item | What to do | Source |
|---|---|---|
| Tailscale on dev machine (Linux) + phone | Install from Tailscale downloads / Play Store / App Store, sign into the **same tailnet** | https://tailscale.com/kb/1081/magicdns (install links per-OS), https://github.com/open-webui/docs/blob/main/docs/ecosystem/computer/phone-and-remote/tailscale.md (same-account setup) |
| MagicDNS enabled | Admin console → DNS → **Enable MagicDNS** (default on for tailnets created after 2022-10-20). Note your tailnet DNS name, e.g. `yak-bebop.ts.net`; full device name is `<machine>.<tailnet>.ts.net` | https://tailscale.com/kb/1081/magicdns |
| Tailnet HTTPS enabled (for Serve/Funnel) | Admin console → DNS → **HTTPS Certificates → Enable HTTPS**. First `tailscale serve` run interactively prompts for consent if not yet enabled | https://tailscale.com/docs/features/tailscale-serve, https://tailscale.com/kb/1153/enabling-https |
| Tailscale ≥ 1.52 CLI syntax | `tailscale serve [flags] <target>`; Serve/Funnel CLI changed in v1.52 — old blog snippets with positional `tailscale serve --https=443 <path>` variants still work but check `--help` | https://tailscale.com/docs/reference/tailscale-cli/serve |
| Phone: Tailscale connected | iOS/Android app connected, ideally **Always-on VPN** so cellular still routes the tailnet | Forum experience: Android disconnect complaints https://www.reddit.com/r/Tailscale/comments/18qapk3/tailscale_issues_on_android_phone/ |
| Node ≥ 22 on dev machine (if also running T3 remote) | T3 SSH-launch requires `^22.16 \|\| ^23.11 \|\| >=24.10` | https://github.com/BigDog1400/hermes-t3/blob/main/REMOTE.md |

Checklist:

```bash
tailscale status            # both devices visible
tailscale ip -4             # e.g. 100.x.y.z
nslookup <machine>.<tailnet>.ts.net  # MagicDNS resolves (note: macOS host/nslookup bypass system DNS; prefer ping)
tailscale serve status      # what is currently served
```

(MagicDNS `nslookup` caveat on macOS: https://tailscale.com/kb/1081/magicdns)

---

## 2. Option A — Vite `--host` + Tailscale IP/hostname (simplest, LAN-like)

**Idea:** bind Vite to all interfaces so any tailnet peer can reach it directly by IP:port.
This is the same mechanism as phone-on-same-Wi-Fi preview, except the "LAN" is the WireGuard tailnet.

### Steps

```bash
# 1. Start Vite listening on all interfaces (either form; verified in Vite docs)
npm run dev -- --host
# or explicitly:
npx vite --host 0.0.0.0 --port 5173
```

Vite prints `Local:` and `Network:` URLs. On the phone (Tailscale on), open either:

- `http://100.x.y.z:5173` (dev machine's Tailscale IP — most reliable), or
- `http://<machine>:5173` (short MagicDNS name, resolves via tailnet search domains)

### Config form (equivalent)

```js
// vite.config.js
import { defineConfig } from 'vite'
export default defineConfig({
  server: {
    host: '0.0.0.0',   // or true — "listen on all addresses, including LAN and public"
    port: 5173,
    strictPort: true,  // exit instead of silently rolling to 5174 (important for phone bookmarks)
  },
})
```

- `server.host` type `string | boolean`, default `'localhost'`; `--host 0.0.0.0` / `--host` CLI forms: https://vite.dev/config/server-options.html
- `server.port` default `5173`, auto-increments unless `strictPort`: https://vite.dev/config/server-options.html

### Firewall (Linux)

Vite on `0.0.0.0` listens on **all** interfaces, so `ufw`/firewalld matters:

```bash
sudo ufw allow 5173/tcp
# tighter: only allow the Tailscale interface
sudo ufw allow in on tailscale0 to any port 5173 proto tcp
```

### Pros / cons

- ✅ Zero Tailscale-server config; HMR WebSocket usually "just works" (same origin, same port).
- ❌ `http://` + port number URL; iOS clipboard/PWA/secure-context features may misbehave (same complaint documented for `cptr` plain-tailnet mode: https://github.com/open-webui/docs/blob/main/docs/ecosystem/computer/phone-and-remote/tailscale.md).
- ❌ Reachable from **every** network the machine is on (office LAN, café Wi-Fi), not just the tailnet.
- ❌ Dies when you change networks unless you use the stable `100.x` IP / MagicDNS name (which this option does — prefer those over `192.168.x`).

---

## 3. Option B (recommended) — `tailscale serve` with HTTPS (no ports, tailnet-private)

**Idea:** keep Vite on `localhost` and let the Tailscale daemon reverse-proxy tailnet HTTPS → localhost.
Phone opens `https://<machine>.<tailnet>.ts.net` — no port, valid cert, works over cellular.

### Steps

```bash
# 1. Run Vite normally (localhost is fine — Serve proxies to 127.0.0.1)
npm run dev -- --port 5173 --strictPort

# 2. Publish it to the tailnet (foreground first to see the URL, then background)
tailscale serve 5173
# output: Available within your tailnet: https://<machine>.<tailnet>.ts.net
#         |-- / proxy http://127.0.0.1:5173

# 3. Persist across terminal sessions
tailscale serve --bg 5173
tailscale serve status          # confirm
# phone: open the https:// URL above (Tailscale app connected)

# 4. Stop later
tailscale serve reset           # or: tailscale serve --https=443 off
```

Flag verification: `tailscale serve [flags] <target>` where target may be a port (`3000`),
partial URL (`localhost:3000`), full URL, file/dir, or `text:`; `--https=<port>` default,
`--http=<port>`, `--bg`, `--set-path`, `--tcp`, `--tls-terminated-tcp`, `--yes`;
`status` / `reset` / `get-config` subcommands:
https://tailscale.com/docs/reference/tailscale-cli/serve —
examples (`tailscale serve 3000`, `--bg` persistence):
https://tailscale.com/docs/reference/examples/serve —
Serve = tailnet-only, Funnel = public:
https://tailscale.com/docs/features/tailscale-serve

### Multi-port: frontend + backend

Serve maps **one local port per HTTPS port/path**. Two patterns:

```bash
# Pattern 1 (recommended): separate Serve HTTPS front-doors
tailscale serve --bg 5173                    # https://<machine>.<tailnet>.ts.net/      -> Vite
tailscale serve --bg --https=8443 3001       # https://<machine>.<tailnet>.ts.net:8443  -> API
tailscale serve status
```

```bash
# Pattern 2: path-prefix on one hostname (Vite proxy still needed for /api; test HMR)
tailscale serve --bg --set-path=/api 3001
```

Constraint to know: Serve only proxies to `localhost`/`127.0.0.1` targets
(`only localhost or 127.0.0.1 proxies are currently supported` — open feature request to
relax: https://github.com/tailscale/tailscale/issues/8751). So the backend must listen on
localhost (default for Express/FastAPI/Node) — which is exactly what you want anyway (see §6).

### Vite config for Serve (REQUIRED — otherwise `Blocked request`)

Since Vite ≥ 5.4.12 / 6.x, any non-localhost hostname is rejected unless allow-listed
(GHSA-vg6x-rcgg-rjx6). Opening the `*.ts.net` URL without this gives:

> `Blocked request. This host ("<device>.<tailnet>.ts.net") is not allowed.`

```js
// vite.config.js — tailnet-safe allowlist (prefer over allowedHosts: true)
import { defineConfig } from 'vite'
export default defineConfig({
  server: {
    host: 'localhost',   // keep localhost; Serve terminates TLS and proxies locally
    port: 5173,
    strictPort: true,
    allowedHosts: [
      '<machine>.<tailnet>.ts.net',  // exact Serve hostname
      // '.ts.net',                  // alternative wildcard if machine name changes often
    ],
  },
})
```

- `server.allowedHosts`: hostnames Vite responds to; IPs + localhost allowed by default; leading `.` = subdomain wildcard; `true` = allow all (**DNS-rebinding risk**, do not use permanently): https://vite.dev/config/server-options.html
- Env-var alternative (no config edit, good for agents): `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<machine>.<tailnet>.ts.net`: https://vite.dev/config/server-options.html
- Real-world confirmation this bites Tailscale URLs specifically: Portless issue — `Blocked request … ("<device>.<tailnet>.ts.net") is not allowed` when `.ts.net` missing from allowlist: https://github.com/vercel-labs/portless/issues/310 ; same class of fix for ngrok/Cloudflare tunnels: https://israynotarray.com/en/nuxt/2026/05/16/nuxt3-ngrok-blocked-request-fix ; Vite discussion (Railway/proxy hosts): https://github.com/vitejs/vite/discussions/19426

### HMR over Serve

Vite dev HMR is a WebSocket; Serve is expected to proxy WebSocket with default config
(Vite docs: "reverse proxies in front of Vite are expected to support proxying WebSocket;
if the HMR client fails it falls back to a direct connection with a console error you can
ignore"): https://vite.dev/config/server-options.html (`server.ws` section).

If phone HMR fails (stale page, `failed to connect to websocket`):

```js
// Only if needed — pin HMR to the same port so no direct-connect fallback is attempted
export default defineConfig({
  server: {
    strictPort: true,
    ws: { clientPort: 443 },  // when served via https://<host> (443)
  },
})
```

- `server.hmr` / `server.ws` (`protocol/host/port/path/clientPort/timeout`): https://vite.dev/config/server-options.html
- Known pain area: HMR-behind-reverse-proxy threads (Codespaces/WS-proxy analogues): https://github.com/vitejs/vite/issues/8666, https://github.com/vitejs/vite/discussions/6473, https://github.com/vitejs/vite/issues/6814
- Pragmatic fallback: HMR is a nice-to-have on the phone; full reload still validates the work. Ship v1 without HMR if it fights you (same triage the Hermes preview-proxy proposal makes: static first, WS tunneling v2 — https://github.com/NousResearch/hermes-agent/issues/91149).

### Pros / cons

- ✅ `https://` clean URL, no ports, no firewall rules, works on cellular (tailnet, not LAN).
- ✅ Vite stays on localhost — smallest attack surface; Serve adds `Tailscale-*` identity headers for tailnet callers: https://tailscale.com/docs/features/tailscale-serve
- ✅ Background-persist + auto-resume on `tailscaled` restart when started with `--bg`: https://tailscale.com/docs/reference/tailscale-cli/serve
- ❌ Requires HTTPS feature enabled (publishes machine names to Certificate Transparency log — see §6).
- ❌ One more hop to reason about when HMR breaks (table in §8).

---

## 4. Option C — Tunnel / forward alternatives (brief comparison)

| Tool | Scope | Command sketch | When to prefer | Caveat |
|---|---|---|---|---|
| `tailscale funnel` | **Public internet** | `tailscale funnel 5173` (ports limited to `443,8443,10000`; needs MagicDNS+HTTPS + `funnel` nodeAttr) | Webhook/callback testing, sharing with someone **off** the tailnet | Anyone with the URL can reach it; same `allowedHosts` fix needed; bandwidth-limited beta: https://tailscale.com/docs/features/tailscale-funnel (ports/requirements), https://dev.to/chrisshennan/tailscale-as-an-ngrok-local-tunnel-cloudflare-tunnel-alternative-4bd7 (serve-vs-funnel field report) |
| Cloudflare Tunnel (`cloudflared` / Wrangler `dev --tunnel`) | Public URL (`*.trycloudflare.com` or your domain) | `npx wrangler dev --tunnel` / Vite plugin `tunnel: {name}` | No Tailscale on the viewer side; custom-domain certs (Cloudflare manages your domain's certs) | Public by construction; Vite `allowedHosts` must include tunnel domain; dev-server HMR over tunnel exposes source: https://developers.cloudflare.com/workers/local-development/local-dev-tunnels/index.md ; Tailscale-vs-Cloudflare E2E-encryption comparison: https://tailscale.com/compare/cloudflare-mesh |
| `ssh -L` | Single client | `ssh -L 5173:localhost:5173 devmachine` | One-off from a laptop with SSH but no Tailscale | Phone SSH clients + keep-alive pain; not a phone workflow |
| VS Code port forwarding | Editor-bound | Automatic `localhost:5173` forward | Already living in VS Code Remote | Tied to the editor session; phone still needs the forwarded URL |
| `opencode web --hostname 0.0.0.0` | Agent UI, **not** app preview | `OPENCODE_SERVER_PASSWORD=secret opencode web --port 4096 --hostname 0.0.0.0` | Driving the *agent* from another device's browser | This exposes the agent control plane, not your Vite app; set a password: https://opencode.ai/docs/web/ |

**Do not confuse** OpenCode's `/share` (public link to a *conversation transcript*, `opncd.ai/s/…`) with serving your app: https://opencode.ai/docs/share/

---

## 5. Full-stack wiring: backend API, CORS, env vars, DB

### Backend listener

```bash
# Dev API on localhost is CORRECT for the Serve pattern (one Serve entry per port)
# e.g. API on :3001 -> tailscale serve --bg --https=8443 3001
```

Only bind the API to `0.0.0.0` if you chose Option A (direct IP:port from phone).
Binding `0.0.0.0` also exposes it to the local LAN — prefer Serve + localhost (Tailscale's
own Serve docs recommend localhost-only backends when using identity headers:
https://tailscale.com/docs/features/tailscale-serve).

### Frontend → API URL

```bash
# .env.development (Vite exposes VITE_* to client code)
VITE_API_URL=https://<machine>.<tailnet>.ts.net:8443
# Option-A alternative:
# VITE_API_URL=http://100.x.y.z:3001
```

Mixed-content rule: a page loaded over `https://` **cannot** `fetch(http://…)` — the browser
blocks it. So if the frontend goes through Serve-HTTPS, the API must also be HTTPS
(Serve second port) or same-origin via `server.proxy`. This is the #1 "page loads but data
doesn't" cause.

### Vite dev proxy (same-origin API, avoids CORS entirely on the phone)

```js
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
```

`server.proxy` (`{ key: target | ProxyOptions }`, `http-proxy-3` options): https://vite.dev/config/server-options.html

### CORS (only needed for cross-origin fetch)

```js
server: { cors: { origin: ['https://<machine>.<tailnet>.ts.net'] } }
```

Default dev CORS only allows `localhost/127.0.0.1/[::1]`; `cors: true` allows any origin
(**source-exfiltration risk**, same warning class as `allowedHosts: true`): https://vite.dev/config/server-options.html.
Prefer the proxy above; set explicit backend CORS origins otherwise.

### Database

Nothing phone-specific: the DB stays localhost-only on the dev machine; only the HTTP layer
is published. Never `tailscale serve` (or `--host`) a raw DB port to the phone.

---

## 6. Security notes (read before sharing)

1. **Serve = tailnet-only; Funnel = world-readable.** `tailscale funnel` creates a public URL
   via relay servers with end-to-end TLS but public reachability: https://tailscale.com/docs/features/tailscale-funnel.
   Open-WebUI's Tailscale guide states it bluntly: *"Don't reach for Funnel — it publishes
   the URL to the whole internet"*: https://github.com/open-webui/docs/blob/main/docs/ecosystem/computer/phone-and-remote/tailscale.md
2. **`allowedHosts: true` / `cors: true` disable DNS-rebinding protection.** Vite warns both
   allow any website to pull your dev-server source: https://vite.dev/config/server-options.html
   (advisory GHSA-vg6x-rcgg-rjx6). Always list explicit hosts/origins.
3. **ACLs still apply to Serve.** Tailnet policy restrictions cover Serve traffic; Funnel needs
   the `funnel` nodeAttr: https://tailscale.com/docs/features/tailscale-serve, https://tailscale.com/docs/features/tailscale-funnel
4. **Certificate Transparency publishes machine names.** Enabling tailnet HTTPS + `tailscale cert`
   logs `<machine>.<tailnet>.ts.net` to the public CT ledger. Rename sensitive machines first:
   https://tailscale.com/kb/1153/enabling-https
5. **Keep backends on localhost; validate `Host`.** Tailscale security best practice: HTTP
   services should validate the `Host` header against an allowlist to blunt DNS rebinding:
   https://tailscale.com/docs/reference/best-practices/security
6. **Agent surfaces are authenticated separately.** T3 pairing tokens/URLs are password-equivalent;
   bind `t3 serve --host` to a tailnet IP, revoke via `t3 auth`: https://github.com/BigDog1400/hermes-t3/blob/main/REMOTE.md.
   `opencode web` without `OPENCODE_SERVER_PASSWORD` is unsecured: https://opencode.ai/docs/web/

---

## 7. Phone UX: triggering work + seeing it

### Triggering (already works)

- **T3 Code mobile** (iOS/Android) pairs to the dev machine (`t3 serve`, QR/pairing code, or
  Tailscale endpoint `npx t3 serve --host "$(tailscale ip -4)"` / `--tailscale-serve` for an
  HTTPS MagicDNS backend so `https://app.t3.codes` pairing isn't mixed-content blocked):
  https://github.com/BigDog1400/hermes-t3/blob/main/REMOTE.md
- **Hermes mobile companions** are thin remotes over the agent's own server (same pattern —
  reachable Hermes Web UI server + phone client): https://github.com/goncharik/hermes-mobile,
  https://apps.apple.com/in/app/hermes-agent-mobile/id6767006319
- This repo's harness is the OpenCode lineage (`opencode web` / `attach` model): https://opencode.ai/docs/web/

### Previewing (the gap this doc closes)

- **Today: use the phone *browser* at the Serve URL.** There is no built-in "dev-server tunnel
  to phone" in the agent preview pane: Hermes has an open feature request noting the desktop
  preview `<webview src=localhost:PORT>` resolves on the GUI machine, not a remote/SSH backend
  host, with a proxy-scheme proposal (v1 = no HMR): https://github.com/NousResearch/hermes-agent/issues/91149.
  Same structural limitation applies to any harness preview: point a real browser at the
  tailnet URL instead.
- **Bookmark two URLs on the phone:** `https://<machine>.<tailnet>.ts.net` (app) and the agent
  pairing/web URL. Test once on **cellular (Wi-Fi off)** to prove it's tailnet, not LAN —
  verification ritual borrowed from https://github.com/open-webui/docs/blob/main/docs/ecosystem/computer/phone-and-remote/tailscale.md.
- **T3 + Serve coexistence:** `t3 serve --tailscale-serve` proxies the *agent backend* on 443;
  your Vite app needs its own `tailscale serve` entry (different `--https` port or path) —
  they compose; just don't reuse port 443 for both (Serve-vs-Funnel same-port rule is
  last-writer-wins: https://tailscale.com/docs/features/tailscale-funnel).
- **This repo note:** `prototype/` is currently static (`index.html` + `app.js`, no
  `vite.config`/`package.json`), so for today's prototype either `tailscale serve` a static
  server (`python3 -m http.server 5173`) or apply the Vite snippets above when it migrates
  to Vite. The `allowedHosts`/HMR/Serve mechanics are identical either way.

---

## 8. Troubleshooting

| Symptom on phone | Cause | Fix |
|---|---|---|
| `Blocked request. This host ("….ts.net") is not allowed` | Vite host check (≥5.4.12/6.x) | Add exact host (or `.ts.net`) to `server.allowedHosts`; or `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`; restart dev server. Refs: https://vite.dev/config/server-options.html, https://github.com/vercel-labs/portless/issues/310 |
| Page loads, HMR console error `failed to connect to websocket` / fallback warning | Reverse proxy in front of Vite not proxying WS (or clientPort mismatch) | Ensure `server.strictPort=true`; optionally set `server.ws.clientPort` to the public port (443 for Serve-HTTPS); error-during-fallback is ignorable per Vite docs: https://vite.dev/config/server-options.html |
| Page loads but API calls fail / empty data | Mixed content (`https` page → `http` API) or CORS | Serve the API over HTTPS too (second Serve port) or use `server.proxy /api`; set explicit `server.cors.origin` / backend CORS: https://vite.dev/config/server-options.html |
| `ERR_CONNECTION_REFUSED` / timeout on `100.x:5173` | Vite bound to `localhost` only, or firewall | Restart with `--host` / `host:'0.0.0.0'`; `sudo ufw allow 5173/tcp` (or `tailscale0`-scoped rule). Same root cause as classic localhost-vs-network bind: https://github.com/amantus-ai/vibetunnel/issues/326 |
| Serve URL works on Wi-Fi, not cellular | Phone browser hitting LAN IP, or Tailscale app asleep on mobile data | Use the `*.ts.net` URL (never `192.168.x`); confirm Tailscale connected + Always-on VPN; re-run `tailscale serve status`: pattern from https://github.com/open-webui/docs/blob/main/docs/ecosystem/computer/phone-and-remote/tailscale.md |
| `tailscale serve` asks for HTTPS/admin consent | HTTPS certs not enabled on tailnet | Follow the consent URL (admin approves once): https://tailscale.com/docs/features/tailscale-serve |
| Serve/Funnel port conflict (`listener already exists`) | Same port configured for both, or stale `--bg` entry | `tailscale serve status`, then `tailscale serve reset` and re-add; same-port last-writer-wins: https://tailscale.com/docs/features/tailscale-funnel |
| Serve proxies to wrong app / ignores hostname | Serve only supports `localhost/127.0.0.1` targets | Keep backends on localhost; one Serve entry per port: https://github.com/tailscale/tailscale/issues/8751 |
| `https://app.t3.codes` won't pair to `http://100.x:3773` | Browser mixed-content block (HTTPS page → HTTP backend) | Use the Tailscale-HTTPS endpoint (`t3 serve --tailscale-serve`) for hosted pairing: https://github.com/BigDog1400/hermes-t3/blob/main/REMOTE.md |

---

## 9. Forum / community wisdom (links)

- Open-WebUI docs — Tailscale phone pattern (Option A vs Serve-HTTPS Option B, cellular test, "don't reach for Funnel"): https://github.com/open-webui/docs/blob/main/docs/ecosystem/computer/phone-and-remote/tailscale.md and https://docs.openwebui.com/ecosystem/computer/phone-and-remote/tailscale
- Vicoa guide — same-Wi-Fi `0.0.0.0` baseline, firewall/HMR notes, Tailscale as the off-LAN upgrade: https://vicoa.ai/blog/view-localhost-on-mobile
- Vite HMR-behind-proxy threads (Codespaces/Docker/Caddy analogues of Serve): https://github.com/vitejs/vite/issues/8666, https://github.com/vitejs/vite/discussions/6473, https://github.com/vitejs/vite/issues/6814, https://github.com/vitejs/vite/issues/18489
- `allowedHosts` in the wild (ngrok/Railway/Docker/Portless+Tailscale — same fix shape): https://github.com/vitejs/vite/discussions/19426, https://israynotarray.com/en/nuxt/2026/05/16/nuxt3-ngrok-blocked-request-fix, https://github.com/vercel-labs/portless/issues/310, https://github.com/vitejs/vite/issues/19411
- Serve-can-only-proxy-localhost FR (relevant when backend isn't on loopback): https://github.com/tailscale/tailscale/issues/8751
- Tailscale-vs-tunnel comparisons: https://dev.to/chrisshennan/tailscale-as-an-ngrok-local-tunnel-cloudflare-tunnel-alternative-4bd7 (Funnel vs Cloudflare Tunnel field notes), https://developers.cloudflare.com/workers/local-development/local-dev-tunnels/index.md (Cloudflare's own Vite-tunnel + `allowedHosts` warning), https://tailscale.com/compare/cloudflare-mesh (E2E-encryption difference)
- Agent-side threads: T3 remote access over Tailscale/SSH (`--host "$(tailscale ip -4)"`, `--tailscale-serve`, mixed-content pairing caveat): https://github.com/BigDog1400/hermes-t3/blob/main/REMOTE.md ; Hermes remote-backend preview gap proposal: https://github.com/NousResearch/hermes-agent/issues/91149 ; r/Tailscale Android keep-alive pain: https://www.reddit.com/r/Tailscale/comments/18qapk3/tailscale_issues_on_android_phone/
- r/Tailscale search returned mostly adjacent threads (exit-node, Termux-serve, Services-FQDN) rather than a canonical "Vite on phone" post — the Open-WebUI/Vicoa guides above are the closest consolidated community write-ups found this pass.

---

## 10. Open questions (for this repo)

1. Do we want a checked-in `vite.config.js` for `prototype/` with the tailnet `allowedHosts` + `strictPort` preset, or keep prototype static and document Vite as migration-only?
2. Should the agent harness get a skill/command (`/preview-phone`) that runs `tailscale serve status`, prints the phone URL + QR, and reminds about `allowedHosts`?
3. Backend choice (Express/FastAPI/Workers?) determines the exact second-Serve-port vs `server.proxy` wiring — decide when the API exists.
4. Funnel policy: confirm we never Funnel this shop's dev servers (public URL + crawler/indexing risk); tailnet-only default.
