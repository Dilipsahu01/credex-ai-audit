'use client'

import { useEffect, useState } from 'react'
import { AuditFormData, AuditResult, ToolRecommendation, TOOL_LABELS } from '@/lib/types'
import { runAudit } from '@/lib/audit/engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const STORAGE_KEY = 'credex-audit-form'
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  downgrade:        { label: 'Downgrade plan',  color: 'bg-amber-100 text-amber-800' },
  switch:           { label: 'Switch tool',     color: 'bg-blue-100 text-blue-800' },
  optimal:          { label: '✓ Optimal',        color: 'bg-green-100 text-green-800' },
  'upgrade-warning':{ label: 'Review usage',    color: 'bg-red-100 text-red-800' },
}

export default function ResultsPage() {
  const [result, setResult] = useState<AuditResult | null>(null)
  const [formData, setFormData] = useState<AuditFormData | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) { window.location.href = '/'; return }
    const parsed: AuditFormData = JSON.parse(saved)
    setFormData(parsed)
    setResult(runAudit(parsed))
  }, [])

  if (!result || !formData) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Running your audit...</div>
  }

  const totalCurrentSpend = formData.tools.reduce((s, t) => s + t.monthlySpend, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">

      {/* Hero */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Your AI Spend Audit</p>
        {result.totalMonthlySavings > 0 ? (
          <>
            <h1 className="text-4xl font-semibold">
              ${result.totalMonthlySavings.toFixed(0)}
              <span className="text-muted-foreground text-2xl font-normal">/mo potential savings</span>
            </h1>
            <p className="text-muted-foreground">
              That's <span className="text-foreground font-medium">${result.totalAnnualSavings.toFixed(0)}/year</span> back in your budget
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold">Your stack looks optimal 👍</h1>
            <p className="text-muted-foreground">You're spending well. No significant savings found.</p>
          </>
        )}
      </div>

      {/* Summary bar */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current monthly spend</span>
            <span className="font-medium">${totalCurrentSpend.toFixed(0)}/mo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">After recommendations</span>
            <span className="font-medium text-green-700">${(totalCurrentSpend - result.totalMonthlySavings).toFixed(0)}/mo</span>
          </div>
          {totalCurrentSpend > 0 && (
            <Progress
              value={(result.totalMonthlySavings / totalCurrentSpend) * 100}
              className="h-2"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {((result.totalMonthlySavings / Math.max(totalCurrentSpend, 1)) * 100).toFixed(0)}% reduction possible
          </p>
        </CardContent>
      </Card>

      {/* Per-tool recommendations */}
      <div className="space-y-3">
        <h2 className="text-base font-medium">Breakdown by tool</h2>
        {result.recommendations.map((rec) => (
          <ToolCard key={rec.tool} rec={rec} />
        ))}
      </div>

      {/* CTA */}
      {result.isHighSavings ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 space-y-3">
            <p className="font-medium text-blue-900">You could save over $500/month</p>
            <p className="text-sm text-blue-800">
              Credex negotiates discounted AI credits directly with providers. Teams at your spend level typically save 20–40% more on top of these plan optimizations.
            </p>
            <Button className="w-full">Talk to Credex about deeper savings</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="font-medium">Want to be notified of better deals?</p>
            <p className="text-sm text-muted-foreground">
              AI tool pricing changes constantly. We'll alert you when a better option appears for your stack.
            </p>
            <Button variant="outline" className="w-full">Notify me of changes</Button>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <button
          onClick={() => window.location.href = '/'}
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Run a new audit
        </button>
      </div>
    </div>
  )
}

function ToolCard({ rec }: { rec: ToolRecommendation }) {
  const action = ACTION_LABELS[rec.recommendedAction]
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{TOOL_LABELS[rec.tool]}</CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${action.color}`}>
            {action.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current: {rec.currentPlan}</span>
          {rec.monthlySavings > 0 && (
            <span className="text-green-700 font-medium">Save ${rec.monthlySavings.toFixed(0)}/mo</span>
          )}
        </div>
        {rec.recommendedPlan && (
          <div className="text-sm">
            <span className="text-muted-foreground">Recommended: </span>
            <span className="font-medium">{rec.recommendedPlan}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
      </CardContent>
    </Card>
  )
}
