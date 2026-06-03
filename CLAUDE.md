# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing website for **新疆昌杰立盛环境工程技术有限公司 (Xinjiang Changjie Lisheng Environment Engineering Technology Co., Ltd)**, Ürümqi. All content is Simplified Chinese (`lang="zh-CN"`). There is **no build system, package manager, tests, or backend** — the entire site is one self-contained HTML file opened directly in a browser.

The company markets **中央空调通风 / 防排烟系统 and 镁质高晶板 composite ductwork** (A1-grade fireproof air ducts, CCCF-certified). Tagline: **科技创造洁净** ("technology creates cleanliness"). Real, verified company data: phone 186 9918 5812; address 乌鲁木齐市水磨沟区会展大道 599 号 新疆财富中心商业 101 室 D-1-285 号; credit code 91650105MA7ABAMT3Y; founded 2019.12.03.

## The tracked repo is one page

Everything Git tracks:

- `index.html` — the entire site (HTML + inline `<style>` + inline `<script>`).
- `assets/img/*` — real photography curated into the site: product close-ups (`board-stack`, `duct-*`), on-site installs (`install-*`), plant rooms (`plantroom-*`), a clean room (`cleanroom`), and the company wordmark (`logo-wordmark.jpeg`).
- `CNAME` — `changjielisheng.com`. The site is served via **GitHub Pages** (remote `github.com/wJeffrey/changjie_web`) at that custom domain. Pushing to `main` deploys.
- `.gitignore`, `README.md`.

> **History / earlier generations.** Prior versions — a Tailwind-CDN redesign (`changjielisheng-website*.html`) and a Baidu iSite "Save As" archive of the old site (`首页.html`, `产品中心*.html`, `*_files/`) — are **gitignored and no longer present** in the working tree. They were content/asset sources only and have been fully superseded by `index.html`. The photos in `assets/img/` were extracted from those originals before removal. If you ever see references to them, they are historical; do not expect them to exist.

## Running / previewing

Nothing to build. `index.html` is fully self-contained — the only external runtime dependency is Google Fonts (Noto Sans/Serif SC, with system fallbacks). Just `open index.html`, or serve the dir for a clean origin:

```sh
python3 -m http.server 4173   # then open http://localhost:4173
```

> Screenshot note: the screenshot tool captures from the top of the document and races image paint on programmatic scroll — verify lower sections with a tall viewport at scroll 0.

## Architecture of `index.html`

Hand-written CSS and vanilla JS — **no Tailwind, no framework, no CDN beyond fonts.** Genuinely mobile-first and responsive.

- **Design tokens:** CSS custom properties in `:root` (line ~17). Palette is navy (`--navy #0B2545`) + burnt orange (`--orange #E2581F`) on a cool off-white (`--bg #f6f8fa`), plus a token system for shadows, radii, `--container: 1200px`, `--header-h: 64px`, and `--ease`. Change colors/spacing here, not inline.
- **Responsive strategy:** fluid type via `clamp()`, CSS grid layouts, mobile-first media queries at **600 / 768 / 1024px**. The desktop nav (`.nav-desktop`) and the hamburger mobile nav (`.nav-mobile`) swap at the 1024px breakpoint.
- **Fonts:** Google Fonts Noto Sans SC + Noto Serif SC.
- **Page sections** — each a banner-commented (`<!-- ==== NAME ==== -->`) `id`'d block used as a nav anchor: HEADER → MOBILE NAV → HERO → TRUST BAR → ABOUT (`#about`) → PRODUCTS (`#products`) → TECH (`#tech`, spec table + material comparison) → SERVICES (`#services`) → CASES (`#cases`, industries + 工程实景 photo gallery) → QUALIFICATIONS (`#qualifications`) → NEWS (`#news`) → CONTACT (`#contact`) → FOOTER.
- **JS** (bottom of file, ~line 1095, wrapped in an IIFE): hamburger toggle (sets `.open` on `#navMobile`, locks body scroll, closes on link-click / Escape / resize≥1024), sticky-header `.scrolled` state + back-to-top `#toTop` on scroll, scroll-reveal of `.reveal` elements via `IntersectionObserver` (graceful fallback adds `.in` to all if unsupported), and `#year` set to the current year.
- The footer wordmark is the real navy logo on a white chip — the JPEG has a white background, so do **not** CSS-invert it.

## Editing conventions

- It's one file: change markup, the `<style>` block, and the `<script>` IIFE in place. Reuse existing token variables and the `.reveal` / section-banner patterns rather than introducing new ones.
- Pull any new copy/specs/contact info from the verified company data above (the legacy sources that once held it are gone).
- To ship, commit to `main` and push — GitHub Pages redeploys to changjielisheng.com.
