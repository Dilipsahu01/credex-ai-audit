import { describe, it, expect } from 'vitest'
import { runAudit } from '@/lib/audit/engine'
import { AuditFormData } from '@/lib/types'

describe('Audit Engine', () => {
  it('flags Cursor Business for a 2-person team as overkill', () => {
    const form: AuditFormData = {
      tools: [{ tool: 'cursor', plan: 'Business ($40/user/mo)', monthlySpend: 80, seats: 2 }],
      teamSize: 2,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.recommendations[0].recommendedAction).toBe('downgrade')
    expect(result.recommendations[0].monthlySavings).toBe(40)
  })

  it('flags GitHub Copilot Enterprise for small team — recommend Business', () => {
    const form: AuditFormData = {
      tools: [{ tool: 'github-copilot', plan: 'Enterprise ($39/user/mo)', monthlySpend: 195, seats: 5 }],
      teamSize: 5,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.recommendations[0].recommendedAction).toBe('downgrade')
    expect(result.recommendations[0].monthlySavings).toBe(100)
  })

  it('flags Claude Team for 2 users — individual Pro is cheaper', () => {
    const form: AuditFormData = {
      tools: [{ tool: 'claude', plan: 'Team ($25/user/mo)', monthlySpend: 50, seats: 2 }],
      teamSize: 2,
      useCase: 'writing',
    }
    const result = runAudit(form)
    expect(result.recommendations[0].recommendedAction).toBe('downgrade')
    expect(result.recommendations[0].monthlySavings).toBe(10)
  })

  it('returns optimal for well-configured stack', () => {
    const form: AuditFormData = {
      tools: [
        { tool: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 20, seats: 1 },
        { tool: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 20, seats: 1 },
      ],
      teamSize: 1,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.totalMonthlySavings).toBe(0)
    expect(result.isOptimal).toBe(true)
  })

  it('marks isHighSavings true when savings exceed $500/mo', () => {
    const form: AuditFormData = {
      tools: [
        { tool: 'cursor', plan: 'Business ($40/user/mo)', monthlySpend: 600, seats: 15 },
        { tool: 'github-copilot', plan: 'Enterprise ($39/user/mo)', monthlySpend: 585, seats: 15 },
      ],
      teamSize: 10,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.isHighSavings).toBe(true)
  })

  it('recommends switching Windsurf Max to Pro — saves $180/mo', () => {
    const form: AuditFormData = {
      tools: [{ tool: 'windsurf', plan: 'Max ($200/mo)', monthlySpend: 200, seats: 1 }],
      teamSize: 1,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.recommendations[0].recommendedAction).toBe('downgrade')
    expect(result.recommendations[0].monthlySavings).toBe(180)
  })

  it('suggests switching ChatGPT to Cursor for coding use case', () => {
    const form: AuditFormData = {
      tools: [{ tool: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 20, seats: 1 }],
      teamSize: 1,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.recommendations[0].recommendedAction).toBe('switch')
    expect(result.recommendations[0].recommendedTool).toBe('cursor')
  })

  // NEW: Compliance gating test
  it('does not recommend downgrade when ZDR is required', () => {
    const form: AuditFormData = {
      tools: [{
        tool: 'cursor',
        plan: 'Business ($40/user/mo)',
        monthlySpend: 80,
        seats: 2,
        compliance: { requiresZDR: true, requiresSSO: false }
      }],
      teamSize: 2,
      useCase: 'coding',
    }
    const result = runAudit(form)
    expect(result.recommendations[0].recommendedAction).toBe('optimal')
    expect(result.recommendations[0].monthlySavings).toBe(0)
  })
})
