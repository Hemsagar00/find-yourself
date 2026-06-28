# Find Yourself

**Zero-cost, fully open-source OSINT tool** for email and mobile number intelligence.

Built with Next.js 16 (static export) — deployable to **Cloudflare Pages** at zero recurring cost.

> **ETHICAL USE ONLY**  
> This tool only queries public data. Respect India's DPDP Act and all privacy laws.  
> Do not use for harassment, stalking, fraud, or illegal purposes.

## Features

### Unified Smart Search
- Auto-detects **email** vs **phone number** (+91 India excellent support)
- Batch paste (multiple lines / CSV-style)

### Email OSINT
- Have I Been Pwned breaches (with demo fallback)
- Gravatar, GitHub public profile, risk scoring
- Domain info

### Mobile Number OSINT (Core Addition)
- `libphonenumber-js` parsing + validation
- India carrier hints (Jio, Airtel, Vi, BSNL)
- **Powerful Dork Generator** — PhoneInfoga-inspired categorized dorks
- One-click "Copy Dork" + "Search in Google"
- Free public lookup tool links

### Dashboard & Export
- Modern tabbed results (Overview, Metadata, Breaches/Dorks, Investigation Hub)
- Framer Motion animations
- Export: JSON, CSV (papaparse), PDF (jsPDF + disclaimer)
- Local history (localStorage)
- Strong ethical disclaimers (English + Telugu)

## Tech Stack (100% Free & Client-Side)
- Next.js 16 + TypeScript + Tailwind v4 + static export
- libphonenumber-js, framer-motion, jspdf, papaparse, zod, react-hook-form
- No backend, no paid APIs, no keys required

## Getting Started

```bash
npm install
npm run dev
```

Visit http://localhost:3000

### Build & Deploy to Cloudflare Pages

```bash
npm run build          # generates `out/`
npm run deploy         # uses wrangler (or connect GitHub in dashboard)
```

**Dashboard settings (GitHub connection recommended):**
- Build command: `npm run build`
- Output directory: `out`

See `wrangler` script in package.json.

## Project Structure

```
app/
  page.tsx            # Main unified search + results dashboard
lib/
  phone-utils.ts      # Parser, carrier map, powerful dork generator (pure client)
components/           # Future reusable UI pieces
```

## Ethical Policy & Compliance

- Only public data
- Clear disclaimers in UI + exports
- DPDP Act (India) reference
- Telugu language support for accessibility

## Contributing

Improvements welcome:
- More India carrier prefixes
- Better dork patterns
- Additional free lookup integrations
- UI/UX polish

Open a PR!

## License

MIT — Use responsibly.

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
