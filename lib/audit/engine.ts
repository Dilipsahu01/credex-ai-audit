import {
  AuditFormData,
  AuditResult,
  ToolInput,
  ToolName,
  ToolRecommendation,
} from '@/lib/types'

// ─── Constants (Credex Requirement) ───────────────────────────────
const HIGH_SAVINGS_THRESHOLD = 500 // cite: 70
const OPTIMAL_THRESHOLD = 100     // cite: 71

// ─── Rule helpers ───────────────────────────────────────────────

function savings(current: number, recommended: number, seats: number = 1) {
  const monthly = (current - recommended) * seats
  return { monthlySavings: monthly, annualSavings: monthly * 12 }
}

// ─── Per-tool audit rules ────────────────────────────────────────

function auditCursor(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base: Pick<ToolRecommendation, 'tool' | 'currentPlan' | 'currentMonthlySpend'> = {
    tool: 'cursor',
    currentPlan: t.plan,
    currentMonthlySpend: t.monthlySpend,
  }

  // Business ($40) to Pro ($20) — Defensible for teams up to 25 seats
  // Most startups don't need $20/user extra for SSO/SAML until they hit Series B+
  if (t.plan.includes('Business') && t.seats <= 25) {
    const s = savings(40, 20, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo per user)',
      reason: `Cursor Business ($40/user) is a 100% markup over Pro ($20/user) for admin/SSO features. At ${t.seats} seats, moving to Pro plans provides identical AI capabilities and saves $${s.monthlySavings}/mo.`,
    }
  }

  if ((useCase === 'writing' || useCase === 'research') && !t.plan.includes('Hobby')) {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `Cursor is an IDE. For ${useCase}, Claude Pro ($20/mo) offers better reasoning models and writing UI for the same or lower cost.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Cursor Pro is the gold standard for coding-focused individuals and teams.',
  }
}

function auditCopilot(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'github-copilot' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  // Enterprise ($39) to Business ($19) — Defensible for teams up to 30 seats
  if (t.plan.includes('Enterprise') && t.seats <= 30) {
    const s = savings(39, 19, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Business ($19/user/mo)',
      reason: `Copilot Enterprise ($39/user) adds custom models and Spark. Unless you are training custom models, Business ($19/user) offers the same autocomplete efficiency. Saves $${s.monthlySavings}/mo.`,
    }
  }

  if (useCase === 'writing' || useCase === 'research') {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `GitHub Copilot is restricted to the IDE. Claude Pro ($20/mo) is purpose-built for ${useCase} workflows.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'GitHub Copilot is well-matched to your current tech stack.',
  }
}

function auditClaude(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'claude' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (t.plan.includes('Team') && t.seats <= 5) {
    const s = savings(25, 20, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo per user)',
      reason: `Claude Team ($25/user) is overkill for small groups. Individual Pro plans ($20/user) provide the same 200k context window and save $${s.monthlySavings}/mo.`,
    }
  }

  if (t.plan.includes('Max') && t.seats === 1) {
    const s = savings(100, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo)',
      reason: `Claude Max ($100/mo) is for extreme power users. Pro ($20/mo) covers 95% of professional use cases at 1/5th the cost.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Claude is the optimal choice for reasoning-heavy workloads.',
  }
}

function auditAnthropicApi(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'anthropic-api' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (t.monthlySpend < 25) {
    return {
      ...base,
      monthlySavings: 0,
      annualSavings: 0,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `At $${t.monthlySpend}/mo on API, a Claude Pro subscription ($20/mo) is more economical and provides a better UI for ${useCase}.`,
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'API usage is cost-effective for your volume.' }
}

function auditChatGPT(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'chatgpt' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (useCase === 'coding') {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'cursor',
      recommendedPlan: 'Cursor Pro ($20/mo)',
      reason: 'ChatGPT is a chatbot. For coding, Cursor Pro ($20/mo) provides deeper IDE context and faster iteration at a similar price point.',
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'ChatGPT Plus is well-priced for general assistance.' }
}

function auditOpenAIApi(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'openai-api' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }
  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'OpenAI API usage is optimal.' }
}

function auditGemini(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'gemini' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }
  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Gemini Pro offers excellent context-per-dollar value.' }
}

function auditWindsurf(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'windsurf' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (t.plan.includes('Max')) {
    const s = savings(200, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo)',
      reason: `Windsurf Max ($200/mo) is a massive jump from Pro ($20/mo). Only switch if you are exceeding Pro limits daily.`,
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Windsurf Pro is a strong choice for agentic coding.' }
}

// ─── Main engine function ─────────────────────────────────────────

const AUDIT_MAP: Record<
  ToolName,
  (t: ToolInput, teamSize: number, useCase: string) => ToolRecommendation
> = {
  'cursor': auditCursor,
  'github-copilot': auditCopilot,
  'claude': auditClaude,
  'anthropic-api': auditAnthropicApi,
  'chatgpt': auditChatGPT,
  'openai-api': auditOpenAIApi,
  'gemini': auditGemini,
  'windsurf': auditWindsurf,
}

export function runAudit(formData: AuditFormData): AuditResult {
  const recommendations = formData.tools.map((tool) =>
    AUDIT_MAP[tool.tool](tool, formData.teamSize, formData.useCase)
  )

  const totalMonthlySavings = recommendations.reduce(
    (sum, r) => sum + r.monthlySavings, 0
  )
  const totalAnnualSavings = totalMonthlySavings * 12

  return {
    recommendations,
    totalMonthlySavings,
    totalAnnualSavings,
    isHighSavings: totalMonthlySavings > HIGH_SAVINGS_THRESHOLD,
    isOptimal: totalMonthlySavings < OPTIMAL_THRESHOLD,
    createdAt: new Date().toISOString(),
  }
}
