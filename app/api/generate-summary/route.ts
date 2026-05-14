import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { AuditResult, AuditFormData, TOOL_LABELS } from '@/lib/types'
import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

const claudeLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
});

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  if (process.env.KV_REST_API_URL) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await claudeLimit.limit(`claude_${ip}`);
    if (!success) {
      return NextResponse.json({ summary: null, error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  try {
    const { result, formData }: { result: AuditResult; formData: AuditFormData } = await req.json()

    // Build a plain-English summary of the audit for the prompt
    const toolSummary = result.recommendations
      .map((r) => {
        if (r.recommendedAction === 'optimal') {
          return `${TOOL_LABELS[r.tool]}: already optimal`
        }
        if (r.recommendedAction === 'downgrade') {
          return `${TOOL_LABELS[r.tool]}: downgrade from ${r.currentPlan} to ${r.recommendedPlan}, saves $${r.monthlySavings}/mo`
        }
        if (r.recommendedAction === 'switch') {
          return `${TOOL_LABELS[r.tool]}: switch to ${r.recommendedPlan}, saves $${r.monthlySavings}/mo`
        }
        return `${TOOL_LABELS[r.tool]}: review needed`
      })
      .join('\n')

    const prompt = `You are a concise financial advisor for tech startups. A startup has just run an AI tool spend audit. Write a 2-3 sentence personalized summary of their results. Be specific with numbers. Be encouraging but honest. Do not use bullet points. Do not use markdown. Plain text only.

Audit results:
- Team size: ${formData.teamSize} people
- Primary use case: ${formData.useCase}
- Total monthly savings identified: $${result.totalMonthlySavings.toFixed(0)}/mo ($${result.totalAnnualSavings.toFixed(0)}/year)
- Tools audited:
${toolSummary}

Write the summary now:`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : null

    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Anthropic API error:', error)
    // Graceful fallback — never break the results page
    return NextResponse.json({
      summary: null,
      error: 'Summary unavailable'
    }, { status: 200 }) // intentional 200 — fallback, not a crash
  }
}

