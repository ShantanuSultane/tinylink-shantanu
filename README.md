# TinyLink - Take Home (Node + Express)

This is a minimal implementation of the TinyLink assignment (bit.ly style) using Node.js + Express and SQLite (for quick local testing).
It implements the endpoints and behavior required by automated tests:

- Stable URLs:
  - `/` — Dashboard (static frontend)
  - `/code/:code` — Stats page
  - `/:code` — Redirect (302 or 404)

- Health endpoint:
  - `GET /healthz` → returns 200 with JSON `{ "ok": true, "version": "1.0" }`

- API endpoints:
  - `POST /api/links` — Create a link (409 if code exists)
  - `GET  /api/links` — List all links
  - `GET  /api/links/:code` — Stats for one code
  - `DELETE /api/links/:code` — Delete link

## Quick start (local)

1. Extract the zip and open the folder.
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run dev
# or
npm start
```

4. Open http://localhost:3000

## Notes

- The project uses SQLite (better-sqlite3) so you can test locally without spinning up Postgres. For deployment and Neon (Postgres), replace `db.js` implementation and set `DATABASE_URL` accordingly.
- Codes must follow regex `[A-Za-z0-9]{6,8}`. When creating, validation occurs and duplicate codes return 409.
- Redirect increments `clicks` and updates `last_clicked`. Deletion removes the code and then redirect returns 404.
- See `server.js` for implementation details.
