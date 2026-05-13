# Landing page copy — Credex AI Spend Audit

## Hero

**Headline:** Find out if you're overpaying for AI tools  

**Subheadline:** Free 2-minute audit. See exactly where your team's AI budget is leaking and how to fix it.

**Primary CTA:** Audit My AI Spend →  

**Secondary line (trust):** No signup required to run the audit. Email only if you want your saved report link.

---

## Section: “Built for SaaS engineering budgets”

Credex AI Spend Audit is aimed at **10–50 person B2B SaaS** teams paying for overlapping AI products—IDE assistants, general chat, and direct API usage. You select tools and plans you already recognize from your invoices; we highlight **downgrade**, **switch**, and **compliance-gated** paths with explicit dollar estimates.

---

## FAQs

### 1. Data privacy — what leaves my laptop?

Until you submit the lead form, your inputs are stored in **browser localStorage** (`credex-audit-form`) for refresh resilience—they are **not** sent to our servers. If you save an audit, we persist **form JSON + results JSON** to **Supabase** and send email via **Gmail (Nodemailer)** so you can reopen **`/audit/{id}`**. Optional **Anthropic** summary calls send **aggregated audit text**, not raw secrets you never typed.

### 2. How accurate is the pricing?

Recommendations use **public plan ladders** encoded in `TOOL_PLANS` (see `PRICING_DATA.md`) and the spend numbers **you enter**. Enterprise discounts, annual prepay, and regional tax are not modeled. Treat outputs as **directional savings** for internal discussion—not legal, procurement, or tax advice.

### 3. Does the audit cost money?

Running the audit and viewing `/results` is **free**. Credex may follow up about **discounted AI credits** if you opt in via the modal—there is no paywall inside the tool for the class MVP.

### 4. Who is this for?

**Engineering managers and founders** at small SaaS shops who pay for multiple AI tools and need a defensible story for finance. It is **not** a full ITAM system, not a vendor DPA repository, and not optimized for non-SaaS orgs (e.g., regulated banks) without your own compliance review.

### 5. How is this different from checking invoices manually?

Spreadsheets rarely encode **cross-tool substitution rules** (e.g., coding use case routing ChatGPT spend toward Cursor) or **compliance-aware downgrade blocks** when ZDR/SSO is required. The audit engine centralizes those rules as **tested TypeScript** (`npx vitest run`) instead of tribal knowledge living in one EM’s head.

---

## Footer microcopy

**Credex** · AI Spend Audit · Questions? Link your completed audit ID in email to support.
