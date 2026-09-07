# Security (self-host)

Tsukiyomi is meant to run on a laptop or a small VPS. It is **not** a multi-tenant SaaS.

## Sessions

- Access and refresh tokens are set as **httpOnly** cookies (`tsk_at`, `tsk_rt`, `tsk_admin`).
- The browser apps do **not** store JWTs in `localStorage`.
- Scripts and curl can still send `Authorization: Bearer <token>` (login JSON still includes tokens).
- `POST /api/auth/logout` and `POST /api/admin/logout` clear cookies.

In development, leave `VITE_API_URL` empty so the Vite proxy serves `/api` on the same origin as the UI (port 5173 / 5174). Cookies will not work if the UI is on `:5173` and the API is called as `http://localhost:3001`.

## Production checklist

- Set `JWT_SECRET` (≥ 32 characters) and a non-default `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
- Serve the built UI from the API (`NODE_ENV=production`) or put everything behind one HTTPS reverse proxy.
- Set `TRUST_PROXY=true` only behind a trusted proxy.
- Email verification is required in production **only when SMTP is configured**, unless you set `REQUIRE_EMAIL_VERIFICATION=true`. Home servers without mail can keep it `false`.

## Data

User data lives in a SQLite snapshot (`backend/data/`) or `db.json` on Node versions without `node:sqlite`. Treat that directory as private. Do not commit `.env`.

## Reporting issues

Open a GitHub issue. There is no paid bounty program.
