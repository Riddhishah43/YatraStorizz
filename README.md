# YatraStorizz

A modern travel-planning web application built with **HTML5, CSS3, and Vanilla JavaScript ES Modules** — no frameworks, no build step. Discover destinations, organize trips, build day-by-day itineraries, and track travel budgets, all with localStorage persistence and light/dark themes.

## Modules

| Page | Path | What it does |
|---|---|---|
| Landing | `pages/index.html` | Hero, destination showcase, features, how-it-works, trip-style scenarios, demo newsletter, footer |
| Dashboard | `dashboard/dashboard.html` | Greeting, overview stats, upcoming trips, budget summary, recent activity |
| Discover | `discover/discover.html` | Search, category/budget/season filters, destination grid + details modal, favorites |
| Trips | `trips/trips.html` | Create / view / edit / delete trips, search, status filter, sorting, stats |
| Itinerary | `itinerary/trip-details.html?tripId=…` | Day tabs, activity timeline, add/edit/delete, drag-and-drop + button reordering |
| Budget | `budget/budget.html` | Per-trip budget, expense CRUD, category breakdown, search/filter/sort |

## Design system

Palette: **Black** `#151515` (text, headings, icons) · **Fresh Green** `#85DD74` (primary buttons, highlights) · **Lime Yellow** `#E1F782` (accents, badges) · **White** `#FFFFFF` (cards, backgrounds). Dark mode uses the same greens on near-black surfaces. Shared tokens live in `css/components.css`; each module scopes its own stylesheet to its pages.

## Run locally

No build step — serve over HTTP (ES modules don't work over `file://`):

```powershell
cd YatraStorizz
python -m http.server 8080
```

Then open `http://localhost:8080/pages/index.html` and navigate from there. Every module links to the others through real relative routes.

## Run tests

Each module has its own Vitest setup (root covers the landing page):

```powershell
# all landing + module suites from the repo root
npm install
npm test

# a single module, e.g.
cd trips
npm install
npm test
```

124 tests across 7 suites, all deterministic (fixed reference dates, memory adapters — never the real clock or shared browser storage).

## Data & storage

All demo persistence is localStorage, one key per module:

- Trips: `yatrastorizz.trips.v1` · Itineraries: `yatrastorizz.itineraries.v1`
- Budgets/expenses: `yatrastorizz.budgets.v1` · Discover favorites: `yatrastorizz.favorites.v1`
- Theme (shared): `yatrastorizz.theme` · Newsletter demo: `yatrastorizz.newsletter.demo`

Modules integrate through real imports over shared storage — the budget page reads trips and itinerary estimates but never duplicates them, and itinerary estimates are display-only (never counted as spending).

## Honest-demo notes

- Destination/hero artwork is original placeholder SVG illustration, not photography.
- The landing testimonials section renders trip-style scenarios because no verified testimonials exist.
- Newsletter signup stores the address on-device only; the toast states that nothing is sent.
- Deleting data, failed storage, and missing trips/activities all surface explicit messages — nothing is faked.
