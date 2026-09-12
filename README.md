# Scotland's 32 Local Authorities — interactive map

A simple static website designed for GitHub Pages. It uses plain HTML, CSS and JavaScript, with no server-side code or build step.

## What is included

- 32 local-authority hotspots
- keyboard-accessible SVG hotspots
- responsive layout
- search/filter
- information panel
- all authority descriptions live in [data/details.md](data/details.md) — a plain markdown file, so non-developers can edit the content without touching any code

## Editing the content

Open `data/details.md` in any text editor. Each local authority has its own `## Heading` — the heading text must match the authority name exactly as it appears on the map. Leave a blank line between paragraphs, and you can use `**bold**`, `*italic*` and `[link text](https://example.com)` links.

Because the page loads this file with `fetch()`, previewing locally requires a simple local web server (opening `index.html` directly from disk will not load the content). For example, run `python3 -m http.server` in the project folder and visit `http://localhost:8000`. This isn't a problem once the site is hosted on GitHub Pages.

## Important note about the map

The map uses real 2024 local authority boundary data (ultra-generalised) from the [ONS Open Geography Portal](https://geoportal.statistics.gov.uk/), simplified for display. Boundaries are illustrative rather than survey-accurate.

## GitHub Pages

Put these files in a GitHub repository, then go to **Settings → Pages → Build and deployment** and choose **Deploy from a branch**, selecting `main` and `/ (root)`.

The site entry point is `index.html`.
