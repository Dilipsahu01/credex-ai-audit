# Go-to-market — Credex AI Spend Audit

## ICP and pain

**Primary buyer / user:** Engineering managers at **10–50 person B2B SaaS** companies who own or co-own the **tooling and AI budget**—often reporting to a CFO who recently asked “why are we paying for ChatGPT Team *and* Copilot *and* Cursor?” They do not lack intelligence; they lack a **single normalized view** of overlapping capabilities, per-seat math, and compliance-safe downgrade paths. Credex AI Spend Audit is positioned as a **two-minute diagnostic**: fast enough to run between standups, specific enough to forward to finance, and grounded in explicit plan ladders rather than generic “AI ROI” vapor.

## Positioning

Lead with **budget leakage and duplicate coverage** (IDE assistant + general LLM + API spend), not “transformation.” The product’s unfair advantage is **Credex’s existing provider relationships and credit economics**—the audit is the wedge that earns permission to talk about **discounted AI credits** after trust is established with numbers.

## Channels (specific)

**Reddit — r/SaaS and r/ExperiencedDevs**  
Post as a practitioner building in public: share the **methodology** (deterministic rules + optional Haiku summary), anonymized savings histograms, and a link. Answer aggressively on pricing accuracy and ZDR/SSO caveats—engineers punish hand-wavy claims. Pin a top-level comment listing known limitations (US-centric public list prices, self-reported spend).

**Hacker News — Show HN**  
Title around **transparent rules + open outputs** rather than “we used AI.” Thread goal: technical peers validate the engine’s edge cases (Copilot Enterprise vs Business, ChatGPT→Cursor when `useCase === 'coding'`). Founder spends 3–4 hours in-thread on Day 0.

**X (Twitter) — cold DMs to founders**  
Target founders who recently tweeted about **API bills**, **seat counts**, or **SOC2 / SSO** pain. DM structure: one empathetic line, one quantified proof (“teams your size often double-pay X+Y”), link. No Calendly wall before they run the audit—**product first**.

## Unfair advantage: Credex relationships

Warm introductions from **existing Credex credit customers**, partner SREs at boutiques, and portfolio intros beat cold ads for the first hundred users. Bundle a **tracked landing param** (`?ref=credex-qbr`) so success can attribute audits to account-manager outreach without building a full attribution stack on day one.

## First 100 users — action plan

1. **Users 1–15 (week 1):** Personal network + 5 Credex customers; run live screenshare while they complete the form; log confusing plan labels.  
2. **Users 16–40 (week 2):** r/SaaS + targeted replies in “tool stack” threads; collect three written testimonials with company size and stack.  
3. **Users 41–70 (week 3):** Show HN + follow-up blog post dissecting one anonymized audit JSON.  
4. **Users 71–100 (week 4):** X DM batch to founders in AI-heavy verticals (devtools, legaltech, fintech); offer **15-minute stack review** only after audit completion to keep CAC time-boxed.

## Conversion motion

Free audit → optional Anthropic blurb → **email capture** → Supabase-backed **`/audit/{id}`** share link → human consult about **Credex credits**. Keep consult slides to **two concrete actions** derived from their JSON so it feels like expertise, not a generic pitch deck.

## Risks to name explicitly

- Self-reported spend can diverge from invoices—copy must say **directional**, not legal advice.  
- Gmail/Nodemailer deliverability at scale is poor vs. ESP—migrate once weekly audit volume exceeds a classroom demo.

This GTM assumes **organic-first CAC**; paid search is intentionally omitted until messaging is validated by real cohort completion rates.
