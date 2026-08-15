# R4Realty

R4Realty is a small static site + Express backend used to capture property leads for a real estate consultancy. This repository contains the frontend (HTML/CSS/JS) and a Node.js/Express server that stores leads in MySQL when available, otherwise falling back to a JSON file (leads_db.json).

## Security hardening (what changed in this branch)
- Admin endpoints now require an environment-provided ADMIN_PIN. The server will refuse to start if ADMIN_PIN is not set.
- Admin endpoints are rate-limited to mitigate brute-force attempts.
- Basic HTTP hardening via helmet().
- Client-side hardcoded fallback PIN removed — the admin UI must authenticate against the server.
- A protected server-side CSV export endpoint was added: GET /api/leads/export (requires X-Admin-Pin header).

## Quick start
1. Copy `.env.example` to `.env` and set a strong `ADMIN_PIN`.

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
# production
npm start

# development (auto-restart)
npm run dev
```

4. Visit the site at `http://localhost:3000`.

## Admin usage (server must be running and ADMIN_PIN set)
- Fetch leads (JSON):

```bash
curl -H "X-Admin-Pin: <ADMIN_PIN>" http://localhost:3000/api/leads
```

- Export leads (CSV):

```bash
curl -H "X-Admin-Pin: <ADMIN_PIN>" http://localhost:3000/api/leads/export -o leads.csv
```

- Clear leads:

```bash
curl -X DELETE -H "X-Admin-Pin: <ADMIN_PIN>" http://localhost:3000/api/leads
```

## Notes
- After merging this branch, run `npm install` to add the new dependencies (express-rate-limit and helmet).
- The server now exits at startup if `ADMIN_PIN` is missing — this enforces secure configuration. If you'd prefer the server to start but disable admin routes instead, tell me and I will adjust the behavior.
