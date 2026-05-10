import { supabaseAdmin } from '@/lib/supabase'
import { AuditResult, AuditFormData, TOOL_LABELS } from '@/lib/types'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params

  const { data } = await supabaseAdmin
    .from('audits')
    .select('total_monthly_savings, total_annual_savings')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Audit Not Found' }

  return {
    title: `AI Spend Audit — $${data.total_monthly_savings.toFixed(0)}/mo savings identified`,
    description: `This team could save $${data.total_annual_savings.toFixed(0)}/year by optimizing their AI tool stack.`,
    openGraph: {
      title: `I could save $${data.total_monthly_savings.toFixed(0)}/month on AI tools`,
      description: `$${data.total_annual_savings.toFixed(0)}/year identified via Credex AI Spend Audit`,
    },
    twitter: {
      card: 'summary',
      title: `I could save $${data.total_monthly_savings.toFixed(0)}/month on AI tools`,
      description: `$${data.total_annual_savings.toFixed(0)}/year identified via Credex AI Spend Audit`,
    },
  }
}

export default async function AuditPage({ params }: Props) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!data || error) notFound()

  const result = data.results_json as AuditResult
  const tools = data.tools_json as AuditFormData['tools']

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          AI Spend Audit · Powered by Credex
        </p>
        {result.totalMonthlySavings > 0 ? (
          <>
            <h1 className="text-4xl font-semibold">
              ${result.totalMonthlySavings.toFixed(0)}
              <span className="text-muted-foreground text-2xl font-normal">/mo savings identified</span>
            </h1>
            <p className="text-muted-foreground">
              ${result.totalAnnualSavings.toFixed(0)}/year across {tools.length} tools
            </p>
          </>
        ) : (
          <h1 className="text-3xl font-semibold">This stack is already optimal</h1>
        )}
      </div>

      <div className="space-y-3">
        {result.recommendations.map((rec, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">{TOOL_LABELS[rec.tool]}</span>
              {rec.monthlySavings > 0 && (
                <span className="text-green-700 text-sm font-medium">
                  Save ${rec.monthlySavings.toFixed(0)}/mo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{rec.reason}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-6 text-center space-y-3">
        <p className="font-medium">Audit your own AI stack</p>
        <p className="text-sm text-muted-foreground">
          Find out how much your team is overspending on AI tools. Free, takes 2 minutes.
        </p>
        <a href="/" className="inline-block bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium">
          Run my free audit
        </a>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Audit ID: {id}
      </p>
    </div>
  )
}
