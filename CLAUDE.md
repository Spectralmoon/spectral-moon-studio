# Spectralmoon Studio — Claude Code Workspace

---

## Identity

You are helping **Susana Barrero** build and maintain the **Spectralmoon Studio website** — a static HTML/CSS/JS site hosted on GitHub Pages.

- QA background — explain code changes clearly before making them, flag edge cases
- Code-literate but not a daily coder — plain English first, then the code
- Design eye — visual decisions must follow the Atlas V2 direction (see References)
- Deploy is simple: `git push` → live in ~2 minutes. No build step, no CI.

**Rules:**
- Never use pure black — `--espresso #2A201A` for all outlines and shadows
- Never add a framework — stay static HTML/CSS/vanilla JS
- Preserve WCAG AA accessibility from the current build
- Always check the palette tokens before writing any CSS colour value
- Before any DNS or domain change: read the Technical & Hosting Reference in Obsidian

---

## Context

### Active — V2 re-skin (Atlas direction)

Re-skinning the existing site to the Atlas aesthetic. NOT a rebuild. Same files, same structure — visual layer changes only unless a feature requires new code.

**What's changing:** colours → Atlas palette tokens, typography → Fraunces + Inter Tight, hero imagery → Atlas risograph illustrations, overall feel → chic + commercial (away from poetic/mystical).

**What stays:** static structure, GitHub Pages hosting, accessibility, mobile responsiveness, performance.

**Open decisions — resolve before coding these sections:**
- Hero copy (3 options — ask Susana)
- Pillar names (3 options — ask Susana)
- Featured work — placeholder or Sepal commercial
- Hero scene — which Atlas world leads
- Atlas map — interactive or static

### Atlas palette tokens — use these everywhere

```css
--cream:      #F2EBDC;
--rose-pink:  #E68FA8;
--rose-deep:  #C76A89;
--cochineal:  #A8302C;
--indigo:     #26415C;
--teal:       #1F4E5C;
--ochre:      #9B6B3D;
--sage-teal:  #6B8E7E;  /* Tara only */
--espresso:   #2A201A;  /* NO pure black */
--sun-gold:   #F2C94C;  /* jewellery/accent only */
```

### Typography

- **Fraunces** — display/hero: italic 800, ~200px hero, 96px statement, 48px pillars
- **Inter Tight** — UI/body: 12–14px, uppercase, 0.22–0.32em letter-spacing
- **Caveat** — handwrite accent, optional

---

## References

**Repo:** `git@github.com:Spectralmoon/spectral-moon-studio.git`
**Live site:** https://spectralmoonstudio.com
**Deploy:** `git push` to main → auto-publishes via GitHub Pages (~2 min)
**Stack:** Static HTML / CSS / vanilla JS. No build step.

**Files in this repo:**
- `index.html` — main page
- `style.css` — all styles
- `script.js` — interactions
- `thumbnails/` — portfolio thumbnails
- `videos/` — video assets

**Atlas assets (in Obsidian vault, commit to repo when ready):**
- Rendered PNGs live at: `Spectralmoon Studio/Studio mode/Worlds/Atlas/Cast/`
- Naming convention: `NN-world-subject-vN.png`
- Commit to: `assets/atlas/` in this repo

**Full brand context in Obsidian vault:**
- V2 Master Brief: `Spectralmoon Studio/Studio mode/Worlds/Atlas/Atlas — Master Brief V2.md`
- Style Guide: `Spectralmoon Studio/Studio mode/Worlds/Atlas/Atlas — Style Guide.md`
- Technical Reference: `Spectralmoon Studio/Spectralmoon Studio — Technical & Hosting Reference.md`
