import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { AuditFormData, AuditResult, TOOL_LABELS } from '@/lib/types'
import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

const ipLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
});

const globalLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
});

const GMAIL_USER = 'dilipsahuop@gmail.com'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  if (process.env.KV_REST_API_URL) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success: ipSuccess } = await ipLimit.limit(`ip_${ip}`);
    const { success: globalSuccess } = await globalLimit.limit("global_email_limit");
    if (!ipSuccess || !globalSuccess) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  try {
    const {
      formData,
      result,
      email,
      companyName,
      role,
    }: {
      formData: AuditFormData
      result: AuditResult
      email: string
      companyName?: string
      role?: string
    } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email is not configured on the server (missing EMAIL_APP_PASSWORD).' },
        { status: 503 }
      )
    }

    const auditId = nanoid()

    // Save to Supabase (Audit Record)
    const { error: auditError } = await supabaseAdmin
      .from('audits')
      .insert({
        id: auditId,
        tools_json: formData.tools,
        results_json: result,
        total_monthly_savings: result.totalMonthlySavings,
        total_annual_savings: result.totalAnnualSavings,
        team_size: formData.teamSize,
        use_case: formData.useCase,
        is_public: true,
      })

    if (auditError) return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })

    // Save Lead info
    await supabaseAdmin.from('leads').insert({
      email,
      company_name: companyName || null,
      role: role || null,
      team_size: formData.teamSize,
      audit_id: auditId,
    })

    const savingsLines = result.recommendations
      .filter(r => r.monthlySavings > 0)
      .map(
        (r) =>
          `• ${TOOL_LABELS[r.tool]}: Save $${r.monthlySavings.toFixed(0)}/mo — ${r.recommendedPlan ?? 'see recommendations'}`
      )
      .join('\n')

    const auditUrl = `${process.env.NEXT_PUBLIC_APP_URL}/audit/${auditId}`

    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
      subject: `Your AI spend audit — ~$${result.totalMonthlySavings.toFixed(0)}/mo in savings`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2>AI Spend Audit Results</h2>
          <p><strong>Submitted by:</strong> ${email}</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <p>Total monthly savings: <strong>$${result.totalMonthlySavings.toFixed(0)}/mo</strong></p>
          </div>

          <h3 style="margin-top: 20px;">Top Opportunities</h3>
          <pre>${savingsLines || 'Stack is optimal.'}</pre>

          <a href="${auditUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
            View Full Audit →
          </a>
        </div>
      `,
    })

    return NextResponse.json({ auditId, auditUrl })

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
