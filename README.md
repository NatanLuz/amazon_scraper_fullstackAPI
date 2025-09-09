# Amazon Scraper – Modern, robust and responsive full‑stack

### Backend
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)]
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)]
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)]
[![JSDOM](https://img.shields.io/badge/JSDOM-FF0000?style=flat&logo=jsdom&logoColor=white)]
[![Helmet](https://img.shields.io/badge/Helmet-000000?style=flat&logo=npm&logoColor=white)]
[![Compression](https://img.shields.io/badge/Compression-000000?style=flat&logo=npm&logoColor=white)]
[![Morgan](https://img.shields.io/badge/Morgan-000000?style=flat&logo=npm&logoColor=white)]
[![Rate Limit](https://img.shields.io/badge/Rate_Limit-000000?style=flat&logo=npm&logoColor=white)]

### Frontend
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)]
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)]
[![Font Awesome](https://img.shields.io/badge/Font_Awesome-528DD7?style=flat&logo=font-awesome&logoColor=white)]
[![Google Fonts](https://img.shields.io/badge/Google_Fonts-4285F4?style=flat&logo=google&logoColor=white)]
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)]
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)]
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)]

### Testes (frontend)
[![Vitest](https://img.shields.io/badge/Vitest-000000?style=flat&logo=vitest&logoColor=white)]
[![JSDOM](https://img.shields.io/badge/JSDOM-FF0000?style=flat&logo=jsdom&logoColor=white)]


## Preview

![Preview 1](https://i.imgur.com/y5aWKLi.png)

![Preview 2](https://i.imgur.com/OXFpdoq.png)

![Preview 3](https://i.imgur.com/ordYqb9.png)

A complete full‑stack project showcasing a modern product search experience for Amazon Brazil, with a production‑ready backend and a performant, responsive frontend.

It combines engineering best practices (security, caching, rate limits, observability) with modern UI/UX (Tailwind, Dark Mode, animations, filters, infinite scroll). Use it as a portfolio piece, learning base, or a foundation for advanced solutions.

### Why this project matters
- Demonstrates the full cycle: API → parsing (JSDOM) → modern UI → live metrics.
- Production‑grade backend: rate limiting, cache, logs, Helmet, compression, health check, metrics, graceful shutdown.
- Modern UX: Tailwind, Dark Mode, rich product cards, filters, animations, infinite scroll.
- Clear separation of concerns, easy to understand and extend.

---

## Architecture
- `server/` (Node.js + Express)
  - REST endpoints: `/api/scrape`, `/api/health`, `/api/metrics`.
  - Scraping with `axios` + `jsdom` and robust CSS selectors.
  - Security/perf: `helmet`, `compression`, `morgan`, `express-rate-limit`.
  - In‑memory cache with TTL to reduce latency and load.
  - Input validation, centralized error handling, graceful shutdown.
- `client/` (Vite + Tailwind)
  - Search with rich feedback (spinner, friendly errors).
  - Product cards with hover, rating badge, external link.
  - Persistent Dark Mode (localStorage), mobile‑first responsive grid.
  - Filters (min/max price, min rating, Prime) and infinite scroll pagination.
  - Metrics panel pulling `/api/metrics` (5s polling).

Simplified flow:
1) User searches → frontend calls `/api/scrape?keyword=...`.
2) Backend fetches Amazon HTML, parses with `jsdom`, normalizes and returns data.
3) Frontend renders in batches (better UX), supports filters and live metrics.

---

## Getting started
Prereq: Node 20.19+ or 22.12+ (recommended). On Windows, prefer nvm‑windows.

1) Install dependencies
```powershell
cd C:\Users\User\Desktop\amazon_scraper_fullstackAPI-master
npm install
npm run install-client
```

2) Development (two terminals)
- Backend
```powershell
npm start
```
- Frontend
```powershell
cd client
npm run dev
```
Open: `http://localhost:5173`

3) Production (serve built frontend)
```powershell
cd client
npm run build
cd ..
npm start
```
Open: `http://localhost:3000`

4) Environment variables (optional – create `.env` at the root)
```
PORT=3000
REQUEST_TIMEOUT_MS=12000
CACHE_TTL_MS=60000
RATE_LIMIT_MAX=15
```

---

## Endpoints
- `GET /api/health` – basic health check.
- `GET /api/metrics` – in‑memory metrics (totalRequests, scrapeRequests, cacheHits, rateLimited, memory, uptime).
- `GET /api/scrape?keyword=keyboard` – returns products with `{ id, title, price, rating, reviews, imageUrl, productUrl }` and `total`.

Example (short):
```json
{
  "success": true,
  "keyword": "keyboard",
  "products": [ { "id": 1, "title": "...", "price": "R$ 199,90" } ],
  "total": 24,
  "timestamp": "2024-..."
}
```

---

## Key improvements
- Frontend (UI/UX)
  - Tailwind CSS with modern look, gradients and glassmorphism.
  - Dark Mode toggle with persistence.
  - Rich product cards, rating badge, “View on Amazon” button.
  - Smooth loading spinner, friendly error messages, auto‑scroll to results.
  - Filters: min/max price (BRL), min rating, Prime only.
  - Infinite scroll with batched rendering.
  - Live metrics panel (polling `/api/metrics`).
- Backend (hardening)
  - Helmet, compression, morgan (logs), CORS, configurable rate limiting.
  - In‑memory cache with TTL and `cacheHits` counter.
  - Input validation and clearer error messages.
  - `/api/metrics` for observability.
  - Graceful shutdown and centralized error handler.

---

## Technical notes
- `jsdom` parsing is more reliable than regex for dynamic DOM; selectors may need updates as Amazon changes HTML.
- In‑memory cache is simple and effective; for production, prefer Redis.
- Rate limiting guards against abuse; tune via `.env`.
- Tailwind enables fast, consistent UI iteration.
- Infinite scroll improves perceived performance; classic pagination can be added if SEO matters.

---

## Limitations & responsibility
- Scraping may violate Terms of Service; use for education, controlled tests, or with authorization.
- Amazon’s structure can change; selectors require maintenance.
- Not designed to bypass anti‑bot systems or operate at massive scale.

---

## Roadmap ideas
- Sorting (price, rating) and more filters (shipping, category).
- Favorites and product comparison (localStorage or backend).
- External cache (Redis) and queues (BullMQ) for scale.
- Auth for a private metrics dashboard.
- PWA and E2E tests (Playwright).

---

## Tech stack
- Backend: Node.js, Express, Axios, JSDOM, Helmet, Compression, Morgan, Rate Limit.
- Frontend: Vite, Tailwind CSS, Font Awesome, Google Fonts (Inter).
- Tests (frontend): Vitest + jsdom.

---

## License
MIT – use freely with attribution. Respect Amazon’s policies.
