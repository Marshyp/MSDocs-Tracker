# MicrosoftDocs Change Tracker — React + TypeScript + Tailwind (shadcn-style)

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

## Note on shadcn/ui
These UI primitives mimic shadcn’s API without running the CLI, so you can drop-in replace them later by running:
```bash
npx shadcn@latest init
npx shadcn@latest add button input select card badge
```
Then swap imports to `@/components/ui/*` (same paths used here).
