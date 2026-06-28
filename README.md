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
Works great on GitHub Pages, Vercel, Cloudflare Pages, Netlify (static).

## License
Open source. Use responsibly and ethically. Do not use for malicious purposes.
