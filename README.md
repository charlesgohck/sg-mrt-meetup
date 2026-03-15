# MRT Meetup Finder

Find the **fairest** MRT meetup station in Singapore. Enter each friend's starting station and the app finds the stop that minimises the longest journey — so no one travels more than necessary.

Built with **Next.js 15**, **TypeScript**, **Leaflet**, **Vercel Analytics** and **Vercel Speed Insights**.

---

## Prerequisites

- **Node.js** 18.18 or later
- **npm** 9 or later (or pnpm / yarn)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/mrt-meetup.git
cd mrt-meetup
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

This project has no required environment variables for local development. If you add any in the future, copy the example file:

```bash
cp .env.example .env.local
```

> **Never commit `.env` or `.env.local`** — they are listed in `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server at `http://localhost:3000` |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Project Structure

```
mrt-meetup/
├── app/
│   ├── layout.tsx          # Root layout — Analytics & Speed Insights live here
│   ├── page.tsx            # Home page (Server Component)
│   └── globals.css         # Global styles & design tokens
├── components/
│   ├── MrtFinder.tsx       # Main interactive UI (client component)
│   └── MrtFinderDynamic.tsx# Dynamic import wrapper (disables SSR for Leaflet)
├── lib/
│   ├── mrt-data.ts         # Station coordinates, line data & adjacency edges
│   └── bfs.ts              # BFS pathfinding & fairest-meetup algorithm
├── .github/
│   └── copilot-instructions.md
├── next.config.ts
└── tsconfig.json
```

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js — no extra configuration needed.
4. **Analytics** and **Speed Insights** activate automatically once deployed to Vercel.

---

## How It Works

1. Each friend's station is used as the source of a **Breadth-First Search (BFS)** across the MRT graph.
2. For every candidate station the app computes the stop-count from each friend.
3. The station with the **lowest maximum stop-count** (tiebroken by lowest variance) is chosen as the fairest meetup point.
4. Results are visualised on a **Leaflet** map with dashed lines connecting each friend to the recommended station.
