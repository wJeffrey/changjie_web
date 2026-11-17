# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing website for **新疆昌杰立盛环境工程技术有限公司 (Xinjiang Changjie Lisheng Environment Engineering Technology Co., Ltd)**, Ürümqi. All content is Simplified Chinese (`lang="zh-CN"`). There is **no build system, package manager, tests, or backend** — the entire site is one self-contained HTML file opened directly in a browser.

The company markets **中央空调通风 / 防排烟系统 and 镁质高晶板 composite ductwork** (A1-grade fireproof air ducts, CCCF-certified). Tagline: **科技创造洁净** ("technology creates cleanliness"). Real, verified company data: phone 186 9918 5812; address 乌鲁木齐市水磨沟区会展大道 599 号 新疆财富中心商业 101 室 D-1-285 号; credit code 91650105MA7ABAMT3Y; founded 2019.12.03.

## The tracked repo is three pages

Everything Git tracks:

- `index.html` — the portal home page, built on the design kit in `assets/kit/` (see below): a photograph hero, eight product lines as photo tiles linking to the configurator, a 从工厂到工地 statement, the system diagram, factory and installation, cases (dark band, two screens), the 施工现场 photo wall, 部分业绩, company and certifications, the quote form, then the close and footer. Its palette and page CSS are inline in its `<head>`.
- `assets/kit/` — the 14 files of the tasteskill design kit the home page uses (system.css/js, ui, motion, layout, and the two scroll moments word-highlight and picture-develops). Third-party kit code: do not edit it; change the page instead.
- `assets/img/home/` — web-sized copies of the photographs the home page shows (`w/<name>.jpg` up to 1300 px with `-400` small copies for srcset), the hero `hero.jpg` and `logo-nav.png`. Originals stay in `assets/img/` and `assets/img/site/`.
- `configurator.html` — 风管选型配置器: pick a product line, inner W/H/L, board thickness or fire rating, colour-steel colour and design air speed; a 3D duct redraws live and a copyable 配置清单 is computed (section area, equivalent diameter, air volume). Accepts `?line=<id>` (`alu`, `s1`, `s2`, `anti`, `steel`, `glass`, `pz`). Product-line data is the `LINES` array in its inline script, taken from the manual's spec tables.
- `assets/site.css` — design tokens, base type, header, mobile nav, footer and buttons for `configurator.html` (the home page no longer uses it).
- `assets/duct3d.js` — `Duct3D`, a dependency-free Canvas 2D renderer for a rectangular composite duct (walls, flanges, core edge, surface patterns, dimension lines, drag/keyboard rotation). Used by both pages.
- `assets/cjexport.js` — `CJExport`, dependency-free in-browser builder for the configurator's downloadable 配置清单: `xlsx(data)` and `docx(data, image)` return real Office files (a minimal stored ZIP + OOXML parts), `save()` triggers the download. The company signature and contact rows come from `COMPANY` / `CONTACT` in `configurator.html`'s inline script.
- `assets/img/site/*` — the company's own product, factory and project photos extracted from the product manual (`p-*` products, `c-*` cases, `fab-*` production, `system.jpg`).
- `manual.html` — standalone interactive product & technical manual (防排烟风管系列): product finder/compare, GB 51251 fire-rating lookup, 新22N2 marking builder, install calculator, inline-SVG isometric diagrams drawn by a small JS `Iso()` engine, two application scenes. Same tokens as `index.html`, vanilla JS, no deps. Append `?review` to the URL to reveal the 校对模式 toggle (待确认 flags + open-issues table); it is hidden for public visitors. Photos live in `assets/img/manual/`.
- `assets/img/*` — real photography curated into the site: product close-ups (`board-stack`, `duct-*`), on-site installs (`install-*`), plant rooms (`plantroom-*`), a clean room (`cleanroom`), and the company wordmark (`logo-wordmark.jpeg`).
- `CNAME` — `changjielisheng.com`. The site is served via **GitHub Pages** (remote `github.com/wJeffrey/changjie_web`) at that custom domain. Pushing to `main` deploys.
- `.gitignore`, `README.md`.

> **History / earlier generations.** Prior versions — a Tailwind-CDN redesign (`changjielisheng-website*.html`) and a Baidu iSite "Save As" archive of the old site (`首页.html`, `产品中心*.html`, `*_files/`) — are **gitignored and no longer present** in the working tree. They were content/asset sources only and have been fully superseded by `index.html`. The photos in `assets/img/` were extracted from those originals before removal. If you ever see references to them, they are historical; do not expect them to exist.

## Running / previewing

Nothing to build. The only external runtime dependencies are Google Fonts and the Baidu Tongji (百度统计) analytics snippet in `<head>`. The home page loads ES modules from `assets/kit/`, so serve the folder over http rather than opening the file directly:

```sh
python3 -m http.server 4173   # then open http://localhost:4173
```

> Screenshot note: the screenshot tool captures from the top of the document and races image paint on programmatic scroll — verify lower sections with a tall viewport at scroll 0.

## Architecture of `index.html` (the home page)

Built with the tasteskill design kit (`assets/kit/`), product page type: every section is exactly one screen tall at desktop (cases two), all blocks on one 12-column grid with equal edges, splits always 6/6.

- **Palette and type** in the inline `:root` block: the company's own navy `#0e1b2b` and orange `#e2581f` on `#f4f5f6`. Headings in Fraunces (Latin) + Noto Serif SC loaded with Google Fonts `&text=` — **only the characters the headings use**, so when you add or change heading, statement or footer-lede text, regenerate that `text=` list or the new characters fall back to the system serif. Body text: Figtree (Latin) then the system Chinese face (PingFang SC / Microsoft YaHei).
- **One main action:** 获取报价 → `#quote`, word for word in the nav button, the hero, the close and the phone action bar.
- **Motion:** the hero enters once on load; `#process` inks its statement phrase by phrase on scroll (word-highlight; each phrase is its own `<span>` because Chinese has no spaces); the factory photograph develops once as it comes on screen (picture-develops). Hover states come from `motion.js`.
- **Photos:** use the copies in `assets/img/home/w/` with `width`, `height`, `srcset` and `sizes`; a photo appears once on the page.
- **Checks** (local, not in git): the kit's checker and finish gate wrote to `.taste-skill/` and `shots/`, both gitignored.

## Architecture of `configurator.html`

Hand-written CSS and vanilla JS — **no Tailwind, no framework, no CDN beyond fonts.** Genuinely mobile-first and responsive.

- **Design tokens:** CSS custom properties in `:root` at the top of `assets/site.css`. Palette is navy (`--navy #0B2545`) + signal orange (`--orange #E2581F`) on cool paper (`--paper #F3F5F7`) with galvanized greys; `--container: 1200px`, `--header-h: 68px`. Change colors/spacing there, not inline.
- **Fonts:** Noto Serif SC for headings, Noto Sans SC for text, Barlow Condensed (`.num`, `--num`) for dimensions and spec figures.
- **Responsive strategy:** fluid type via `clamp()`, CSS grid, mobile-first media queries at **768 / 900 / 1024px**. Desktop nav (`.nav`) and hamburger nav (`.nav-m`, `#navM`) swap at 1024px.
- **Page sections** — each a banner-commented (`<!-- ==== NAME ==== -->`) block: HEADER → MOBILE NAV → HERO → PRODUCTS (`#products`, a tablist `#prodTabs` with one static `article.prod-panel` per product line) → SYSTEM (`#system`, system diagram, 21-part legend, four advantages) → CONFIGURATOR CTA → CASES (`#cases`, featured project, four project cards, 业绩 table) → SERVICES (`#services`) → ABOUT + QUALIFICATIONS (`#about`, `#qualifications`) → CONTACT (`#contact`) → FOOTER.
- **JS** (inline IIFE at the bottom): hero `Duct3D` instance (slow spin, stops on drag, off under reduced motion), product tab switching with arrow keys, hamburger toggle, `#year`.
- **Motion:** the hero duct is the only non-user-triggered motion; there is no scroll-reveal.
- The brand is two images: `assets/img/logo.png` (the 昌杰立盛 mark with 合作共赢 共创未来, cleaned from the manual's page header; also `favicon.png`) followed by a live-text lockup (`.brand-txt`: 昌杰立盛 + 复合风管与防排烟系统). The full legal name is deliberately not in the header; it lives in the footer, About, licence table, contact and exported 清单. The mark has a white background — it sits on the white header and on a white chip in the footer; do **not** CSS-invert it. `logo-wordmark.jpeg` (the long name wordmark) is no longer used by these two pages.
- Only the company's own photos go on the public site. Third-party reference photos (e.g. `assets/img/xhs-piaozhu/`, untracked) must not be published.

## Editing conventions

- Shared chrome lives in `assets/site.css`; page-specific styles and scripts stay inline in each page. Reuse the existing tokens and section-banner pattern rather than introducing new ones.
- Product specs appear in three places that must agree: the `prod-panel` articles in `index.html`, `LINES` in `configurator.html`, and `manual.html`.
- Pull any new copy/specs/contact info from the verified company data above (the legacy sources that once held it are gone).
- To ship, commit to `main` and push — GitHub Pages redeploys to changjielisheng.com.
