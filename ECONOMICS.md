# Economics — Credex AI Spend Audit funnel

This document models how **free audits** translate into **Credex credit revenue** using explicit assumptions. Numbers are for planning and investor narrative, not audited financial statements.

---

## Deal and margin assumptions

- **Average Credex deal size:** **$5,000** in purchased **AI credits** (nominal contract value attributed to the conversion path that began with the audit).  
- **Credex gross margin on that deal:** **20%** → **$1,000** margin dollars per converted customer at the average deal size.  
  *(Margin here means contribution after variable costs of credits and fulfillment—not fully loaded headcount.)*

These two anchors let us translate funnel stages into **expected margin** rather than only top-line bookings.

---

## Reference funnel (single cohort)

We use a **1,000-audit** top-of-funnel cohort to keep mental math simple:

| Stage | Count | Implied conversion |
|-------|------:|---------------------|
| Audits completed | **1,000** | 100% baseline |
| Email captures (lead accepted) | **100** | **10%** audit → email |
| Consultations held | **20** | **20%** email → consult |
| Credit purchases | **5** | **25%** consult → close |

**Revenue:** 5 × $5,000 = **$25,000**  
**Margin:** 5 × $1,000 = **$5,000**

Blended **margin per audit started** = $5,000 ÷ 1,000 = **$5**  
Blended **margin per captured email** = $5,000 ÷ 100 = **$50**

---

## CAC under organic channels

For this MVP, **customer acquisition cost** is modeled as **founder and engineer time** plus negligible variable spend:

- Assume **40 hours** total across Show HN, Reddit, DMs, and Credex warm intros to fill the 1,000-audit cohort, at an **imputed $150/hour** blended cost → **$6,000** “organic CAC” for the cohort.  
- **CAC per purchase** = $6,000 ÷ 5 = **$1,200** against **$1,000** margin per customer in this toy scenario—**unprofitable at 5 closes** unless consult→close improves or imputed hourly drops.

The lesson is intentional: **organic is not free**; it trades cash for time. If consult conversion doubles to **50%**, purchases rise to **10**, CAC per purchase falls to **$600**, and the same $6,000 time investment clears margin with headroom. That is why Week 2 focuses on **interview-driven copy** on `/results` before scaling traffic.

---

## Sensitivity levers

1. **Audit → email (10% baseline):** Moving to **15%** with better privacy microcopy adds **50** emails → **+2.5** expected purchases at constant downstream rates → **+$2,500** revenue / **+$500** margin per identical audit volume.  
2. **Consult → purchase (25%):** This is the highest leverage stage once consults are qualified; improving demo discipline matters more than raw HN upvotes.  
3. **Deal size:** Enterprise credits at **$15k** with the same 20% margin triples margin dollars per win—segment enterprise audits early via `isHighSavings`.

---

## Accounting for API and infra variable cost

Anthropic Haiku summaries and Supabase row growth are **noise cost** relative to human time at 1k audits/month: order-of-cent per summary at Haiku pricing plus Postgres storage pennies. At **10k audits/day** you must queue and cache summaries and move mail to an ESP—see `ARCHITECTURE.md`.

---

## Summary table (cohort view)

| Metric | Value |
|--------|------:|
| Audits | 1,000 |
| Emails | 100 |
| Consults | 20 |
| Purchases | 5 |
| Revenue | $25,000 |
| Margin | $5,000 |
| Blended margin / audit | $5 |

Use this sheet when deciding whether to invest another week in **engine accuracy** vs. **results-page conversion**—until downstream consult capacity saturates, **conversion work** usually beats **rule sprawl** for margin.
