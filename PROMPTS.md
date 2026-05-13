# Prompts — Anthropic executive summary

The only LLM prompt shipped in production lives in **`app/api/generate-summary/route.ts`**. It is built **server-side** after the deterministic audit completes; the model never invents savings numbers—it only narrates the precomputed `AuditResult`.

---

## Dynamic construction

The handler first derives `toolSummary` by mapping each `ToolRecommendation`:

- `optimal` → `"{Label}: already optimal"`
- `downgrade` → `"{Label}: downgrade from {currentPlan} to {recommendedPlan}, saves ${monthlySavings}/mo"`
- `switch` → `"{Label}: switch to {recommendedPlan}, saves ${monthlySavings}/mo"`
- else → `"{Label}: review needed"`

Those lines are joined with newlines and injected into the user message below.

---

## Exact prompt template (with placeholders)

The following is the literal template in code (template literals expanded for reading):

```
You are a concise financial advisor for tech startups. A startup has just run an AI tool spend audit. Write a 2-3 sentence personalized summary of their results. Be specific with numbers. Be encouraging but honest. Do not use bullet points. Do not use markdown. Plain text only.

Audit results:
- Team size: ${formData.teamSize} people
- Primary use case: ${formData.useCase}
- Total monthly savings identified: $${result.totalMonthlySavings.toFixed(0)}/mo ($${result.totalAnnualSavings.toFixed(0)}/year)
- Tools audited:
${toolSummary}

Write the summary now:
```

---

## Model and generation settings

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | `claude-haiku-4-5-20251001` | Low-latency, cost-aware path for a free audit accessory |
| `max_tokens` | `150` | Hard cap keeps responses short and prevents rambling “consulting deck” tone |
| Role | Single `user` message | No multi-turn tool use; simplest failure surface |

On API error, the route logs and returns `{ summary: null }` with HTTP **200** so the results page uses deterministic fallback copy instead of breaking.

---

## Why the prompt is concise and not “salesy”

1. **Trust** — Overselling would undermine the engineering audience; the copy is framed as a **financial advisor**, not a Credex SDR.  
2. **Factual anchoring** — Totals and per-tool lines are **injected**, not asked to be inferred, reducing hallucinated dollars.  
3. **Format constraints** — “No bullet points / no markdown / plain text” keeps the summary embeddable inline in the UI card without sanitization complexity.  
4. **Length cap** — 2–3 sentences plus `max_tokens: 150` prevents the model from turning a quick audit into a vendor pitch, preserving focus on **what changed numerically** and whether the stack is healthy.
