# yomtov-web

A modern redesign of [e-tv.site](https://www.e-tv.site) — a Hebrew-language educational platform for Israeli students of **Electrical & Electronics Engineering**.

The original site is a Wix-hosted archive of MAHAT exams, Ministry of Education exams, assignments, labs, and calculators — decades of curated study material for practical engineering students. This project rebuilds it as a fast, accessible, SEO-first learning platform without changing the underlying content.

## Goals

- **Preserve** every exam, PDF, solution, image, and category from the original site — nothing invented, nothing dropped.
- **Rebuild** the UI/UX from scratch: modern EdTech feel, real search, real filters, real hierarchy.
- **Perform** — SSG-first with Next.js 15/16, Lighthouse ≥ 95 mobile, RTL native.
- **Respect** SEO — clean English URLs + 301 redirects from every legacy Hebrew URL.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **TypeScript** (strict)
- **Tailwind CSS 4**
- **Heebo** (Hebrew) + **Inter** (numerals) via `next/font`
- **Fuse.js** for client-side search over a build-time content index
- Deployed on **Vercel**

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout (target)

```
app/            Next.js App Router pages
components/     UI primitives, cards, layout, search, PDF
content/        JSON content model (exams, assignments, labs)
lib/            content loaders, search, slug utilities
public/         PDFs, images, downloadable assets
scripts/        crawler, asset downloader, content builder
types/          shared TS types
```

## Status

Bootstrapping — see [`../plans/redesign-glittery-lobster.md`](https://github.com/yom-tov/yomtov-web) for the full plan.
