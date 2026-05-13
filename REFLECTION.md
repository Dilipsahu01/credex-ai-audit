# Reflection — Credex AI Spend Audit

## 1. Hardest bug — localStorage, hydration, and the “silent wipe”

The hardest bug cluster involved **React + localStorage**, not Supabase or Anthropic. Client components in the App Router still participate in an initial render discipline: anything that assumes `window` or `localStorage` exists in the component initializer can create **hydration mismatches** if the server HTML and the client’s first pass disagree. The more damaging issue was operational: we had one `useEffect` that **persisted** `formData` to `credex-audit-form` on every change, including the **first mount**. On that mount, state was still the **default empty** `AuditFormData` while a second effect was about to **read** the user’s saved JSON and call `setState`. Because effects run after paint in declaration order, the persist effect could **overwrite real user data with an empty object** before hydration completed—users thought the product “forgot” their audit after refresh. Fixing it required **deferring** state application (`queueMicrotask` so batching and ESLint hook rules stayed sane) and a **one-time ref skip** so we never write to `localStorage` until after we have either loaded stored state or the user has intentionally mutated the form. That combination restored deterministic refresh behavior and is why the assignment narrative emphasizes “mounted client effects” rather than reading storage synchronously during render. Teaching assistants grading the repo should look for the **persist skip ref** and **`queueMicrotask`** pairing in `SpendForm` and `/results`—they are the concrete artifacts of this debugging arc, not theoretical commentary.

## 2. A reversed decision — Resend vs. Nodemailer + Gmail

Early commits used **Resend** with a developer `from` domain suitable for prototyping. For a graded demo with tight turnaround, we **reversed** to **Nodemailer + Gmail** using an **application-specific password**. The decision was pragmatic: no DNS TXT gymnastics, no sandbox-only recipient lists, and immediate end-to-end proof that `POST /api/save-audit` could notify a real inbox. The downside is real too: Gmail daily send caps, weaker bounce observability than Postmark/SendGrid, and the long-term obligation to rotate app passwords if team members change. We documented the reversal in README and architecture notes so future maintainers do not mistake Gmail for the final enterprise mail architecture—only for the **instant-setup** phase of the class deliverable. Operationally, we also added a **503 guard** when `EMAIL_APP_PASSWORD` is absent so graders get a clear configuration error instead of a silent `Internal server error` after successful database writes.

## 3. Week 2 plans — team invites and real API reconciliation

If this graduates from assignment to product, Week 2 focuses on **collaboration** and **truth sources**. Team invites mean an `Organization` model, role-based read access to audits, and optional comment threads on recommendations. “Actual API integrations” means read-only connectors—GitHub org seat counts, OpenAI usage CSV uploads, or Cursor billing exports—used to **reconcile** self-reported `monthlySpend` rather than to auto-run financial advice without consent. Each connector would ship behind OAuth scopes and explicit copy about data retention. None of that belongs in the MVP path, which intentionally stays anonymous until email capture because speed of audit completion is the learning metric. A lightweight **audit versioning** field (`results_json.schema_version`) would likely accompany Week 2 so mixed mobile clients do not mis-parse older payloads.

## 4. AI usage — where models helped vs. where they did not

We leaned on **Cursor and Claude** for **mechanical quality**: ESLint (`@next/next/no-html-link-for-pages`, hook lint), TypeScript optional fields on `ToolRecommendation`, README and assignment markdown structure, and repetitive refactors across `app/results/page.tsx`. We **did not** let models author `lib/audit/engine.ts` beyond small, reviewed snippets: the downgrade math, compliance gating, and cross-tool switch rules were written and tested manually because numeric regressions are easy for LLMs to introduce subtly. **Anthropic** is used only inside `generate-summary` with a tightly scoped prompt and `max_tokens: 150`, matching the product stance that **numbers are deterministic** and **copy is assistive**. We rejected “let the model propose savings” early because it would break testability and blur compliance gating that must remain code-owned.

## 5. Self-rating (1–10)

| Dimension | Score | Notes |
|-----------|------:|-------|
| **Discipline** | 8 | CI on every push, DEVLOG alignment to git history, resisted feature creep except compliance gating backed by interviews. |
| **Code quality** | 8 | Strong typing on public shapes, Vitest on engine, graceful API fallbacks; `save-audit` still does too much in one handler. |
| **Design** | 7 | Coherent shadcn layout and results narrative; could deepen typography scale and loading skeletons for slower networks. |
| **Entrepreneurial thinking** | 8 | Clear ICP, funnel math, channel specificity, “unfair advantage” via Credex relationships—needs post-launch metrics to validate. |

The biggest gap across all four dimensions is **measurement wiring** (product analytics not instrumented in code)—acceptable for a class MVP but not for a Series A narrative without a week of instrumentation work.
