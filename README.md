# Automated GitHub Portfolio Showcase

This repository contains the homepage and automated portfolio showcase system for **Tcode-Motion** (hosted at [techscript.is-a.dev](https://techscript.is-a.dev/)).

It automatically queries the GitHub REST API to find all public, active repositories belonging to `Tcode-Motion`, validates which repositories are hosting live web applications, scrapes metadata (e.g., titles, descriptions, favicons, OG images) from those sites, and generates a dynamic showcase page.

---

## Architecture & Folder Structure

```
Tcode-Motion.github.io/
│
├── index.html                   # Main page (TechScript docs + dynamic Projects showcase)
├── projects.css                 # Namespaced styling for the Projects showcase
├── script.js                    # Dynamic fetching, caching, and filter/search rendering
├── projects.json                # AUTO-GENERATED: Projects metadata database
│
├── scripts/
│   └── generate_projects.py     # Python scraper and validation script
│
└── .github/
    └── workflows/
        └── update-projects.yml  # GitHub Actions cron & push trigger automation
```

---

## How It Works

1. **Discovery**: A Python scraper connects to the GitHub REST API to fetch all repositories of `Tcode-Motion` (handles pagination, token authorization, and API rate limits).
2. **Filtering**: Non-website repositories are excluded based on strict rules (forks, templates, archived, private, empty, starts-with-dot, or the Pages root portfolio repo `Tcode-Motion.github.io`).
3. **Deployment Check**: For each repo, it checks the Pages deployments API. If there is a successful deployment, it validates the URL. If the deployment is in progress or unavailable, it directly attempts to validate the URLs.
4. **URL Validation**: Tests the repository `homepage` field or constructs `https://techscript.is-a.dev/<repo-name>/`. It uses exponential backoff retries (3 attempts) to handle temporary 503/404 errors during deployments.
5. **Scraping**: It crawls the live URL's HTML to parse its title, description, favicon, OpenGraph metadata, and theme color.
6. **Asset fallback**: If no `og:image` is defined, it checks for standard images (e.g., `banner.webp`, `cover.png`, `preview.webp`, etc.). If none exist, it falls back to the automated GitHub OpenGraph Social Preview to ensure a high-quality card preview.
7. **Database Generation**: Generates a sorted, pretty-printed `projects.json` file. It only overwrites the file if the content has changed to avoid empty git commits.
8. **GitHub Action**: An automated runner runs on pushes, daily at midnight UTC, or manual trigger to update `projects.json`. It runs concurrency guards to prevent overlapping runs.
9. **Frontend**: When the user loads the page, `script.js` loads the projects instantly from a `localStorage` cache. In the background, it fetches the fresh `projects.json` and updates the cards smoothly if there are differences.
10. **Aesthetics & Performance**: Cards match the site's dark glassmorphism. It supports instant searching, language chips, topic filters, sorting, lazy-loaded images, and canvas-based gradient fallbacks.

---

## Local Development & Setup

### Requirements
- **Python 3.10+**
- **pip** packages: `requests`, `beautifulsoup4`

### Install Dependencies
```bash
pip install requests beautifulsoup4
```

### Running the Scraper
Run the generator script locally to scan repositories and create/update `projects.json`:
```bash
python scripts/generate_projects.py
```
> [!TIP]
> To avoid hitting GitHub's unauthenticated API rate limits (60/hour), configure a personal access token (PAT) as an environment variable before running:
> ```bash
> # Linux/macOS
> export GITHUB_TOKEN="your_personal_access_token"
> 
> # Windows (PowerShell)
> $env:GITHUB_TOKEN="your_personal_access_token"
> ```

---

## GitHub Actions Automation

The scraper is fully automated. The workflow is located at `.github/workflows/update-projects.yml`.

- **Trigger Conditions**:
  - Every `push` to the `main` branch.
  - Daily cron schedule at midnight UTC.
  - Manual triggers via the **Actions** tab on GitHub (**Run workflow**).
- **Concurrency**:
  - The workflow contains a concurrency guard to cancel older runs if a new commit is pushed during execution.
- **Committing**:
  - The bot checks the diff. It will **only** commit and push the updated `projects.json` if there are actual project changes (excluding the generated timestamp), preventing unnecessary repository history bloat.

---

## Customization

### Exclude Specific Repositories
To exclude more repositories or change default rules, edit the validation checks inside `process_repository` in `scripts/generate_projects.py`.

### Change Image Detection Order
To modify which filenames the scraper checks on the live site when looking for preview images, adjust the `candidates` array inside `select_preview_image` in `scripts/generate_projects.py`.

---

## Troubleshooting

### Scraper returns rate limit warnings
Ensure a valid `GITHUB_TOKEN` is supplied to the environment. The GitHub Actions runner automatically handles this using the built-in repository token.

### A repository is hosted but does not show up
1. Confirm the repository is **public**, **active** (not archived/disabled), and **not a fork**.
2. Make sure it is not empty (it must have a non-zero size and pushed files).
3. Ensure its live website is returning a `200 OK` status. If it's a new deploy, wait a few minutes for GitHub Pages to complete building and try again.
4. Verify the `homepage` URL in the GitHub repository Settings is correctly filled out or that the site is accessible at `https://techscript.is-a.dev/<repo-name>/`.
