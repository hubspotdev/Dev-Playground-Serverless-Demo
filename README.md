This repository was created as part of the HubSpot Developer Playground Virtual Event. The code demonstrates how to use serverless functions. It is provided as-is, without warranty or support.

# Cosmic Contacts

A HubSpot Developer Platform demo app built on `2026.03`, designed for a conference talk on serverless functions.

The app shows the NASA Astronomy Picture of the Day from the date you last connected with each contact — or the day they became your customer. Click **"Reveal Their Star"** and see what the cosmos looked like on that exact day.

---

## What it demonstrates

- **Serverless functions** — Keep API keys safe on the server. The NASA API key lives in `process.env`, never in client code.
- **`useCrmSearch` hook** — Query CRM data directly from a UI extension without writing a serverless function for reads.
- **npm workspaces** — Share utility code across CRM cards and App Pages.
- **CRM cards** — Extend contact records with custom UI tabs.
- **App Pages** — Full-page experiences inside HubSpot with page routing.
- **Security anti-pattern** — An intentionally insecure card shows what happens when you put an API key in client-side code (spoiler: it leaks in the Network tab).

---

## Project structure

```
cosmic-contact-board/
├── hsproject.json                              # Project config (platform 2026.03)
├── slides/                                     # Presentation materials
└── src/
    └── app/
        ├── app-hsmeta.json                     # App config (private, static auth)
        │
        ├── packages/
        │   └── cosmic-utils/                   # Shared utilities (npm workspace)
        │       ├── package.json
        │       └── index.js                    # toApodDate, contactDisplayName, etc.
        │
        ├── pages/
        │   ├── pages-hsmeta.json
        │   ├── package.json
        │   └── Pages.jsx                       # App Page — contact board with useCrmSearch
        │
        ├── cards/
        │   ├── CosmicCard.jsx                  # CRM card — secure APOD lookup via serverless
        │   ├── cosmic-card-hsmeta.json
        │   ├── InsecureApodCard.jsx            # CRM card — intentionally insecure (demo only)
        │   ├── insecure-apod-card-hsmeta.json
        │   └── package.json
        │
        └── functions/
            ├── CosmicSnapshot.js               # Minimal serverless function (live-code on stage)
            ├── cosmic-snapshot-hsmeta.json
            ├── CosmicSnapshotProduction.js     # Production version with error handling
            ├── cosmic-snapshot-production-hsmeta.json
            └── package.json
```

### npm workspaces

The `src/app/package.json` defines workspaces so that both `cards/` and `pages/` can import shared code from `@cosmic-contacts/utils`:

```
"workspaces": ["cards", "pages", "packages/*"]
```

The shared package exports date formatting, display name helpers, and outreach message generation — all using ES module syntax (required by HubSpot's Rollup-based build).

---

## Key files

**`Pages.jsx`** — The App Page. Uses `useCrmSearch` to fetch your 10 most recent contacts directly from the CRM (no serverless function needed). Shows today's APOD as a hero, then lists contacts with "Reveal Their Star" buttons. Revealed snapshots include a "Draft Outreach" button that generates a personalized message.

**`CosmicCard.jsx`** — A CRM record card that appears on contact tabs. Calls the `cosmic_snapshot_production` serverless function to fetch the APOD for that contact's last-contacted date.

**`InsecureApodCard.jsx`** — Intentionally insecure. Calls the NASA API directly from client-side code with the key in the URL. Includes a "Reveal what just leaked" button to show the audience the exposed key. Paired with the secure card to show why serverless functions matter.

**`CosmicSnapshot.js`** — The minimal serverless function (7 lines of logic) that you type live on stage. Calls the NASA APOD API with the key safely in `process.env`.

**`CosmicSnapshotProduction.js`** — The production-grade version. Handles missing keys, network failures, rate limits, invalid dates, video responses, and malformed API responses. Pre-deployed as a fallback if the live build fails.

---

## Prerequisites

- [HubSpot CLI](https://developers.hubspot.com/docs/developer-tooling/local-development/hubspot-cli/install-the-cli) v8.4.0+
- A HubSpot developer test account with `2026.03` beta access
- A free [NASA API key](https://api.nasa.gov) (instant — fill in name and email, key appears on screen)

---

## Setup

### 1. Get a NASA API key

Go to [api.nasa.gov](https://api.nasa.gov), fill in your info, and the key appears immediately. The free tier allows 1,000 requests per hour.

### 2. Add the secret to HubSpot

```bash
hs secret add NASA_API_KEY
```

Paste your key when prompted. Verify with `hs secret list`.

### 3. Deploy

```bash
hs project upload
```

On first upload HubSpot creates the project and prompts you to install the app. After that, subsequent uploads redeploy automatically.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `NASA_API_KEY secret is not configured` | `hs secret add NASA_API_KEY` |
| `NASA API returned 403` | Wrong key — `hs secret update NASA_API_KEY` |
| `NASA API returned 429` | Rate limit — wait a moment (1,000 req/hour free) |
| Video instead of image | Some APOD days feature videos — the UI handles this |
| Secret update not taking effect | Re-upload: `hs project upload` |
