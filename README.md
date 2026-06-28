# Find Yourself

**A zero-cost, fully open-source OSINT tool for email and mobile number intelligence.**

Built with Next.js 16 App Router (static export) — designed for **Cloudflare Pages** deployment with no recurring costs.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Unified Smart Search
- Single prominent input with auto-detection (email vs. phone number)
- Excellent support for Indian numbers (`+91`)
- Batch mode: paste multiple emails or phones (lines or comma-separated)

### Email Intelligence
- Have I Been Pwned breach data (graceful demo fallback for browser limitations)
- Gravatar, GitHub public footprint
- Client-side risk scoring
- Domain and quick OSINT links

### Mobile Number Intelligence
- Parsing & validation via `libphonenumber-js`
- India carrier hints (Jio, Airtel, Vi, BSNL and more)
- **Powerful Dork Generator** (PhoneInfoga-inspired):
  - Categorized Google dorks for Social Media, Professional Directories, Documents, Spam/Reputation, etc.
  - One-click **Copy Dork** and **Open in Google**
- Direct links to free public lookup services

### Professional Dashboard
- Clean tabbed interface: Overview, Metadata, Breaches/Dorks, Investigation Hub
- Framer Motion animations and responsive design
- Visual risk scoring
- Full export support: JSON, CSV, PDF (with embedded ethical disclaimer)
- Local search history

## Ethical & Legal Notice

> This tool **only** uses publicly available information.  
> You are solely responsible for your use.  
> Respect privacy laws (including India's DPDP Act).  
> Do **not** use this tool for harassment, stalking, fraud, or any illegal activity.

All processing happens entirely in the browser. No data is transmitted to or stored on any server by this application.

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI/Animation**: Framer Motion, Sonner (toasts), Lucide icons
- **Phone**: libphonenumber-js
- **Exports**: jsPDF, PapaParse
- **Validation**: Zod + React Hook Form (where applicable)

**100% client-side. No backend required. No paid APIs.**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Building & Deployment

```bash
npm run build
```

The `out/` directory is ready for static hosting.

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository in the Cloudflare dashboard.
2. Use these settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
3. Deploy.

Or use the CLI:

```bash
npm run deploy
```

## Project Structure

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Main application (unified search + dashboard)
│   └── globals.css
├── lib/
│   └── phone-utils.ts           # Phone parsing, carrier lookup, dork generator
├── components/                  # Reusable UI pieces (expandable)
├── public/
├── next.config.ts               # output: 'export'
└── package.json
```

## Contributing

Contributions are welcome! Areas that would help:

- Additional accurate carrier prefix data
- Improved / more dorks
- UI/UX refinements
- Better export formatting
- Accessibility improvements

Please open an issue or pull request.

## License

MIT License — use responsibly and ethically.

---

**Find Yourself** — Public data. Responsible tools. Zero cost.