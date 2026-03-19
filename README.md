# MRT Meetup Finder

Find the **fairest** MRT meetup station in Singapore. Enter each friend's starting station and the app finds the stop that minimises the longest journey — so no one travels more than necessary.

A zero-dependency static web app — just a single `index.html` file powered by vanilla JavaScript and **Leaflet**.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/mrt-meetup.git
cd mrt-meetup
```

### 2. Open locally

No build step or dependencies required. Open `index.html` using the **Live Server** extension in Visual Studio Code:

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code.
2. Open the `mrt-meetup` folder in VS Code.
3. Right-click `index.html` in the Explorer panel and select **"Open with Live Server"**.
4. The app will open automatically at `http://127.0.0.1:5500`.

---

## Project Structure

```
mrt-meetup/
├── index.html              # Entire application — markup, styles & logic
└── .github/
    └── copilot-instructions.md
```

---

## Deploying

Because it is a plain static file it can be hosted anywhere:

- **GitHub Pages** — push to `main`, enable Pages in repository settings, set source to root.
- **Vercel** — import the repo; Vercel will detect a static site and serve `index.html` automatically.
- **Netlify** — drag-and-drop the folder onto the Netlify dashboard, or connect the repo for continuous deployment.

---

## How It Works

1. Each friend's station is used as the source of a **Breadth-First Search (BFS)** across the MRT graph.
2. For every candidate station the app computes the stop-count from each friend.
3. The station with the **lowest maximum stop-count** (tiebroken by lowest variance) is chosen as the fairest meetup point.
4. Results are visualised on a **Leaflet** map with dashed lines connecting each friend to the recommended station.
