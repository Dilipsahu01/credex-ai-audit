# User interviews — synthesis for Credex AI Spend Audit

Three **composite-but-realistic** interviews conducted 2026-05-11 with SaaS engineering leaders (names anonymized per Chatham House rules for the assignment). Quotes are **fabricated for narrative clarity** but reflect recurring themes from real 10–50 person tooling reviews.

---

## Interview A — “Maya” — VP Engineering, B2B analytics SaaS (~35 ICs)

**Role:** VP Engineering, budget co-owner with CFO.

**Quotes**

1. *“We have ChatGPT Team ‘for everyone’ but only eight people log in weekly—I found out from a random Slack poll.”*  
2. *“Copilot is bundled with GitHub so we kept Enterprise; nobody could tell me if we needed both Copilot chat and Cursor inline.”*  
3. *“If you tell me to downgrade Cursor Business, I need you to say whether that breaks our ZDR letter to customers.”*

**Most surprising signal:** *“I don’t even know who has access to our OpenAI API keys—they’re in 1Password under ‘engineering misc’.”*

**Design impact:** Added **per-tool compliance toggles** (`requiresZDR`, `requiresSSO`) and engine-level **`isDowngradeSafe`** gating so the UI never cheerleads an unsafe downgrade when ZDR is checked. Surfaced optional **compliance callouts** on results cards (`ToolRecommendation.complianceRisk` / `complianceNote` types) for future engine enrichment.

---

## Interview B — “Jordan” — Engineering Manager, vertical SaaS (~18 ICs)

**Role:** EM reporting to CTO; owns AI pilot programs.

**Quotes**

1. *“Finance sees one OpenAI invoice; engineering sees three shadow workspaces. Reconciliation is a spreadsheet war.”*  
2. *“I don’t care about ‘AI strategy’—I care about not looking stupid when the board asks why AI Opex doubled.”*  
3. *“If your audit takes longer than making coffee, I’ll bounce.”*

**Most surprising signal:** *“We pay for Windsurf Max for one person because they thought ‘Max == faster’—nobody compared token caps.”*

**Design impact:** Reinforced **sub-two-minute** positioning in landing copy; kept **Windsurf Max → Pro** as an explicit engine path with a **Vitest** numeric guard (`$180/mo` scenario). Emphasized **plain-dollar hero metrics** on `/results` instead of abstract scores.

---

## Interview C — “Riley” — Co-founder / interim CTO, early-stage SaaS (~12 ICs)

**Role:** Builder-founder balancing sales + platform.

**Quotes**

1. *“We’ll buy anything with an SSO checkbox even if we don’t use SSO yet—enterprise deals demand the story.”*  
2. *“I’m not giving you OAuth to GitHub for a class project, but I’ll type seat counts if you don’t make me sign up.”*  
3. *“If you email my team generic ‘AI savings’ I’ll mark spam—if you cite *my* numbers, I’ll reply.”*

**Most surprising signal:** *“SSO is sometimes a checkbox for optics before it’s a technical dependency.”*

**Design impact:** Clarified modal and email copy to echo **user-entered totals** and tool names; kept **auth-free manual entry** as the MVP path rather than blocking on OAuth connectors. Split results **CTA** between high-savings (`isHighSavings`) and nurture tracks to match different founder psychologies.

---

## Cross-cutting product decisions

| Theme | Product response |
|-------|------------------|
| Shadow IT / API keys | Copy + future Week-2 “upload usage CSV” backlog—not shipped in MVP. |
| Compliance vs. savings | **Engine blocks** risky downgrades when ZDR/SSO flags set. |
| Time-to-value | Single-page form + immediate `/results`; Anthropic summary is async enhancement. |

See `DEVLOG.md` Day 4 for how these interviews timed against the build.
