# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The website of **新疆昌杰立盛环境工程技术有限公司 (Xinjiang Changjie Lisheng Environment Engineering Technology Co., Ltd)**, Ürümqi. All content is Simplified Chinese (`lang="zh-CN"`).

The company markets **中央空调通风 / 防排烟系统 composite ductwork**. Tagline: **科技创造洁净**. Real, verified company data lives in `data/site.json`: phone 186 9918 5812; address 乌鲁木齐市水磨沟区会展大道 599 号 新疆财富中心商业 101 室 D-1-285 号; credit code 91650105MA7ABAMT3Y; founded 2019.12.03.

## Stack

A **Next.js 15 (App Router) + React 19** application in plain JavaScript, run by a small custom Node server, with **SQLite** storage through Node's built-in `node:sqlite` (Node ≥ 22.13, no native modules).

```sh
npm install
npm run dev      # development server, http://localhost:4173
npm run build    # production build
npm start        # production server (node server.mjs)
npm test         # unit tests for lib/ plus end-to-end tests of the built site (run npm run build first; without a build the end-to-end group is skipped)
```

Configuration is by environment variables; copy `.env.example` to `.env.local`. Never commit `.env.local` or anything under `data/*.sqlite*` (visitor IPs and customer messages).

## Hosting — important

This app needs a running Node server, so it **cannot be served by GitHub Pages**. `main` still holds the older static site, which GitHub Pages publishes to changjielisheng.com. Do not merge this app into `main` until a Node host exists and DNS is ready to move; merging would break the live site.

## Layout

- `server.mjs` — entry point. Before handing a request to Next it fixes the source of the visitor IP: without a reverse proxy it overwrites `X-Forwarded-For` with the socket address; with `TRUST_PROXY=1` it keeps the proxy's header.
- `app/` — routes.
  - `layout.js` (fonts, header, footer, visit tracker, Baidu Tongji), `site.css` (design tokens and shared chrome).
  - `page.js` + `home.css` — home page, composed from `components/sections/*` plus `Products` and `ContactForm`.
  - `configurator/page.js` + `configurator.css` — 风管选型配置器.
  - `api/visit/route.js` — records a page view. `api/messages/route.js` — validates, stores and emails an inquiry. `admin/route.js` — Basic-auth page listing messages, region distribution and visits (enabled only when `ADMIN_USER` and `ADMIN_PASSWORD` are set).
- `components/` — `Header` (client, mobile nav state), `Footer`, `VisitTracker` (client, posts to `/api/visit` on each route), `HeroDuct` (client, starts the hero 3D duct), `Products` (client, tab state, renders `data/products.json`), `ContactForm` (client), `Configurator` + `ConfiguratorMarkup`, `sections/*` (static server components).
- `lib/` — `db.js` (schema and queries), `geo.js` (offline IP → region via the `ip2region` package; no third-party calls), `mail.js` (nodemailer over SMTP), `request.js` (visitor IP).
- `lib/client/` — browser-only modules loaded with dynamic `import()` inside effects: `duct3d.js` (`Duct3D` Canvas 2D duct renderer), `cjexport.js` (`CJExport`, builds real `.xlsx` / `.docx` in the browser), `configurator-controller.js`.
- `data/` — `site.json` (company facts, nav), `products.json` (home product lines), `lines.json` (configurator product lines). The SQLite file `site.sqlite` is created here at runtime unless `DATA_DIR` is set.
- `public/` — `assets/img/**` (the company's own photos and logo) and `manual.html`, the hand-written standalone product & technical manual, served as a static file.

## Things to know before changing code

- **Configurator is an island.** `ConfiguratorMarkup` renders the controls once; `configurator-controller.js` (the former inline script) then drives the DOM imperatively. `Configurator` has no state, so React never re-renders over it. Keep it that way, or port the controller to React state in one go — do not mix the two.
- **Visitor IP:** always the right-most `X-Forwarded-For` entry (see `lib/request.js`). Behind Nginx set `TRUST_PROXY=1` and `proxy_set_header X-Forwarded-For $remote_addr;`.
- **Messages:** rate-limited to 5 per IP per hour; a hidden `website` field is a honeypot. A message is stored first and emailed second, so a mail failure never loses it; `mail_status` records `sent` / `skipped` (SMTP not configured) / `failed`.
- **Privacy:** the site stores IP, region, path and user agent per visit, and contact details per message. The footer and the form say so; keep those notices if the wording changes.
- **Design tokens** are CSS custom properties at the top of `app/site.css`: navy `--navy #0B2545`, signal orange `--orange #E2581F`, cool paper `--paper #F3F5F7`. Fonts: Noto Serif SC (headings), Noto Sans SC (text), Barlow Condensed (`.num`, figures). Breakpoints 768 / 900 / 1024px.
- **Brand:** header shows `public/assets/img/logo.png` plus live text (昌杰立盛 / 复合风管与防排烟系统). The full legal name is deliberately not in the header; it is in the footer, About, licence table, contact and exported 清单. The logo has a white background — do not CSS-invert it.
- **Photos:** only the company's own photos go on the site. Third-party reference photos must not be published.
- Product specs appear in three places that must agree: `data/products.json`, `data/lines.json`, and `public/manual.html`.
- Company facts come from `data/site.json`; do not hard-code phone, email or address in components.
