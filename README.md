# Pretty Damn Sweet

A static site for the immersive content studio **Pretty Damn Sweet**, built with
[Astro](https://astro.build) and a [Decap CMS](https://decapcms.org) admin panel.
The visual design is modeled on the Egnis Webflow template (dark oversized display
type, monospace micro-labels, hairline dotted dividers, numbered accordions), with
the store/cart, pricing, testimonials, blog and FAQ sections removed.

All project data was imported from the original Webflow CSV export
(`Projects` collection, 153 items).

## Requirements

- Node.js 18+ (developed on Node 24)

## Getting started

```bash
npm install
npm run dev
```

The site runs at http://localhost:4321.

## Content & CMS

Content lives in two places, both editable through the CMS:

- **Projects** — one Markdown file per project in `src/content/projects/`.
  Frontmatter holds structured fields (client, videos, image galleries, credits,
  categories, order, featured/draft flags); the Markdown body is the project summary.
- **Site settings** — `src/content/settings/site.json` holds brand info, hero copy,
  about text, stats, services and the "Why PDS" items.

### Editing with Decap CMS (local)

The admin panel is at `/admin/` (in `astro dev` use `/admin/index.html`).
To edit locally without any account, run the file-system proxy in a second
terminal while the dev server is running:

```bash
npm run cms      # starts decap-server on port 8081
```

Then open the admin, click **Login** (no credentials needed), and edits are written
straight back to the content files.

### Editing on the live site (production)

The admin panel at **https://prettydamnsweet.vercel.app/admin/** uses the GitHub
backend: editors sign in with a GitHub account that has write access to this repo,
edit content in forms, and hit **Publish**. Each publish is a commit to `main`,
which triggers a Vercel redeploy (live in ~1 minute).

One-time setup (repo owner):

1. Create a GitHub OAuth app at https://github.com/settings/applications/new
   - Application name: `Pretty Damn Sweet CMS`
   - Homepage URL: `https://prettydamnsweet.vercel.app`
   - Authorization callback URL: `https://prettydamnsweet.vercel.app/api/callback`
2. In the Vercel project → Settings → Environment Variables, add:
   - `OAUTH_GITHUB_CLIENT_ID` — the OAuth app's Client ID
   - `OAUTH_GITHUB_CLIENT_SECRET` — a generated client secret
3. Redeploy. The login flow is handled by the serverless functions in `api/`.

To invite a non-developer editor, add their GitHub account as a collaborator on
this repo (Settings → Collaborators) with **Write** access.

## Re-importing the CSV

To regenerate all project files from a Webflow CSV export:

```bash
npm run import -- "path/to/export.csv"
```

The default path points at the original export in `Downloads`. The script
(`scripts/import-csv.mjs`) parses multi-line quoted HTML fields, splits
semicolon-separated image lists, maps the `Portfolio Page` column to categories,
and rewrites legacy `uploads-ssl.webflow.com` asset URLs to `cdn.prod.website-files.com`.

> Note: re-running the import overwrites everything in `src/content/projects/`,
> including edits made through the CMS.

## Build

```bash
npm run build      # outputs static site to dist/
npm run preview    # preview the production build
```

## Project structure

```
src/
  components/      Nav, Footer, Hero, WorkCard, FeaturedWork, Accordion, VideoEmbed
  content/
    projects/      153 project Markdown files (CMS-managed)
    settings/      site.json (CMS-managed site copy)
  layouts/         Layout.astro (fonts, nav, footer)
  pages/
    index.astro              Home
    about.astro              About
    contact.astro            Contact
    portfolio/[category]     Category listing (design-and-motion, branded-content, ...)
    work/[slug]              Project detail
  styles/global.css          Design tokens & shared utility classes
public/
  admin/           Decap CMS (index.html + config.yml)
scripts/
  import-csv.mjs   Webflow CSV -> content importer
```

## Pages

- `/` — hero, studio intro + mission/vision, selected works, services, why PDS
- `/portfolio/design-and-motion`, `/branded-content`, `/immersive-experiences`
  (plus `healthcare`, `sports`, `film-and-theater`)
- `/work/<slug>` — full project detail (video, style frames, process, BTS, credits)
- `/about`, `/contact`
