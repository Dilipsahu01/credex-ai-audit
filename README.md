# Credex AI Spend Audit

**Credex AI Spend Audit** is a Next.js application for 10–50 person SaaS teams: it collects paid AI tooling (Cursor, GitHub Copilot, Claude, ChatGPT, direct APIs, Gemini, Windsurf), runs a **deterministic rule engine** in the browser to estimate monthly and annual savings, optionally calls **Anthropic** for a short executive summary, and persists completed runs to **Supabase** with **Nodemailer (Gmail)** delivery of a shareable audit link after email capture.

The product is intentionally **auth-free at the audit stage**: form state lives in **localStorage**, results render on `/results`, and `POST /api/save-audit` writes `audits` + `leads` rows before sending mail.

---

## Local setup

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:3000`). Complete the spend form, run the audit, review `/results`, then use the lead modal to trigger persistence and email.

---

## Environment variables

Create **`.env.local`** in the project root (never commit it):

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; used in API routes for inserts |
| `NEXT_PUBLIC_APP_URL` | Base URL for links in email (e.g. `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | Powers `POST /api/generate-summary` (Haiku); omit to rely on UI fallback copy |
| `EMAIL_APP_PASSWORD` | Gmail app password for Nodemailer in `save-audit` |

---

## Decisions (technical trade-offs)

1. **Next.js App Router** — UI and colocated `app/api/*` routes share one deployable unit and keep secrets off the client. Trade-off: cold starts and route-handler timeouts versus a separate BFF service; acceptable for an audit micro-product.

2. **Supabase over Firebase** — Postgres + generated REST/RPC + straightforward `audits` / `leads` tables fit relational audit snapshots and future SQL analytics. Trade-off: you own RLS and service-role hygiene more explicitly than with Firestore’s document model.

3. **localStorage for form persistence** — Zero-friction resume across refresh before login. Trade-off: no cross-device sync, data cleared if the user clears site storage, and hydration timing must be handled carefully in the client.

4. **Nodemailer + Gmail over Resend** — Uses an existing mailbox and app passwords for coursework and instant demos without verifying a new sending domain. Trade-off: Gmail send quotas and deliverability tooling versus transactional ESPs with webhooks and dedicated IPs.

5. **Vitest over Jest** — Native ESM alignment with the Vite toolchain used elsewhere in the ecosystem and fast cold starts for the pure-TS audit engine tests. Trade-off: slightly different config surface than legacy Jest + Babel setups.

---

## Deployment

**Production URL (Vercel):** `https://YOUR-PROJECT.vercel.app` *(replace after first deploy)*

### Screenshots *(add to repo or deck for submission)*

1. **Home / spend form** — Tool chips, per-tool plan and seat inputs, compliance toggles.  
2. **Results** — Hero savings, AI summary card, per-tool breakdown, CTA / lead modal entry.  
3. **Public audit** — `/audit/[id]` share page after save.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (Next + TypeScript rules) |
| `npm test` | `vitest run` — audit engine unit tests |

---

## Repository layout (high level)

- `app/page.tsx` — Landing + `SpendForm` host  
- `app/results/page.tsx` — Audit output, Anthropic summary fetch, lead CTA  
- `app/audit/[id]/page.tsx` — Server-rendered public audit from Supabase  
- `app/api/save-audit/route.ts` — Supabase writes + Gmail send  
- `app/api/generate-summary/route.ts` — Anthropic Haiku summary  
- `lib/audit/engine.ts` — Deterministic savings rules  
- `lib/types/index.ts` — `AuditFormData`, `AuditResult`, `TOOL_PLANS`, labels  
- `__tests__/audit-engine.test.ts` — Eight engine scenarios  
