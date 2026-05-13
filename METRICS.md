# Metrics — Credex AI Spend Audit

## North Star metric

### **Audits completed per week**

An **audit completed** means a user reached `/results` with a successful `runAudit` output (all selected tools evaluated, totals computed, `AuditResult` non-null). This is the North Star because it measures **value delivered**—the engine actually ran—rather than vanity traffic.

#### Why not DAU (Daily Active Users)?

DAU is a poor fit for a **low-frequency, high-intent** workflow. A VP engineering who runs one audit before a board meeting and converts offline **30 days later** would look like “churn” in a DAU dashboard even though the product did its job. Weekly aggregation smooths day-of-week spikes from launches (Show HN, Reddit) while staying responsive enough for a pre-revenue experiment. Supplement DAU only as a **health check** for broken deployments (sudden collapse), not as the primary optimization target.

---

## Input metrics (funnel drivers)

### 1. Landing page → **form start rate**

**Definition:** Unique sessions where the user interacts with the spend form (e.g., first tool chip toggled or first field changed) ÷ unique landing page sessions.

**Why it matters:** Measures headline clarity and perceived effort. If this metric is weak, fix **copy and above-the-fold layout** before tuning Supabase or email.

### 2. Form start → **audit complete rate**

**Definition:** Sessions that started the form ÷ sessions that triggered navigation to `/results` with valid stored `AuditFormData`.

**Why it matters:** Captures **field friction** (too many tools, confusing plan names) and trust mid-flow. Drops here suggest UX work on progressive disclosure, not lead-capture tweaks.

### 3. Audit complete → **email capture rate**

**Definition:** Users who reached `/results` ÷ users who successfully called `POST /api/save-audit` (HTTP 2xx with `auditId`).

**Why it matters:** Bridges **product** to **pipeline**—this is where privacy copy, modal headline, and perceived value of the emailed link matter.

---

## Pivot trigger

> **If email capture rate is \< 5% after 500 completed audits**, rethink the `/results` value proposition—not the landing hero.

At that sample size, noise is manageable but directional. A sub-5% capture usually means users treat recommendations as **novelty** rather than **actionable**. Concrete responses before abandoning the project:

1. **Reposition savings** — emphasize annualized dollars and “finance-ready” one-liners.  
2. **Add proof artifacts** — downloadable CSV of recommendations (still no PII until save).  
3. **Tighten modal ask** — split “email me the link” vs. “talk to sales” into two steps so the first micro-commit is smaller.  
4. **Instrument drop-off** — if analytics show exits on the AI summary spinner, decouple summary fetch from perceived completion.

---

## Secondary engineering metrics

| Metric | Purpose |
|--------|---------|
| `save-audit` **5xx rate** | Catch Supabase or SMTP regressions early. |
| `generate-summary` **latency p95** | Detect Anthropic slowdowns; consider caching by audit hash. |
| **Lint + test pass rate on `main`** | CI gate already encodes baseline engineering hygiene. |

These support the North Star but should not distract from **conversion quality** until the core funnel metrics stabilize.
