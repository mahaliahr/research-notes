_Last updated: 2025-11-03_

This document summarises the working model for [[PhD-Live]], covering how notes, site code, and deployment flow together.

---

### 1. Overview

PhD-Live brings together:
- **Obsidian Vault** → the live and evolving _phd-notebook_  
  (`src/site/notes`)
- **Website Codebase** → the Eleventy / Digital Garden build  
  (`layouts`, `helpers`, `assets`, etc.)
- **Vercel Deployment** → publishes the site automatically when `main` updates.

Notes change daily, while code changes less frequently.  
To keep both smooth, the workflow separates **content** (notes) from **infrastructure** (site).

---

### 2. Branch Strategy

| Branch | Purpose | Deploys to |
|---------|----------|------------|
| `main` | Stable branch; holds live site content + notes | **Vercel Production** |
| `dev` | Active development; test layouts, scripts, features | **Vercel Preview** |
| `feature/*` | Short-term work branches off `dev` | **Vercel Preview** |

---

### 3. Daily Note Workflow

1. Work in Obsidian as usual.  
   The vault folder (`src/site/notes`) is part of this repository.

2. Commit your note updates:
 ```bash
   git add src/site/notes
   git commit -m "note: update daily reflections"
   git push origin main
```   
3. Vercel automatically rebuilds and redeploys the live site.
	Notes on `main` are always the “truth.”  
	Site code evolves separately in branches.

### 4. Site Development Workflow

When working on styling, layouts, or functionality:

```
git checkout dev
# or create a feature branch
git checkout -b feature/layout-tweaks
```
Work, test locally (`npm run start`), and push:
```
git add .
git commit -m "feat: adjust homepage styling"
git push origin dev
```
Vercel automatically builds a **Preview Deployment** for your `dev` branch.  
When it looks good → merge `dev` into `main` via PR.

### 5. Merging Without Note Conflicts

To avoid merge chaos (since notes change constantly):
`.gitattributes`

```
src/site/notes/**/*.md merge=ours
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.mp4 binary
*.mov binary
*.wav binary
*.mp3 binary
```
Then run this **once per machine**:
```
git config merge.ours.driver true`
```
Now, when merging `dev` → `main`, your current branch’s notes always win, automatically.

### 6. Optional: Separate Vault Repo (Advanced)

If you later want to separate your vault entirely:

- Keep `phd-notebook` as its own repo.
- Pull it into the site as a subtree:
```
git remote add vault https://github.com/<you>/phd-notebook.git
git subtree add --prefix=src/site/notes vault main --squash
```
This lets you work freely in your Obsidian repo and decide when to sync.

### 7. Deployment

- **Vercel Production:** Auto-builds when `main` changes.
- **Vercel Preview:** Builds automatically for every branch (`dev`, `feature/*`).

To push a dev build live without merging:

> Vercel → Deployments → _Select the latest preview_ → **Promote to Production**

### 8. Quick Commands Reference

| Action                       | Command                                                           |
| ---------------------------- | ----------------------------------------------------------------- |
| Start local server           | `npm run start`                                                   |
| Build static site            | `npm run build`                                                   |
| Commit notes only            | `git add src/site/notes && git commit -m "note: …"`               |
| Switch to dev branch         | `git checkout dev`                                                |
| Merge dev into main          | `git checkout main && git merge dev`                              |
| Force-resolve note conflicts | `git checkout --ours -- src/site/notes && git add src/site/notes` |
| Push to GitHub               | `git push origin <branch>`                                        |
### 9. Good Habits

- Keep `main` clean — production-ready notes and stable site code.
- Use `dev` for anything experimental.
- Commit small and descriptive messages (e.g., `note:`, `feat:`, `fix:`).
- Don’t panic about merge conflicts — `.gitattributes` keeps note merges calm.
- Backup your vault separately (e.g., OneDrive already handles this).

### 10. Future Ideas

- Automate `daily` note creation (via Obsidian Templater).
- Generate milestone summaries dynamically.
- Visualise “live now” and session metadata from note frontmatter.