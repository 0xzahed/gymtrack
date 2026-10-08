# GymTrack — members, plans, check-in, fees

Gym management dashboard built to demo to real gym owners.

## Run it

```bash
npm install
cp .env.example .env   # optional — MongoDB persistence
npm run dev            # http://localhost:3000
```

Without `MONGODB_URI` everything runs in memory mode (demo).

## Features (built feature-by-feature)

- **F1** — member + plan models, store, CRUD APIs
- **F2** — subscribe/renew (extends from today or current expiry) + auto-payment + expiry alerts
- **F3** — entry check-in with expired-membership flag + today's list
- **F4** — fee payments ledger + monthly revenue
- **F5** — dashboard UI + one-click demo seed
- **F6** — verified build + live API tests

## Notes

- `cacheComponents: false` + `dynamic = "force-dynamic"` so every number is live.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Mongoose (optional)
