# Winx Carpentry — Marketing Website

A multi-page marketing site for **Winx Carpentry**, Sydney's commercial fitout
specialists (retail · office · franchise). Plain static **HTML, CSS and vanilla
JS** — no framework, no build step.

Design direction: *craft studio meets architecture firm* — dark, editorial,
premium, motion-driven.

---

## Tech / features

| Area | Implementation |
|------|----------------|
| Motion | [GSAP](https://gsap.com) + ScrollTrigger (parallax, reveals, counters, pinned process) via CDN |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) via CDN, fed into ScrollTrigger |
| Page transitions | Native CSS **View Transitions** (`@view-transition { navigation: auto; }`) |
| Fonts | Archivo (display) + Hanken Grotesk (body) via Google Fonts |
| Forms | Contact form posts to **Formspree** (AJAX, no backend) |
| A11y | Semantic HTML, alt text, keyboard-navigable nav/FAQ, visible focus, `prefers-reduced-motion` fallback that disables the heavy motion |
| Responsive | Mobile-first, fluid type (`clamp()`), CSS grid |

> **Note on motion:** all GSAP/Lenis animation is gated behind
> `prefers-reduced-motion`. With reduced motion on (or JS/CDN unavailable), every
> element renders fully visible and static — content is never hidden behind an
> animation that didn't run.

---

## Project structure

```
.
├── index.html          # Home
├── services.html       # Services + pinned "our process"
├── projects.html       # Filterable parallax project gallery
├── about.html          # Story, pillars, animated stat counters, testimonials
├── contact.html        # Quote form, map, FAQ accordion
├── css/
│   └── styles.css      # Design tokens + all styles
├── js/
│   └── main.js         # Lenis, GSAP motion, counters, nav, filter, FAQ, form
├── assets/
│   ├── favicon.svg     # Placeholder favicon (swap for your brand mark)
│   └── img/            # Project photography
│       ├── office-corridor-fitout.jpg     (Home hero + Projects feature)
│       ├── retail-cafe-interior.jpg
│       ├── retail-cafe-storefront.jpg
│       ├── retail-butcher-fitout.jpg
│       ├── retail-fashion-fitout.jpg
│       └── joinery-staircase-detail.jpg
└── README.md
```

---

## Run it locally

It's static — any static server works. Easiest options:

**VS Code Live Server**
1. Install the *Live Server* extension.
2. Right-click `index.html` → **Open with Live Server**.

**Python (no install on most machines)**
```bash
python -m http.server 8000
# then open http://localhost:8000
```

**Node**
```bash
npx serve .
```

> Open via `http://localhost`, **not** `file://` — View Transitions, fetch and
> some font behaviour need an HTTP origin.

---

## Deploy

### Netlify
- **Drag & drop:** zip the folder (or the folder itself) onto
  [app.netlify.com/drop](https://app.netlify.com/drop). Done.
- **Git:** connect the repo. Build command: *(none)*. Publish directory: `.` (root).

### Vercel
- `npm i -g vercel` → run `vercel` in the project folder, or import the repo at
  [vercel.com/new](https://vercel.com/new).
- Framework preset: **Other**. Build command: *(none)*. Output directory: `.`.

No environment variables or build step required.

---

## ✅ TODO before going live

There are **two** placeholders to replace:

### 1. Formspree form ID — `contact.html`
The contact form points at a placeholder endpoint:
```html
<form ... action="https://formspree.io/f/FORM_ID" ...>
```
1. Create a form at **[formspree.io](https://formspree.io)**.
2. Copy your form ID (looks like `mwkdpqab`).
3. Replace `FORM_ID` so the action reads e.g. `https://formspree.io/f/mwkdpqab`.

Until you do, submitting shows a friendly *"form not yet connected"* notice and
logs a reminder to the console — no silent failures.

### 2. Real project photos — `assets/img/`
The site ships with the supplied project photos. To update them, drop in
replacements **using the same file names** (or update the `src`/`alt` in the HTML):

| File | Used on | Suggested shot |
|------|---------|----------------|
| `office-corridor-fitout.jpg` | Home hero, Projects feature | Best wide, dark, hero-worthy fitout (≈2000px+ wide, landscape) |
| `retail-cafe-interior.jpg` | Home, Projects | Completed retail/hospitality interior |
| `retail-cafe-storefront.jpg` | Services process, Projects | Shopfront / entry |
| `retail-butcher-fitout.jpg` | Home, Projects | Franchise / retail counter |
| `retail-fashion-fitout.jpg` | Services process, Projects | Bright retail interior |
| `joinery-staircase-detail.jpg` | About, Services process, Projects | Craft / joinery detail |

**Tips:** export JPGs around 1600–2400px on the long edge, compressed
(~200–500KB). Keep the hero image wide/landscape and reasonably dark so the
bone-coloured headline stays legible. Update the favicon at
`assets/favicon.svg` with the real brand mark.

Also update the placeholder domain in each page's `<link rel="canonical">` and
Open Graph `og:url` (currently `https://www.winxcarpentry.com.au/`).

---

## Business details baked in
- **Phone:** 0411 833 069
- **Positioning:** Sydney's Commercial Fitout Specialists — retail, office &
  franchise. On time, on budget, precision craftsmanship. Free quotes.
- **Service area:** Sydney-wide.

© Winx Carpentry.
