# Find Yourself

Professional email OSINT / reconnaissance tool. Enter any email to analyze public breach data, domain info, GitHub footprint and risk scoring.

> **Note**: Live HaveIBeenPwned lookups are performed client-side and are often blocked by CORS in browsers. The app gracefully falls back to realistic demo data so the full UI/UX can be previewed. For production-grade live data, deploy behind a lightweight proxy that adds the required headers / API key.

## Features
- Single + batch email analysis
- Breach history (HIBP)
- Gravatar, domain age (simulated), MX records
- GitHub profile lookup
- Risk scoring
- Quick external OSINT links (Google, LinkedIn, WHOIS)
- Export results (JSON)
- Fully static-export friendly (Next.js)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

Build for static hosting:

```bash
npm run build
# output goes to `out/`
```

## Tech
- Next.js 16 (App Router, static export)
- TypeScript + Tailwind v4
- Sonner toasts, lucide icons

## Deploy

This is a **static site** (`output: 'export'`). Perfect for Cloudflare Pages.

### Recommended: Connect GitHub (auto-deploy)

1. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **Create a project** → **Connect to Git**
3. Select your repo: `Hemsagar00/find-yourself`
4. Configure:
   - **Framework preset**: `Next.js` (or None)
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
5. Save and deploy.

Future pushes to `main` will auto-deploy. Preview deployments for PRs too.

### Quick deploy with Wrangler (CLI)

```bash
# 1. Login to Cloudflare (one time)
npx wrangler login

# 2. Deploy (builds + deploys the `out/` folder)
npm run deploy
```

Or manually:

```bash
npm run build
npx wrangler pages deploy out --project-name find-yourself
```

First deploy will prompt to create the Pages project named `find-yourself`.

### Custom Domain

After deploy:
- In Pages project settings → Custom domains
- Add your domain and follow DNS instructions.

### Environment variables (if needed later)

Set them in the Pages dashboard (Settings → Environment variables). They are available at build time for static.

## License
Open source. Use responsibly and ethically. Do not use for malicious purposes.
