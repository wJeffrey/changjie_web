# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing website for **新疆昌杰立盛环境工程技术有限公司 (Xinjiang Changjie Lisheng Environment Engineering Technology Co., Ltd)**, Ürümqi. All content is Simplified Chinese (`lang="zh-CN"`). There is **no build system, package manager, tests, or backend** — every page is a self-contained HTML file opened directly in a browser.

Note a **product-focus shift across generations**: the legacy archive (gen 2) markets **酚醛板 (phenolic insulation board)**, while the current portal and redesign (gens 0–1) market **中央空调通风 / 防排烟系统 and 镁质高晶板 composite ductwork** — the active, curated direction. When pulling content forward, prefer the gen-0/1 positioning. Real, verified company data (from the legacy 联系我们 page): phone 186 9918 5812; address 乌鲁木齐市水磨沟区会展大道 599 号 新疆财富中心商业 101 室 D-1-285 号; credit code 91650105MA7ABAMT3Y; founded 2019.12.03.

The repo contains three generations of the site:

### 0. Professional portal (current, the primary entry point)
`index.html` — a fresh, fully **self-contained** (no Tailwind CDN, no build), genuinely **mobile-first** responsive corporate portal. Hand-written CSS (CSS variables, `clamp()` fluid type, CSS grid, mobile-first media queries at 600/768/1024px) plus vanilla JS for a **working hamburger menu** (the older redesign had none), sticky header, scroll-reveal (`IntersectionObserver`), and back-to-top. Sections: Hero → Trust bar → About → Products → Tech (spec table + material comparison) → Services → Cases (industries + **工程实景 photo gallery**) → Qualifications → News → Contact → Footer. Uses **real photography curated into `assets/img/`** (product close-ups, on-site installs, plant rooms, clean room, and the company wordmark `logo-wordmark.jpeg`) — these were copied/renamed out of the legacy `*_files/` dirs (originals in `产品中心*_files/`, `首页_files/`, `logo/`). The footer wordmark is the real navy logo on a white chip (do **not** CSS-invert it — the JPEG has a white background). The only external runtime dependency is Google Fonts (Noto Sans/Serif SC) with system fallbacks. Preview with `.claude/launch.json` (`static` config serves the dir on port 4173) or just `open index.html`. Note: when previewing, the screenshot tool captures from the top of the document and races image paint on programmatic scroll — verify lower sections with a tall viewport at scroll 0 (optionally hiding upper sections via devtools).

### 1. Earlier redesign
A modern, hand-built single-page site. Three files, all in the repo root:

- `changjielisheng-website.html` — **the source/dev file you edit.** Loads Tailwind from the CDN (`<script src="https://cdn.tailwindcss.com">`), so it needs internet to render correctly.
- `changjielisheng-website1.html` — a **byte-identical duplicate** of the above. Keep it in sync or treat as disposable.
- `changjielisheng-website-预览版.html` — the **standalone "preview" build** (预览版 = "preview version"). Same markup/JS, but Tailwind v4.3.0 is **compiled and inlined** into a `<style>` block instead of loaded from the CDN, so it renders offline. ~3,185 lines vs. ~1,359 because of the inlined CSS.

### 2. Legacy archive (reference only — do not edit)
`首页.html`, `1首页.html`, `产品中心*.html`, `关于我们.html`, `新闻中心*.html`, `联系我们.html`, and the article pages, each paired with a `*_files/` directory. These are **browser "Save As" mirrors of the old site** built on Baidu's iSite/loki website builder (note `<!-- saved from url=(...)isite.baidu.com ... -->` and the `GtJmyPc*269.js` Vue/loki bundles in `_files/`). They depend on Baidu CDNs and are the design being *replaced*. Use them only to pull copy, product specs, or contact info into the redesign.

## Running / previewing

There is nothing to build. The primary page is `index.html` — `open index.html`, or serve the dir (`python3 -m http.server 4173`, also wired as the `static` config in `.claude/launch.json`). `index.html` is fully self-contained and needs no CDN. For the older redesign, `open changjielisheng-website.html`; its offline-faithful twin is `changjielisheng-website-预览版.html`.

## Editing the earlier redesign (changjielisheng-website*.html) — important workflow

Because the preview file has **compiled** Tailwind, there is no script in this repo to regenerate it. Any markup or content change must be made in **both**:
1. `changjielisheng-website.html` (and its identical twin `...website1.html`), and
2. `changjielisheng-website-预览版.html`.

If you add a Tailwind utility class that isn't already present in the preview file's inlined CSS, it will silently have no effect there — verify the class exists in that `<style>` block, or add the corresponding rule.

## Architecture of the earlier redesign (changjielisheng-website*.html)

Single self-contained file (HTML + inline `<style>` + inline `<script>`), no external JS/CSS beyond the Tailwind CDN and Google Fonts. (`index.html`, the current portal, is structured differently — hand-written CSS, no Tailwind — see gen 0 above.)

- **Design tokens:** CSS custom properties in `:root` define the palette — navy (`--navy #0B2545`) and burnt orange (`--orange #E25822`) on warm paper (`--paper #FAFAF7`). Referenced from markup via Tailwind arbitrary values like `bg-[var(--navy)]`.
- **Fonts:** Fraunces (display), Noto Serif/Sans SC (Chinese), JetBrains Mono (mono), via Google Fonts; mapped to `.font-display`, `.font-serif-cn`, `.font-sans-cn`, `.font-mono`.
- **Page sections** (marked with `<!-- ===== NAME ===== -->` comment banners, each an `id`'d `<section>` for nav anchors): NAV → HERO (`#top`) → ABOUT (`#about`) → PRODUCTS (`#products`) → SERVICES (`#services`) → TECH PARAMS (`#tech`) → CASES (`#cases`) → QUALIFICATIONS (`#qualifications`) → CONTACT (`#contact`) → FOOTER.
- **JS:** vanilla, at the bottom of the file. An `IntersectionObserver` reveals `.fade-up` elements on scroll; nav uses anchor links with `scroll-behavior: smooth`. No framework, no bundler.
