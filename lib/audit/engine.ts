import {
  AuditFormData,
  AuditResult,
  ToolInput,
  ToolName,
  ToolRecommendation,
  ComplianceNeeds,
} from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────
const HIGH_SAVINGS_THRESHOLD = 500
const OPTIMAL_THRESHOLD = 100

// ─── Rule helpers ─────────────────────────────────────────────────

/**
 * Bug Fix 2: Calculates savings based on actual spend per seat.
 * Falls back to official prices if actual spend is not applicable.
 */
function savings(
  officialPrice: number,
  recommendedPrice: number,
  seats: number = 1,
  actualSpendPerSeat?: number
) {
  const effectiveCurrent = actualSpendPerSeat ?? officialPrice
  const monthly = Math.max(0, (effectiveCurrent - recommendedPrice) * seats)
  return { monthlySavings: monthly, annualSavings: monthly * 12 }
}

// ─── Compliance capability map ────────────────────────────────────
// Source: official plan feature pages, verified 2026-05-07
const PLAN_CAPABILITIES: Record<string, { hasZDR: boolean; hasSSO: boolean }> = {
  'cursor-pro':          { hasZDR: false, hasSSO: false },
  'cursor-business':     { hasZDR: true,  hasSSO: true  },
  'copilot-pro':         { hasZDR: false, hasSSO: false },
  'copilot-business':    { hasZDR: true,  hasSSO: false },
  'copilot-enterprise':  { hasZDR: true,  hasSSO: true  },
  'claude-pro':          { hasZDR: false, hasSSO: false },
  'claude-team':         { hasZDR: true,  hasSSO: true  },
  'chatgpt-plus':        { hasZDR: false, hasSSO: false },
  'chatgpt-team':        { hasZDR: true,  hasSSO: false },
  'windsurf-pro':        { hasZDR: false, hasSSO: false },
  'windsurf-teams':      { hasZDR: true,  hasSSO: true  },
}

function isDowngradeSafe(
  targetPlanKey: string,
  needs?: ComplianceNeeds
): boolean {
  if (!needs || (!needs.requiresZDR && !needs.requiresSSO)) return true
  const cap = PLAN_CAPABILITIES[targetPlanKey]
  if (!cap) return false 
  if (needs.requiresZDR && !cap.hasZDR) return false
  if (needs.requiresSSO && !cap.hasSSO) return false
  return true
}

// ─── Per-tool audit rules ─────────────────────────────────────────

function auditCursor(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'cursor' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }
  const actualPerSeat = t.seats > 0 ? t.monthlySpend / t.seats : 40

  if (t.plan.includes('Business') && t.seats <= 25) {
    const s = savings(40, 20, t.seats, actualPerSeat)

    if (!isDowngradeSafe('cursor-pro', t.compliance)) {
      return {
        ...base,
        recommendedAction: 'optimal',
        monthlySavings: 0,
        annualSavings: 0,
        reason: `Cursor Business is justified — your Zero Data Retention or SSO requirement means Pro ($20/user) is not a safe downgrade for your compliance needs.`,
      }
    }

    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/mo per user)',
      reason: `Cursor Business ($40/user) is a 100% markup over Pro for admin/SSO features. At ${t.seats} seats, Pro provides identical AI capabilities and saves $${s.monthlySavings}/mo.`,
    }
  }

  // Bug Fix 1: Added 'mixed' use case
  if ((useCase === 'writing' || useCase === 'research' || useCase === 'mixed') && !t.plan.includes('Hobby')) {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `Cursor is an IDE assistant. For ${useCase} workflows, Claude Pro ($20/mo) is purpose-built for reasoning and writing.`,
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
  const actualPerSeat = t.seats > 0 ? t.monthlySpend / t.seats : 39

  if (t.plan.includes('Enterprise') && t.seats <= 30) {
    const s = savings(39, 19, t.seats, actualPerSeat)

    if (!isDowngradeSafe('copilot-business', t.compliance)) {
      return {
        ...base,
        recommendedAction: 'optimal',
        monthlySavings: 0,
        annualSavings: 0,
        reason: `GitHub Copilot Enterprise is justified by your ZDR/SSO compliance requirements.`,
      }
    }

    return {
      ...base, ...s,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Business ($19/user/mo)',
      reason: `Copilot Enterprise ($39/user) adds custom models rarely needed under 30 seats. Business ($19/user) covers the same autocomplete and admin controls. Saves $${s.monthlySavings}/mo.`,
    }
  }

  // Bug Fix 1: Added 'mixed' use case
  if (useCase === 'writing' || useCase === 'research' || useCase === 'mixed') {
    const s = savings(t.monthlySpend, 20, 1)
    return {
      ...base, ...s,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      reason: `GitHub Copilot is restricted to the IDE. For ${useCase} workflows, Claude Pro is purpose-built and far more capable outside a code editor.`,
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
  const actualPerSeat = t.seats > 0 ? t.monthlySpend / t.seats : (t.plan.includes('Team') ? 25 : 100)

  if (t.plan.includes('Team') && t.seats <= 5) {
    const s = savings(25, 20, t.seats, actualPerSeat)
    if (!isDowngradeSafe('claude-pro', t.compliance)) {
      return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: `Claude Team is justified by your ZDR/SSO compliance requirements.` }
    }
    return { ...base, ...s, recommendedAction: 'downgrade', recommendedPlan: 'Pro ($20/mo per user)', reason: `Individual Pro plans at $20/user provide the same capabilities for small teams and save $${s.monthlySavings}/mo.` }
  }

  if (t.plan.includes('Max') && t.seats === 1) {
    const s = savings(100, 20, 1, actualPerSeat)
    return { ...base, ...s, recommendedAction: 'downgrade', recommendedPlan: 'Pro ($20/mo)', reason: `Claude Pro covers 95% of professional workloads and saves $${s.monthlySavings}/mo.` }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Claude is well-priced and optimal for reasoning-heavy workloads.' }
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
      reason: `At $${t.monthlySpend}/mo on the API, a Claude Pro subscription ($20/mo) offers more value including better UI and no per-token billing anxiety.`,
    }
  }

  if (t.plan.includes('Opus') && (useCase === 'writing' || useCase === 'coding')) {
    return {
      ...base,
      recommendedAction: 'downgrade',
      recommendedPlan: 'Sonnet ($3/1M input vs Opus $5/1M input)',
      monthlySavings: Math.round(t.monthlySpend * 0.4),
      annualSavings: Math.round(t.monthlySpend * 0.4 * 12),
      reason: `Claude Opus is optimized for complex research. For ${useCase}, Sonnet delivers comparable quality at 40% lower cost.`,
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Your Anthropic API usage is cost-effective for your current volume.' }
}

function auditChatGPT(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'chatgpt' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }
  const actualPerSeat = t.seats > 0 ? t.monthlySpend / t.seats : 30

  if (useCase === 'coding') {
    const s = savings(t.monthlySpend, 20, 1)
    return { ...base, ...s, recommendedAction: 'switch', recommendedTool: 'cursor', recommendedPlan: 'Cursor Pro ($20/mo)', reason: `For coding, Cursor Pro provides inline IDE completions and deep codebase context at the same price.` }
  }

  if (t.plan.includes('Team') && t.seats <= 2) {
    const s = savings(30, 20, t.seats, actualPerSeat)
    if (!isDowngradeSafe('chatgpt-plus', t.compliance)) {
      return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: `ChatGPT Team is justified by compliance needs.` }
    }
    return { ...base, ...s, recommendedAction: 'downgrade', recommendedPlan: 'Plus ($20/mo per user)', reason: `Individual Plus plans save $${s.monthlySavings}/mo with identical model access.` }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'ChatGPT Plus is good value for writing and general assistance.' }
}

function auditOpenAIApi(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'openai-api' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (t.plan.includes('5.5') && t.monthlySpend > 50) {
    return {
      ...base,
      recommendedAction: 'downgrade',
      recommendedPlan: 'GPT-5.4 ($2.50/1M input)',
      monthlySavings: Math.round(t.monthlySpend * 0.5),
      annualSavings: Math.round(t.monthlySpend * 0.5 * 12),
      reason: `GPT-5.5 is 100% more expensive than GPT-5.4 with marginal quality difference for most ${useCase} tasks. Switching saves approximately 50% of spend.`,
    }
  }

  if (t.monthlySpend < 20) {
    return {
      ...base,
      recommendedAction: 'switch',
      recommendedTool: 'chatgpt',
      recommendedPlan: 'ChatGPT Plus ($20/mo)',
      monthlySavings: 0,
      annualSavings: 0,
      reason: `At low spend, ChatGPT Plus ($20/mo) offers more value with unlimited access and Deep Research features.`,
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Your OpenAI API usage is well-matched to your current workload.' }
}

function auditGemini(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'gemini' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }

  if (t.plan.includes('Ultra')) {
    const s = savings(41.67, 19.99, 1)
    return {
      ...base,
      monthlySavings: parseFloat(s.monthlySavings.toFixed(2)),
      annualSavings: parseFloat(s.annualSavings.toFixed(2)),
      recommendedAction: 'downgrade',
      recommendedPlan: 'Gemini Pro ($19.99/mo)',
      reason: `Gemini Pro handles the same tasks as Ultra for ${useCase} workflows and saves $${s.monthlySavings.toFixed(2)}/mo.`,
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Gemini Pro offers strong context-per-dollar value.' }
}

function auditWindsurf(t: ToolInput, teamSize: number, useCase: string): ToolRecommendation {
  const base = { tool: 'windsurf' as ToolName, currentPlan: t.plan, currentMonthlySpend: t.monthlySpend }
  const actualPerSeat = t.seats > 0 ? t.monthlySpend / t.seats : (t.plan.includes('Max') ? 200 : 40)

  if (t.plan.includes('Max')) {
    const s = savings(200, 20, 1, actualPerSeat)
    return { ...base, ...s, recommendedAction: 'downgrade', recommendedPlan: 'Pro ($20/mo)', reason: `Windsurf Max is for extreme agentic usage. Pro covers standard AI coding assistance and saves $${s.monthlySavings}/mo.` }
  }

  if (t.plan.includes('Teams') && t.seats <= 2) {
    const s = savings(40, 20, t.seats, actualPerSeat)
    if (!isDowngradeSafe('windsurf-pro', t.compliance)) {
      return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: `Windsurf Teams is justified by compliance requirements.` }
    }
    return { ...base, ...s, recommendedAction: 'downgrade', recommendedPlan: `Pro ($20/mo per user)`, reason: `Individual Pro plans save $${s.monthlySavings}/mo with identical features.` }
  }

  // Bug Fix 1: Added 'mixed' use case
  if (useCase === 'writing' || useCase === 'research' || useCase === 'mixed') {
    return {
      ...base,
      recommendedAction: 'switch',
      recommendedTool: 'claude',
      recommendedPlan: 'Claude Pro ($20/mo)',
      monthlySavings: Math.max(0, t.monthlySpend - 20),
      annualSavings: Math.max(0, (t.monthlySpend - 20) * 12),
      reason: `Windsurf is an AI-powered IDE. For ${useCase}, Claude Pro provides far better return as a reasoning tool.`,
    }
  }

  return { ...base, recommendedAction: 'optimal', monthlySavings: 0, annualSavings: 0, reason: 'Windsurf Pro is competitive pricing for AI coding.' }
}

// ─── Cross-tool duplicate detection ──────────────────────────────
/**
 * Bug Fix 3: Detects overlapping subscriptions across different tools.
 */
function detectDuplicates(
  formData: AuditFormData,
  recommendations: ToolRecommendation[]
): ToolRecommendation[] {
  const tools = formData.tools.map(t => t.tool)
  
  const hasClaude = tools.includes('claude')
  const hasChatGPT = tools.includes('chatgpt')
  if (hasClaude && hasChatGPT && formData.useCase !== 'coding') {
    return recommendations.map(r => {
      if (r.tool === 'chatgpt' && r.recommendedAction === 'optimal') {
        const chatgptSpend = formData.tools.find(t => t.tool === 'chatgpt')?.monthlySpend ?? 20
        return {
          ...r,
          recommendedAction: 'switch' as const,
          recommendedTool: 'claude' as const,
          monthlySavings: chatgptSpend,
          annualSavings: chatgptSpend * 12,
          reason: `You're paying for both Claude and ChatGPT for ${formData.useCase} work — these overlap significantly. Removing ChatGPT saves $${chatgptSpend}/mo.`,
        }
      }
      return r
    })
  }

  const hasCursor = tools.includes('cursor')
  const hasWindsurf = tools.includes('windsurf')
  if (hasCursor && hasWindsurf) {
    return recommendations.map(r => {
      if (r.tool === 'windsurf' && r.recommendedAction === 'optimal') {
        const windsurfSpend = formData.tools.find(t => t.tool === 'windsurf')?.monthlySpend ?? 20
        return {
          ...r,
          recommendedAction: 'switch' as const,
          recommendedTool: 'cursor' as const,
          monthlySavings: windsurfSpend,
          annualSavings: windsurfSpend * 12,
          reason: `You're paying for both Cursor and Windsurf IDEs. They do the same job; removing Windsurf saves $${windsurfSpend}/mo.`,
        }
      }
      return r
    })
  }

  return recommendations
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
  let recommendations = formData.tools.map((tool) =>
    AUDIT_MAP[tool.tool](tool, formData.teamSize, formData.useCase)
  )

  // Bug Fix 3: Cross-tool duplicate detection
  recommendations = detectDuplicates(formData, recommendations)

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
