# InsightFlow

**Turn product data into decisions.**

InsightFlow is a lightweight product analytics platform for Product Managers, founders and
growth teams. Upload a CSV of product event data and instantly get KPIs, activity trends,
funnels, retention cohorts, feature adoption, segmentation and a RICE-based prioritization
board — plus a deterministic "AI Product Analyst" that writes up the findings in plain
English.

It runs entirely in your browser. There is no backend, no database, and no AI API key —
uploaded data never leaves your machine.

**Live demo:** https://darshannellary.github.io/InsightFlow/

<!-- Screenshots: add PNGs to a /docs or /screenshots folder and reference them here, e.g.
![Dashboard](./screenshots/dashboard.png) -->

## Product overview

Most "AI analytics" demos either fake the AI or need a backend and an API key to work. InsightFlow
does neither. The core idea:

```
UPLOAD DATA → UNDERSTAND PRODUCT → DISCOVER INSIGHTS → PRIORITIZE ACTIONS
```

Everything — CSV parsing, metric computation, cohort analysis, and "AI" insight generation —
happens client-side with plain TypeScript and statistics. That makes it free to run, safe for
sensitive data, and fast even without a server round-trip.

## Features

- **Dashboard** — KPI cards (users, activation, conversion, retention, revenue, ARPU) with
  period-over-period change, a DAU/WAU/New Users/Events trend chart, and a "Where should I
  focus?" panel that surfaces the top 3 auto-detected opportunities.
- **Analytics** — active vs. new user trends and a full event-type breakdown.
- **Funnels** — a Signup → Onboarding → Feature Usage → Purchase funnel with per-step
  conversion and drop-off, and the biggest bottleneck called out automatically.
- **Retention** — a weekly cohort retention heatmap with best/worst cohort and average
  Week 4 retention.
- **Features** — adoption, usage frequency and conversion correlation per feature, with
  "high adoption / high correlation" and "low adoption / high correlation" opportunity badges.
- **Segments** — breakdowns by plan, device and country (whichever columns exist) with
  auto-generated comparison sentences like *"Desktop users convert 2.4× more often than
  mobile users."*
- **Priorities** — a RICE (Reach × Impact × Confidence ÷ Effort) prioritization board, stored
  in `localStorage` so it survives a refresh independent of whatever dataset is loaded.
- **AI Product Analyst** — a rule-based insight engine plus a keyword-driven "Ask your product
  data" box.

The UI adapts to whatever columns are actually present — if a dataset has no `revenue` column,
revenue-dependent views explain why they're unavailable instead of rendering a broken chart.

## How it works

1. **CSV in.** [PapaParse](https://www.papaparse.com/) parses the file in-browser. The only
   required column is `user_id`; everything else (`event`, `timestamp`, `plan`, `device`,
   `country`, `revenue`) is optional and detected automatically.
2. **A capability flag set.** `deriveCapabilities()` inspects the parsed headers and event
   names once, producing flags like `hasRevenue`, `hasOnboarding`, `hasFeatureEvents`. Every
   page reads these flags to decide what it can safely render.
3. **A pure analytics layer.** `src/analytics/*` contains dependency-free functions —
   `metrics.ts`, `funnel.ts`, `retention.ts`, `segmentation.ts`, `featureAnalysis.ts`,
   `rice.ts` — each taking the parsed dataset and returning plain computed data. None of them
   touch React or the DOM, so they're easy to reason about and reuse across pages.
4. **A rule-based insight engine.** `insightEngine.ts` runs a registry of independent rule
   functions (conversion gaps, retention drops, funnel bottlenecks, feature correlations,
   revenue gaps, activity trends) over the computed metrics and emits structured `Insight`
   objects — severity, finding, evidence, recommendation.

## AI Product Analyst

There is no LLM anywhere in this project — no OpenAI, no Anthropic, no Gemini, no API key.

The "AI Product Analyst" is a deterministic engine: a set of statistical thresholds and
rules (e.g. *"if one segment's conversion rate is more than 20% below another's, flag a
conversion gap"*) that runs entirely client-side and writes the result as a natural-language
sentence. The **Ask your product data** box works the same way — it matches keywords in your
question (`"convert"`, `"retention"`, `"feature"`, `"segment"`, `"revenue"`...) to a canned
analysis routine, not a language model. When nothing matches, it says so honestly rather than
guessing.

This is a deliberate product decision, not a limitation to hide: it means the "AI" feature
costs nothing to run, works offline, and can't leak your data anywhere.

## RICE prioritization

The Priorities page implements the standard RICE framework:

```
RICE Score = (Reach × Impact × Confidence) ÷ Effort
```

Add product ideas with your own Reach/Impact/Confidence/Effort estimates, and InsightFlow
ranks them, tiers them into High/Medium/Low priority by score percentile, and persists them
in `localStorage` — independent of whatever dataset happens to be loaded.

## Privacy

- Uploaded CSVs are parsed and analyzed entirely in your browser (`Papa.parse` on a local
  `File`, no network request).
- There is no backend and no database. Nothing about your dataset is transmitted anywhere.
- The active dataset lives only in memory and is cleared on refresh. The RICE board and the
  fact that the demo dataset was last active are the only things persisted to
  `localStorage`, and neither contains uploaded data.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) +
  [Vite](https://vite.dev/)
- [React Router](https://reactrouter.com/) (`HashRouter`, for clean GitHub Pages routing)
- [Recharts](https://recharts.org/) for charts
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- [Lucide](https://lucide.dev/) for icons
- Plain CSS (custom properties + CSS Modules) — no UI framework, no Tailwind

## Project structure

```
src/
  components/   Sidebar, Header, KPICard, InsightCard, ChartCard, DataTable,
                EmptyState, InlineNotice, Badge, Tooltip
  pages/        Dashboard, Analytics, Funnels, Retention, Features, Segments,
                Priorities, AIAnalyst, Settings
  analytics/    metrics, funnel, retention, segmentation, featureAnalysis,
                rice, insightEngine, trends, capabilities
  context/      DatasetContext, useAnalyticsBundle
  data/         sampleData (seeded, deterministic demo dataset generator)
  types/        dataset
  utils/        csvParser, datasetBuilder, formatting, dateUtils
  styles/       tokens.css, global.css, chartColors.ts
```

## Running locally

```bash
npm install
npm run dev       # start the dev server
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build locally
npm run lint        # ESLint
```

## Sample dataset

Clicking **Try Sample Dataset** generates ~1,200 users and 6,000+ events entirely in-browser,
using a seeded pseudo-random generator (`src/data/sampleData.ts`) — the same seed always
produces the same dataset, so it's reproducible and reviewable as ordinary code rather than a
static file.

The generator deliberately embeds several realistic product patterns so the insight engine has
something to find:

1. Mobile users convert roughly half as often as desktop users.
2. Users who complete onboarding convert about 3× more often.
3. One feature (Dashboard) has high adoption *and* correlates with higher conversion; another
   (Export) has low adoption.
4. Purchase activity dips sharply during one calendar week.
5. The cohort that signed up in week 3 retains noticeably worse than its neighbors.
6. Enterprise-plan users generate a much higher ARPU than Pro users.
7. Repeat purchasers generate substantially more revenue than one-time purchasers.

## Design decisions

- **No LLM, by design.** Faking an "AI" feature with a hidden LLM call would misrepresent how
  the product works and require an API key/backend — both explicitly out of scope. A
  transparent rule engine keeps the product honest and actually free to run.
- **Adaptive, not fragile, UI.** Rather than assuming every CSV has every column, the app
  computes a capability flag set once and every page checks it, degrading gracefully with an
  explanatory message instead of a broken chart.
- **Plain CSS over a UI framework.** The design system is a single `tokens.css` file of CSS
  custom properties (colors, spacing, type scale) shared by components and by Recharts (via
  `var(--chart-1)` etc. passed directly as SVG fill/stroke values), avoiding an unnecessary
  dependency for a project this size.
- **React Context over a state library.** There's exactly one shared, slowly-changing resource
  (the loaded dataset), so a context + a memoized derived-analytics hook is enough — no
  Redux/Zustand needed.

## Vibe coding

This project was built as a "vibe coding" exercise — an exploration of building a real,
non-trivial product end-to-end through conversational AI-assisted development, using
**Claude Code** (for architecture, implementation, and the analytics/insight engine logic) and
**Cursor** (for iterative editing). All analysis logic, insight rules, and the sample-data
generator were reviewed and reasoned about explicitly rather than accepted as opaque output —
the goal was to practice directing AI tools toward a coherent product outcome, not to skip
product or engineering judgment.

## What I learned

- Designing a rule-based "insight engine" forces you to be precise about what a metric
  actually means (e.g., what counts as "retention," what window a "conversion rate" is
  computed over) in a way that's easy to hand-wave when you can lean on an LLM instead.
- Building the sample-data generator to *deliberately* contain discoverable patterns is a
  genuinely useful technique for testing analytics logic end-to-end — it turned into the best
  regression test for the insight engine.
- An adaptive UI (driven by a single capability-flags object) is a small amount of extra
  design work up front that pays for itself immediately the first time a real-world CSV is
  missing a column.

## Future improvements

- Multiple/custom funnels (today's funnel is a single default sequence).
- CSV column mapping UI, for datasets that use different header names.
- Exporting insights or the RICE board as PDF/CSV.
- Saved views / comparison between two uploaded datasets.
- Optional dark theme.

## Author

Built by Darshan Nellary.
GitHub: [github.com/darshannellary](https://github.com/darshannellary)
