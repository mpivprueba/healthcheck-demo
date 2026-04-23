# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript check (tsc -b) + production build to /dist
npm run lint      # Run ESLint on entire project
npm run preview   # Serve the production build locally
```

## Architecture

This is a single-page React 19 + TypeScript demo application built with Vite. There is no backend, no API, and no authentication — all data is hardcoded in `src/data/meridianData.ts`.

**Entry flow:** `index.html` → `src/main.tsx` → `src/App.tsx`

### Core concept: Three-layer finding model

The app demonstrates a consulting engagement product for vulnerability management assessments. Each "finding" can carry up to three layers of data:

1. **Automated Baseline** — API-derived metrics (always present)
2. **Organizational Context** — questionnaire responses that reshape baseline interpretations (live recalculation for findings 1.1, 2.1, 4.1)
3. **Advanced Analysis** — consultant annotations, custom findings, score overrides

### Key files

| File | Purpose |
|------|---------|
| `src/types.ts` | All TypeScript interfaces (`Finding`, `DemoData`, `Annotation`, `ScoreOverride`, etc.) |
| `src/data/meridianData.ts` | The entire demo dataset for fictional customer "Meridian Financial Services" — 16 findings, 6 questionnaire-only findings, 9 enrichments, 4 custom findings, annotations, and an engagement record |
| `src/App.tsx` | All UI logic: screen routing, role toggle, questionnaire state, live recalculation, and rendering |

### State and navigation in App.tsx

`App.tsx` is a large single-component file that manages:

- **`currentScreen`** — one of: `dashboard`, `findings`, `questionnaire`, `engagement`, `report`, `expansion-opportunities`, `interview-guide`
- **`userRole`** — `'customer'` | `'consultant'` (client-side toggle, no auth)
- **`questionnaireAnswers`** — drives Layer 2 recalculation; changes propagate to specific findings via the enrichment system in `meridianData.ts`

Consultant-only screens: `interview-guide`, `expansion-opportunities`, `engagement`.

### Data relationships

Each `Finding` in `meridianData.ts` references `ContextEnrichment` entries (keyed by Q-numbers like `Q1`, `Q2`). When a questionnaire answer changes, the enrichment's `output` replaces the `baselineInterpretation` for that finding — this is the live recalculation mechanism.

### Styling

TailwindCSS v4 (loaded via `@tailwindcss/vite` plugin). Global CSS variables (`--accent`, `--border`, `--text`, etc.) are defined in `src/index.css`. Font is Inter via Google Fonts.
