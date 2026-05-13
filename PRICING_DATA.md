# Pricing data — Credex AI Spend Audit

This file mirrors the **plan ladder strings** exposed in the UI via `TOOL_PLANS` in `lib/types/index.ts`. Dollar figures are **public-list or commonly advertised** prices as of verification; enterprise “Custom” tiers are placeholders without numeric assumptions in the engine unless the user types observed spend.

**Verification batch ID:** `credex-pricing-2026-05-07`  
**Date verified:** **May 7, 2026**  
**Mock verification portal (assignment artifact):** `https://verify.credex.example/pricing/credex-pricing-2026-05-07` *(non-routable placeholder URL for submission packet)*

---

## Cursor

| Plan label (UI string) | Notes |
|------------------------|--------|
| Hobby (Free) | $0 |
| Pro ($20/mo) | Flat Pro |
| Business ($40/user/mo) | Per-seat Business |
| Enterprise (Custom) | Deal-based |

**Source (representative):** `https://cursor.com/pricing`

---

## GitHub Copilot

| Plan label (UI string) | Notes |
|------------------------|--------|
| Free | Individual free tier |
| Pro ($10/mo) | Individual Pro |
| Pro+ ($39/mo) | Higher individual tier |
| Business ($19/user/mo) | Per-seat Business |
| Enterprise ($39/user/mo) | Enterprise per-user list framing used in tests |

**Source (representative):** `https://github.com/features/copilot/plans`

---

## Claude (Anthropic consumer / team)

| Plan label (UI string) | Notes |
|------------------------|--------|
| Free | Limited free |
| Pro ($20/mo) | Individual Pro |
| Max ($100/mo) | Higher individual cap |
| Team ($25/user/mo) | Team per seat |
| Enterprise (Custom) | Deal-based |

**Source (representative):** `https://www.anthropic.com/pricing`

---

## Anthropic API (direct)

| Plan label (UI string) | Notes |
|------------------------|--------|
| Pay-as-you-go (Haiku) | Token-metered |
| Pay-as-you-go (Sonnet) | Token-metered |
| Pay-as-you-go (Opus) | Token-metered |

**Source (representative):** `https://www.anthropic.com/pricing#api`

---

## ChatGPT (OpenAI)

| Plan label (UI string) | Notes |
|------------------------|--------|
| Free | Free tier |
| Plus ($20/mo) | Individual Plus |
| Team ($30/user/mo) | Team seats |
| Enterprise (Custom) | Deal-based |

**Source (representative):** `https://openai.com/chatgpt/pricing/`

---

## OpenAI API (direct)

| Plan label (UI string) | Notes |
|------------------------|--------|
| Pay-as-you-go (GPT-5.4 mini) | Token-metered SKU label in product |
| Pay-as-you-go (GPT-5.4) | Token-metered |
| Pay-as-you-go (GPT-5.5) | Token-metered |

**Source (representative):** `https://openai.com/api/pricing/`

---

## Google Gemini

| Plan label (UI string) | Notes |
|------------------------|--------|
| Free | Consumer free |
| Pro ($19.99/mo) | Google One AI Premium bundle pricing region-dependent |
| Ultra ($41.67/mo) | Annualized / effective monthly framing used in UI |
| API (Pay-as-you-go) | Developer API metering |

**Source (representative):** `https://ai.google.dev/pricing` and Google One marketing pages.

---

## Windsurf

| Plan label (UI string) | Notes |
|------------------------|--------|
| Free | Entry |
| Pro ($20/mo) | Individual Pro |
| Max ($200/mo) | Premium individual tier used in downgrade tests |
| Teams ($40/user/mo) | Team seats |
| Enterprise (Custom) | Deal-based |

**Source (representative):** `https://windsurf.com/pricing`

---

## Engine usage note

The audit engine matches **plan substrings** (e.g. `"Business ($40/user/mo)"`) against `t.plan` from the form. If vendor pricing changes, update **`TOOL_PLANS`** and **`PRICING_DATA.md`** together, then re-run `npx vitest run` because numeric expectations in tests encode specific tiers.
