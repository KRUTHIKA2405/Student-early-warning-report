# Student Early Warning System

A predictive analytics dashboard for proactive student support, built on the
**UCI Student Performance** dataset (Cortez & Silva, 2008).

The app combines the Mathematics and Portuguese cohorts (1,044 students) and
runs an in-browser risk-scoring model that surfaces who is most likely to fail
the final exam (G3 < 10), why, and what to do about it.

---

## Tech stack

- **React 19** + **TypeScript**
- **Vite 7** (dev server + build)
- **Tailwind CSS v4** with shadcn/ui components
- **Recharts** for all data visualisations
- All data and scoring run **client-side** — no backend required.

---

## Running the project in VS Code

### 1. Prerequisites

You need **Node.js 18 or later**. Verify with:

```bash
node --version
```

### 2. Install dependencies

From the project root:

```bash
npm install
```

(You may also use `pnpm install` or `yarn install` if you prefer — a clean
`npm install` works out of the box.)

### 3. Start the dev server

```bash
npm run dev
```

The terminal will print a local URL such as `http://localhost:5173/`. Open it
in your browser. The dashboard loads instantly with the full 1,044-student
cohort.

### 4. Production build

```bash
npm run build
npm run preview
```

`npm run preview` serves the production bundle locally for a final smoke test.

---

## Project layout

```
src/
  data/students.json          # 1,044 UCI records (Math + Portuguese combined)
  lib/predict.ts              # Risk scoring + grade prediction + metrics
  components/dashboard/       # KpiCard, Charts, StudentTable, StudentDrawer
  pages/Dashboard.tsx         # Main dashboard page (4 tabs)
  components/ui/              # shadcn/ui primitives
  index.css                   # Theme tokens and Tailwind layers
  App.tsx                     # Routing
public/students.json          # Same dataset for static deployments
```

---

## What the dashboard shows

- **Overview** — KPI strip, risk-distribution donut, final-grade bands,
  G1-vs-G3 academic-trajectory scatter.
- **Feature analysis** — Study time, past failures, absences and mother's
  education plotted against average grade and at-risk percentage.
- **Model performance** — Accuracy / precision / recall / F1, confusion
  matrix, predicted-vs-actual scatter and feature-importance ranking.
- **Student roster** — Searchable, sortable list of all 1,044 students with
  per-student drawer showing the top risk drivers and recommended
  interventions.

Cohort filters in the header (subject · school · risk band) propagate through
every chart and the roster. A dark-mode toggle is included.

---

## Risk model in one paragraph

A composite **0–100 risk score** is computed from past failures, G1, G2,
absences, weekly study time and a handful of social factors (going-out,
alcohol, family support, internet, parental education). The score is split
into four bands — **Low (<20), Moderate (20–39), High (40–59), Critical
(≥60)** — and a transparent linear formula additionally estimates the final
grade:

```
predicted_G3 = 0.18·G1 + 0.62·G2 − 1.4·failures − 0.05·absences
             + 0.35·studytime + 1.1
```

Both numbers are recomputed client-side every time the cohort filters change.

---

## Dataset attribution

UCI Machine Learning Repository — *Student Performance Data Set*
Cortez, P. and Silva, A. (2008). *Using Data Mining to Predict Secondary
School Student Performance.* In Proceedings of 5th FUture BUsiness
TEChnology Conference.
<https://archive.ics.uci.edu/dataset/320/student+performance>
