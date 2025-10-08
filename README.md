# MicrosoftDocs Change Tracker — React + TypeScript + Tailwind (shadcn-style)
Bought to you by https://marshsecurity.org/

- Live **repo autocomplete** in `MicrosoftDocs` org (debounced)
- GitHub Search is **repo-scoped**; results filtered client-side by repo for safety
- Cards link to **View changed files** (PR files tab)
- Lazy file inspection to label **New Docs** vs **Updated Docs**
- Cloudflare Pages Function caches search at the edge

## Dev
```bash
npm ci
npm run dev
```

## Build & Deploy
Push to `main`. The included GitHub Action builds to `dist/` and deploys to Cloudflare Pages.
Add secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Optionally set Pages env var `GITHUB_TOKEN`.

## RSS Feeds
Each repository has an RSS feed of merged PRs:
`/api/rss?repo=<owner>/<repo>&days=14[&q=extra+query]`
All items link directly to the PR “Files” tab.

