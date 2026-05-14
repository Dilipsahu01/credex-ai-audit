# Architecture — Credex AI Spend Audit

## System overview

Credex AI Spend Audit is a **browser-first audit** with **server-side persistence and enrichment**. The authoritative savings numbers come from a **TypeScript rules engine** (`lib/audit/engine.ts`); the Anthropic API produces **optional narrative copy** only. Supabase holds durable audit JSON and lead rows; Gmail (via Nodemailer) delivers the deep link.

---

## Text-based data flow

**1. Client (Next.js `app/` + `components/`)**  
The user selects paid tools from a fixed catalog of eight (`ToolName` in `lib/types`). For each tool they choose a plan string (from `TOOL_PLANS`), monthly spend, seats, and optional **compliance flags** (`requiresZDR`, `requiresSSO`). Team size and primary use case (`coding` | `writing` | `data` | `research` | `mixed`) scope cross-tool rules (e.g. ChatGPT vs Cursor for coding).

**2. localStorage**  
`SpendForm` serializes `AuditFormData` to `credex-audit-form` on change (after an initial-load guard so the default empty state does not overwrite a saved session). `/results` reads the same key, runs `runAudit(formData)` client-side, and redirects home if the payload is missing.

**3. Next.js API — `POST /api/generate-summary`**  
The results page POSTs `{ result, formData }`. The handler enforces **Upstash rate limits**, builds a **structured bullet list** of per-tool outcomes (`optimal` / `downgrade` / `switch` / review) and sends one user message to **Anthropic Messages** (`claude-haiku-4-5-20251001`, `max_tokens: 150`). On failure it returns HTTP 200 with `summary: null` so the UI never hard-fails.

**4. Next.js API — `POST /api/save-audit`**  
After lead capture, the client POSTs form + result + email metadata. The handler enforces global and per-IP **Upstash rate limits**, validates email, checks `EMAIL_APP_PASSWORD`, inserts into **`audits`** and **`leads`**, then uses `sendMail` with a sanitized HTML template to prevent injection attacks.

**5. Supabase**  
Postgres tables back public read for `/audit/[id]` via `supabaseAdmin` on the server. The anon client exists for future client reads; writes are service-role only from API routes.

**6. Email**  
Nodemailer `service: 'gmail'` delivers HTML with savings lines and the audit CTA. From address matches the configured Gmail identity.

---

## Why Next.js + Supabase

- **Next.js** gives file-based routing, React Server Components for the public audit page, and Route Handlers next to UI without a second deployable. Environment variables for Anthropic, Supabase service role, and Gmail stay server-only.

- **Supabase (Postgres)** matches **relational audit + lead** rows, easy aggregates (`total_monthly_savings`), and a clear path to Row Level Security if anonymous writes are ever exposed. Firebase would push a document model less natural for “one audit row, one lead row, join on `audit_id`.”

---

## Scaling toward ~10,000 audits per day

At that volume the **current synchronous save path** (insert + send mail in one request) becomes the bottleneck.

**API and compute**

- **Queue outbound email** (SQS, Cloud Tasks, or BullMQ + Redis): the handler enqueues a job and returns `auditId` immediately; workers send via Nodemailer or migrate to a dedicated ESP with bounce handling.

- **Queue Anthropic calls** for summaries: cap concurrency, dedupe by hash of `(formData, result)`, and **Redis cache** keyed by that hash so retries and re-opens do not re-bill the API.

- **Rate limit**: Implemented Vercel KV and Upstash Ratelimit for both per-IP and global rate limiting on `save-audit` and `generate-summary` API routes to prevent API token drain and abuse.

**Supabase / Postgres**

- Use the **Supabase connection pooler**; add indexes on `audits(id)`, `leads(audit_id)`, and optionally partial indexes on `created_at` for reporting.

- Introduce **read replicas** (or Supabase read routing) if analytics dashboards hit the primary.

**Edge and static**

- Serve static assets from a CDN; prefetch `/results` JS only when the user submits the form.

**Observability**

- Structured logs for insert latency, mail failures, and Anthropic error codes; a dead-letter queue for failed emails with manual replay.

The **engine stays client-side** at low scale for cost; at 10k/day you might **re-run validation server-side** before insert to prevent tampered JSON, accepting extra CPU for trust.
