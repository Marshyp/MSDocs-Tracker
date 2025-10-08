# MicrosoftDocs Change Tracker

A minimalist one-page React site that scans merged pull requests across the [`MicrosoftDocs`](https://github.com/orgs/MicrosoftDocs/repositories) GitHub org and presents a filterable, tagged feed.

## What it does
- Fetches **merged PRs** via the GitHub Search API (`org:MicrosoftDocs is:pr is:merged`), limited by a date window.
- Auto-tags items (Defender, Microsoft 365, Entra, Purview, Sentinel, Intune, Azure, Windows, Teams, SharePoint, Exchange, Edge, Other) based on simple keyword rules.
- Lets you **filter by tag**, **search** titles/bodies, and see **when it merged** with a link to the PR.
- Highlights items **new since your last visit** (stored in `localStorage`).
- Works as a single static file (`index.html`) — no build step required.
- Light/Dark mode toggle; respects system preference.

## Local usage
Open `index.html` in any modern browser. If you hit GitHub rate limits (60 unauthenticated requests/hour), append a token to the site URL:
`?token=<YOUR_GITHUB_TOKEN>` (fine-grained, read-only for public data). Token is used in-memory only for API calls.

## Deploy with Cloudflare Pages (GitHub Actions)
1. Create a Cloudflare **API Token** with the **Cloudflare Pages** permissions (or `Account:Cloudflare Pages:Edit`), and copy your **Account ID** from the dashboard.
2. In your GitHub repo, add these secrets (Settings → Secrets and variables → Actions → New repository secret):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Update the `projectName` in `.github/workflows/cloudflare-pages.yml` to your desired Pages project name (e.g., `microsoftdocs-change-tracker`).
4. Push to `main`. The workflow will publish the root directory to Cloudflare Pages.
5. (Optional) In Cloudflare Pages, connect a custom domain for the project.

## Configuration
- Adjust tag rules in `TAG_RULES` at the top of the script.
- Change the default lookback window by editing the `daysBack` initial value in `usePersistedState`.
- The query string search box applies to PR titles and bodies.
