import {
  AuditFormData,
  AuditResult,
  ToolInput,
  ToolName,
  ToolRecommendation,
} from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────
const HIGH_SAVINGS_THRESHOLD = 500
const OPTIMAL_THRESHOLD = 100

// ─── Rule helpers ─────────────────────────────────────────────────
function savings(current: number, recommended: number, seats: number = 1) {
  // FIX 1: clamp to zero — savings can never be negative
  const monthly = Math.max(0, (current - recommended) * seats)
  return { monthlySavings: monthly, annualSavings: monthly * 12 }
}

// ─── Per-tool audit rules ─────────────────────────────────────────

function auditCursor(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base: Pick<ToolRecommendation, 'tool' | 'currentPlan' | 'currentMonthlySpend'> = {
    tool: 'cursor',
    currentPlan: t.plan,
    currentMonthlySpend: t.monthlySpend,
  }

  if (t.plan.includes('Business') && t.seats <= 25) {
    const s = savings(40, 20, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo per user)',
      reason: `Cursor Business ($40/user) is a 100% markup over Pro ($20/user) for admin/SSO features. At ${t.seats} seats, Pro provides identical AI capabilities and saves $${s.monthlySavings}/mo ($${s.annualSavings}/yr).`,
    }
  }

  if ((useCase === 'writing' || useCase === 'research') && !t.plan.includes('Hobby')) {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `Cursor is an IDE assistant — its value is in code completions, not ${useCase}. Claude Pro ($20/mo) is purpose-built for reasoning and writing workflows.`,
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

  if (t.plan.includes('Enterprise') && t.seats <= 30) {
    const s = savings(39, 19, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Business ($19/user/mo)',
      reason: `Copilot Enterprise ($39/user) adds custom models and GitHub Spark — rarely needed under 30 seats. Business ($19/user) covers the same autocomplete and admin controls. Saves $${s.monthlySavings}/mo ($${s.annualSavings}/yr).`,
    }
  }

  if (useCase === 'writing' || useCase === 'research') {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `GitHub Copilot is restricted to the IDE. For ${useCase} workflows, Claude Pro ($20/mo) is purpose-built and far more capable outside a code editor.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'GitHub Copilot is well-matched to your team size and use case.',
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
      reason: `Claude Team ($25/user) adds SSO and central billing — overkill for ${t.seats} user${t.seats > 1 ? 's' : ''}. Individual Pro plans at $20/user provide the same 200k context window and save $${s.monthlySavings}/mo.`,
    }
  }

  if (t.plan.includes('Max') && t.seats === 1) {
    const s = savings(100, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo)',
      reason: `Claude Max ($100/mo) gives 5–20× Pro usage limits. Unless you're hitting Pro's daily limits consistently, Pro ($20/mo) covers 95% of professional workloads and saves $${s.monthlySavings}/mo.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Claude is well-priced and optimal for reasoning-heavy workloads.',
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
      reason: `At $${t.monthlySpend}/mo on the Anthropic API, a Claude Pro subscription ($20/mo) offers more value — unlimited access, better UI, Claude Code, and no per-token billing anxiety.`,
    }
  }

  if (t.plan.includes('Opus') && (useCase === 'writing' || useCase === 'coding')) {
    return {
      ...base,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Sonnet ($3/1M input vs Opus $5/1M input)',
      monthlySavings: Math.round(t.monthlySpend * 0.4),
      annualSavings: Math.round(t.monthlySpend * 0.4 * 12),
      reason: `Claude Opus ($5/1M input) is optimized for complex research. For ${useCase}, Sonnet ($3/1M input) delivers comparable quality at 40% lower cost.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Your Anthropic API usage is cost-effective for your current volume.',
  }
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
      reason: `ChatGPT is a general-purpose assistant. For coding, Cursor Pro ($20/mo) provides inline IDE completions, agent mode, and deep codebase context — purpose-built for developers at the same price.`,
    }
  }

  if (t.plan.includes('Team') && t.seats <= 2) {
    const s = savings(30, 20, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Plus ($20/mo per user)',
      reason: `ChatGPT Team ($30/user) adds shared workspaces and admin controls. For ${t.seats} user${t.seats > 1 ? 's' : ''}, individual Plus plans at $${20 * t.seats}/mo save $${s.monthlySavings}/mo with identical model access.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'ChatGPT Plus is good value for writing and general assistance.',
  }
}

function auditOpenAIApi(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'openai-api' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  // FIX 2: GPT-5.5 for non-complex tasks — GPT-5.4 is 50% cheaper
  if (t.plan.includes('5.5') && t.monthlySpend > 50) {
    return {
      ...base,
      recommendedAction: 'downgrade',
      recommendedPlan: 'GPT-5.4 ($2.50/1M input)',
      monthlySavings: Math.round(t.monthlySpend * 0.5),
      annualSavings: Math.round(t.monthlySpend * 0.5 * 12),
      reason: `GPT-5.5 costs $5/1M input tokens vs GPT-5.4 at $2.50/1M — 100% more expensive with marginal quality difference for most ${useCase} tasks. Switching saves approximately 50% of your current API spend.`,
    }
  }

  // Low spend — subscription is better value
  if (t.monthlySpend < 20) {
    return {
      ...base,
      recommendedAction: 'switch',
      recommendedTool: 'chatgpt',
      recommendedPlan: 'ChatGPT Plus ($20/mo)',
      monthlySavings: 0,
      annualSavings: 0,
      reason: `At $${t.monthlySpend}/mo on the OpenAI API, ChatGPT Plus ($20/mo) likely offers more value — unlimited GPT-5.5 access, Deep Research, and Canvas with no per-token billing.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Your OpenAI API usage is well-matched to your current workload.',
  }
}

function auditGemini(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'gemini' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  // FIX 3: Gemini Ultra is overkill for most use cases
  if (t.plan.includes('Ultra')) {
    const s = savings(41.67, 19.99, 1)
    return {
      ...base,
      monthlySavings: parseFloat(s.monthlySavings.toFixed(2)),
      annualSavings: parseFloat(s.annualSavings.toFixed(2)),
      recommendedAction: 'downgrade',
      recommendedPlan: 'Gemini Pro ($19.99/mo)',
      reason: `Gemini Ultra ($41.67/mo) adds priority access and extended context windows. For ${useCase} workflows, Gemini Pro ($19.99/mo) handles the same tasks and saves $${s.monthlySavings.toFixed(2)}/mo ($${s.annualSavings.toFixed(2)}/yr).`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Gemini Pro offers strong context-per-dollar value for your use case.',
  }
}

function auditWindsurf(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'windsurf' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (t.plan.includes('Max')) {
    const s = savings(200, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo)',
      reason: `Windsurf Max ($200/mo) is for extremely heavy agentic usage. Pro ($20/mo) covers standard AI coding assistance for most developers and saves $${s.monthlySavings}/mo ($${s.annualSavings}/yr).`,
    }
  }

  if (t.plan.includes('Teams') && t.seats <= 2) {
    const s = savings(40, 20, t.seats)
    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: `Pro ($20/mo × ${t.seats} = $${20 * t.seats}/mo)`,
      reason: `Windsurf Teams ($40/user) adds admin controls and zero data retention. For ${t.seats} user${t.seats > 1 ? 's' : ''}, individual Pro plans at $${20 * t.seats}/mo save $${s.monthlySavings}/mo with identical AI coding features.`,
    }
  }

  if (useCase === 'writing' || useCase === 'research') {
    return {
      ...base,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      monthlySavings: Math.max(0, t.monthlySpend - 20),
      annualSavings: Math.max(0, (t.monthlySpend - 20) * 12),
      reason: `Windsurf is an AI-powered IDE. For ${useCase}, Claude Pro ($20/mo) provides far better return as a reasoning and writing tool.`,
    }
  }

  return {
    ...base,
    recommendedAction: 'optimal',
    monthlySavings: 0,
    annualSavings: 0,
    reason: 'Windsurf Pro is competitive pricing for AI-assisted coding.',
  }
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
