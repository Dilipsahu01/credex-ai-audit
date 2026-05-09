export type ToolName =
  | 'cursor'
  | 'github-copilot'
  | 'claude'
  | 'anthropic-api'
  | 'chatgpt'
  | 'openai-api'
  | 'gemini'
  | 'windsurf'

export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed'

// What the user's org requires
export interface ComplianceNeeds {
  requiresZDR: boolean  // Zero Data Retention
  requiresSSO: boolean  // Single Sign-On
}

// What the user fills in for each tool
export interface ToolInput {
  tool: ToolName
  plan: string
  monthlySpend: number
  seats: number
  compliance?: ComplianceNeeds  // ← added compliance gating
}

// What the form collects overall
export interface AuditFormData {
  tools: ToolInput[]
  teamSize: number
  useCase: UseCase
}

// What the audit engine returns for each tool
export interface ToolRecommendation {
  tool: ToolName
  currentPlan: string
  currentMonthlySpend: number
  recommendedAction: 'downgrade' | 'switch' | 'optimal' | 'upgrade-warning'
  recommendedPlan?: string
  recommendedTool?: ToolName
  monthlySavings: number
  annualSavings: number
  reason: string
}

// Full audit result
export interface AuditResult {
  recommendations: ToolRecommendation[]
  totalMonthlySavings: number
  totalAnnualSavings: number
  isHighSavings: boolean   // true if > $500/mo savings
  isOptimal: boolean       // true if < $100/mo savings
  aiSummary?: string       // from Anthropic API
  createdAt: string
}

// What gets stored in Supabase
export interface StoredAudit {
  id: string
  tools_json: ToolInput[]
  results_json: AuditResult
  total_monthly_savings: number
  total_annual_savings: number
  team_size: number
  use_case: UseCase
  is_public: boolean
  created_at: string
}

// Plan options per tool (used in the form dropdowns)
export const TOOL_PLANS: Record<ToolName, string[]> = {
  'cursor': ['Hobby (Free)', 'Pro ($20/mo)', 'Business ($40/user/mo)', 'Enterprise (Custom)'],
  'github-copilot': ['Free', 'Pro ($10/mo)', 'Pro+ ($39/mo)', 'Business ($19/user/mo)', 'Enterprise ($39/user/mo)'],
  'claude': ['Free', 'Pro ($20/mo)', 'Max ($100/mo)', 'Team ($25/user/mo)', 'Enterprise (Custom)'],
  'anthropic-api': ['Pay-as-you-go (Haiku)', 'Pay-as-you-go (Sonnet)', 'Pay-as-you-go (Opus)'],
  'chatgpt': ['Free', 'Plus ($20/mo)', 'Team ($30/user/mo)', 'Enterprise (Custom)'],
  'openai-api': ['Pay-as-you-go (GPT-5.4 mini)', 'Pay-as-you-go (GPT-5.4)', 'Pay-as-you-go (GPT-5.5)'],
  'gemini': ['Free', 'Pro ($19.99/mo)', 'Ultra ($41.67/mo)', 'API (Pay-as-you-go)'],
  'windsurf': ['Free', 'Pro ($20/mo)', 'Max ($200/mo)', 'Teams ($40/user/mo)', 'Enterprise (Custom)'],
}

export const TOOL_LABELS: Record<ToolName, string> = {
  'cursor': 'Cursor',
  'github-copilot': 'GitHub Copilot',
  'claude': 'Claude (Anthropic)',
  'anthropic-api': 'Anthropic API Direct',
  'chatgpt': 'ChatGPT (OpenAI)',
  'openai-api': 'OpenAI API Direct',
  'gemini': 'Google Gemini',
  'windsurf': 'Windsurf',
}
