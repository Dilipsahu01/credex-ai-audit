# Tests — Audit engine (`lib/audit/engine.ts`)

All tests live in **`__tests__/audit-engine.test.ts`**. They import `runAudit` and assert on `AuditResult` fields (`recommendedAction`, `monthlySavings`, `recommendedTool`, `isHighSavings`, `isOptimal`, `totalMonthlySavings`).

Run them with:

```bash
npx vitest run
```

*(Equivalent: `npm test`, which maps to `vitest run` in `package.json`.)*

---

## Test inventory (8)

| # | Test name | What it covers |
|---|-------------|----------------|
| 1 | `flags Cursor Business for a 2-person team as overkill` | **Cursor downgrade path** — small team on Business tier should move toward Pro-level economics; expects `downgrade` and **$40/mo** savings for the fabricated inputs. |
| 2 | `flags GitHub Copilot Enterprise for small team — recommend Business` | **Copilot tier overkill** — Enterprise per-user pricing vs Business for five seats; validates **downgrade** and **$100/mo** savings. |
| 3 | `flags Claude Team for 2 users — individual Pro is cheaper` | **Claude Team vs Pro** — low seat count on Team should surface **downgrade** with **$10/mo** savings. |
| 4 | `returns optimal for well-configured stack` | **Happy path / no savings** — Cursor Pro + Claude Pro for a solo coding user; expects **`totalMonthlySavings === 0`** and **`isOptimal === true`**. |
| 5 | `marks isHighSavings true when savings exceed $500/mo` | **High-savings flag** — large Cursor Business + Copilot Enterprise combo; asserts **`isHighSavings`** for CTA logic on `/results`. |
| 6 | `recommends switching Windsurf Max to Pro — saves $180/mo` | **Windsurf Max → Pro** — validates **downgrade** branch and **$180/mo** delta for single-seat Max. |
| 7 | `suggests switching ChatGPT to Cursor for coding use case` | **Cross-tool duplicate / use-case routing** — ChatGPT Plus with `useCase: 'coding'` should yield **`switch`** and **`recommendedTool: 'cursor'`** (coding-specific stack efficiency). |
| 8 | `does not recommend downgrade when ZDR is required` | **Compliance gating** — Cursor Business with `compliance.requiresZDR: true` must return **`optimal`** and **zero** savings so ZDR/SSO obligations are not violated for a risky downgrade. |

---

## What is intentionally *not* covered here

- Next.js route handlers (Supabase inserts, Nodemailer, Anthropic) — exercise via integration tests or manual QA.  
- UI components — no React Testing Library in this repo yet.  
- E2E flows (`/` → `/results` → modal → `/audit/[id]`) — candidate for Playwright in a later iteration.
