import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { nanoid } from 'nanoid'
import { AuditFormData, AuditResult, TOOL_LABELS } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const {
      formData,
      result,
      email,
      companyEmail, // Capture from modal
      companyName,
      role,
    }: {
      formData: AuditFormData
      result: AuditResult
      email: string
      companyEmail?: string
      companyName?: string
      role?: string
    } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
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
      .map(r => `• ${TOOL_LABELS[r.tool]}: Save $${r.monthlySavings.toFixed(0)}/mo — ${r.recommendedPlan}`)
      .join('\n')

    const auditUrl = `${process.env.NEXT_PUBLIC_APP_URL}/audit/${auditId}`

    // SEND THE EMAIL
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      // WHILE TESTING: Always send to yourself. Resend blocks external emails in test mode.
      to: 'dilipsahuop@gmail.com', 
      // Put the CC and real target in the subject so you can see it's working
      subject: `[Audit For: ${email}] Savings identified: $${result.totalMonthlySavings.toFixed(0)}/mo`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2>AI Spend Audit Results</h2>
          <p><strong>User:</strong> ${email}</p>
          <p><strong>CC Requested To:</strong> ${companyEmail || 'None'}</p>

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

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
