# PhD Research Site

This repository contains the source for my **live PhD research website**, built with [Eleventy](https://www.11ty.dev/) and synced with my [Obsidian](https://obsidian.md/) vault.

It serves as both a **digital garden** and a **public research log**, reflecting my ongoing doctoral work — exploring learning, creativity, and generative AI.

---

## Overview

- **Digital Garden -** Publishes selected Obsidian notes directly to the web  
- **Live Dashboard -** Displays current sessions, milestones, and micro-updates  
- **Live Data Streams -** JSON feeds generated from note content  
- **Research Blog -** Longer reflective pieces and project documentation  

Inspired by the practice of Livecoding, the aim is to **“live broadcast”** my research, making the process visible while maintaining a light, sustainable workflow.

---

## Project Structure

```
src/
├── site/
│ ├── notes/ # Obsidian vault (main content)
│ │ ├── _templates/ # Frontmatter templates for note types
│ │ ├── published/ # Public-facing notes and reflections
│ │ └── references/ # Annotated readings and citations
│ ├── _data/ # Eleventy computed data
│ ├── _includes/ # Layouts, components, graph scripts
│ └── assets/ # JS, CSS, and static media
├── helpers/ # Eleventy helpers (linking, graph, user setup)
└── tools/ # Utility scripts (bulk frontmatter, etc.)
```

<!-- Deployed automatically to **Vercel** at  
-> `https://phd.mm-hr.com`~~ -->

---

## Live Research Tracking System
The system automatically generates live data from markdown notes — no manual input or separate data entry.

| Feed | Source Pattern | Output | Description |
|------|----------------|---------|--------------|
| **Milestones** | Checkboxes tagged `#milestone` (optionally with `@YYYY-MM-DD`) | `/data/milestones.json` | Tasks and goals (open/closed) |
| **Sessions** | Notes with `start::`, `end::`, `topic::` | `/data/sessions.json` | Work sessions; shows as *LIVE* if no `end::` |
| **Stream** | Bullet list lines with timestamps (`- HH:MM …`) | `/data/stream.json` | Short progress log entries |

### Example Syntax

#### Milestone
```markdown
- [ ] Ethics amendment v2 #milestone @2025-11-03
- [x] Submit pilot prereg #milestone @2025-09-27
```

#### Session
```markdown
start:: 2025-10-18T09:30
end::   2025-10-18T11:00
topic:: Pilot data cleaning
```

#### Stream
```markdown
- 10:15 Wrote introduction draft
- 14:45 Revised proposal feedback
```

Each time you rebuild, Eleventy parses these patterns and writes them into the corresponding JSON files under `/dist/data/`.

---

## Live Tracking Syntax Reminder (for notes)

Add this invisible comment below your front matter in any note to remind yourself of the syntax:

```markdown
<!--
Live Tracking Syntax Quick Reference
- [ ] #milestone @YYYY-MM-DD
start:: YYYY-MM-DDTHH:mm
end::   YYYY-MM-DDTHH:mm
topic:: Topic here
- HH:MM short stream entry
-->
```

These comments:
- stay visible in Obsidian edit mode  
- are ignored by Eleventy and do **not** appear on the public site  

---

## Development

### Install dependencies
```bash
npm install
```

### Run locally
```bash
npx @11ty/eleventy --serve
```
Visit [http://localhost:8080](http://localhost:8080)

### Build for production
```bash
npx @11ty/eleventy
```

The built site will appear in `/dist`.

### Deploy
Deployed automatically via **Vercel**, connected to the `main` branch of this repo.  
Development work happens in the `dev` branch and merges when stable.

---

## Setup and Troubleshooting

- Ensure your Obsidian vault lives in `src/site/notes.`

- If you move or rename your vault, re-link it by updating or recreating the symbolic link:

```
rm -rf src/site/notes
ln -s ~/path/to/vault src/site/notes
```
- If you get YAML or frontmatter errors, check for invalid date values or line breaks in `---` blocks.

- Use node `tools/bulk-frontmatter.js src/site/notes --kind=note --prefix=/notes --write` to refresh metadata across files.

When 11ty can’t find layouts, confirm `layout:` paths (e.g., `layouts/note.njk`) exist under `_includes/layouts`.

---

## Credits

Built on [@oleeskild’s Obsidian Digital Garden](https://github.com/oleeskild/obsidian-digital-garden)  
Extended with custom Eleventy components for live research tracking.  
