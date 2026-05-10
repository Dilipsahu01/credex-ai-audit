'use client'

import { useEffect, useState } from 'react'
import { runAudit } from '@/lib/audit/engine'
import { AuditFormData, AuditResult, ToolRecommendation, TOOL_LABELS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle } from 'lucide-react'

const STORAGE_KEY = 'credex-audit-form'

const ACTION_COLORS: Record<string, string> = {
  downgrade: 'bg-amber-100 text-amber-800 border-amber-200',
  switch: 'bg-blue-100 text-blue-800 border-blue-200',
  optimal: 'bg-green-100 text-green-800 border-green-200',
  'upgrade-warning': 'bg-red-100 text-red-800 border-red-200',
}

const ACTION_LABELS: Record<string, string> = {
  downgrade: 'Downgrade plan',
  switch: 'Switch tool',
  optimal: '✓ Optimal',
  'upgrade-warning': 'Review usage',
}

export default function ResultsPage() {
  const [result, setResult] = useState<AuditResult | null>(null)
  const [formData, setFormData] = useState<AuditFormData | null>(null)
  
  // Add summary state
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      window.location.href = '/'
      return
    }
    try {
      const parsed: AuditFormData = JSON.parse(saved)
      setFormData(parsed)
      const auditResult = runAudit(parsed)
      setResult(auditResult)

      // Fetch AI summary after audit result is ready
      setSummaryLoading(true)
      fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: auditResult, formData: parsed }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.summary) {
            setSummary(data.summary)
          } else {
            // Use fallback if API returns no summary
            setSummary(getFallbackSummary(auditResult, parsed))
          }
        })
        .catch(() => {
          // Use fallback if API call fails entirely
          setSummary(getFallbackSummary(auditResult, parsed))
        })
        .finally(() => setSummaryLoading(false))
    } catch (e) {
      window.location.href = '/'
    }
  }, [])

  if (!result || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Running your audit...
      </div>
    )
  }

  const totalCurrentSpend = formData.tools.reduce((s, t) => s + t.monthlySpend, 0)
  const reductionPercentage = totalCurrentSpend > 0 
    ? (result.totalMonthlySavings / totalCurrentSpend) * 100 
    : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      
      {/* Section 1 — Hero */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
          Based on {formData.tools.length} tools audited
        </p>
        {result.isOptimal ? (
          <>
            <h1 className="text-3xl font-semibold">Your stack looks optimal 👍</h1>
            <p className="text-muted-foreground">You're spending well. No significant savings found.</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-semibold">
              ${result.totalMonthlySavings.toFixed(0)}
              <span className="text-muted-foreground text-2xl font-normal">/mo potential savings</span>
            </h1>
            <p className="text-muted-foreground">
              That's <span className="text-foreground font-medium">${result.totalAnnualSavings.toFixed(0)}/year</span> back in your budget
            </p>
          </>
        )}
      </div>

      {/* AI Summary section */}
      {(summaryLoading || summary) && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-3 w-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                Generating your personalized summary...
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  AI Summary
                </p>
                <p className="text-sm leading-relaxed">{summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 2 — Summary Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current monthly spend</span>
            <span className="font-medium">${totalCurrentSpend.toFixed(0)}/mo</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">After recommendations</span>
            <span className="font-medium text-green-700">
              ${(totalCurrentSpend - result.totalMonthlySavings).toFixed(0)}/mo
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress value={reductionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground font-medium">
              {reductionPercentage.toFixed(0)}% reduction possible
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Per Tool Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-medium">Breakdown by tool</h2>
        {result.recommendations.map((rec, idx) => (
          <ToolRecommendationCard key={`${rec.tool}-${idx}`} rec={rec} />
        ))}
      </div>

      {/* Section 4 — CTA Block */}
      {result.isHighSavings ? (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="pt-6 space-y-3">
            <p className="font-semibold text-blue-900">You could save over $500/month</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Credex negotiates discounted AI credits directly with providers. Teams at your spend level typically save 20–40% more on top of these plan optimizations.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Talk to Credex about deeper savings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="font-medium">Want to be notified of better deals?</p>
            <p className="text-sm text-muted-foreground">
              AI tool pricing changes constantly. We'll alert you when a better option appears for your stack.
            </p>
            <Button variant="outline" className="w-full">Notify me of changes</Button>
          </CardContent>
        </Card>
      )}

      {/* Section 5 — Footer link */}
      <div className="text-center pt-4">
        <button
          onClick={() => window.location.href = '/'}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          ← Run a new audit
        </button>
      </div>
    </div>
  )
}

function ToolRecommendationCard({ rec }: { rec: ToolRecommendation }) {
  return (
    <Card className="overflow-hidden">
      {/* Compliance Warning Strip */}
      {rec.complianceRisk === 'review-needed' && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="size-3.5 text-amber-600" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
            Review compliance requirements before switching
          </span>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{TOOL_LABELS[rec.tool]}</CardTitle>
          <Badge 
            variant="outline" 
            className={`text-[10px] px-2 py-0 h-5 border shadow-none ${ACTION_COLORS[rec.recommendedAction]}`}
          >
            {ACTION_LABELS[rec.recommendedAction]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-muted-foreground">Current: {rec.currentPlan}</span>
          {rec.monthlySavings > 0 && (
            <span className="text-green-700 font-semibold text-xs">
              Save ${rec.monthlySavings.toFixed(0)}/mo
            </span>
          )}
        </div>

        {rec.recommendedAction !== 'optimal' && (
          <div className="text-sm">
            <span className="text-muted-foreground">Recommended: </span>
            <span className="font-medium">
              {rec.recommendedTool ? TOOL_LABELS[rec.recommendedTool] : ''} {rec.recommendedPlan}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">
          {rec.reason}
          {rec.complianceNote && (
            <span className="block mt-1 font-medium text-amber-700 italic">
              Note: {rec.complianceNote}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function getFallbackSummary(result: AuditResult, formData: AuditFormData): string {
  if (result.totalMonthlySavings === 0) {
    return `Your ${formData.teamSize}-person team is already spending efficiently on AI tools. No significant optimizations were found for your ${formData.useCase} use case.`
  }
  const topSaving = result.recommendations
    .filter(r => r.monthlySavings > 0)
    .sort((a, b) => b.monthlySavings - a.monthlySavings)[0]
  return `Your team could save $${result.totalMonthlySavings.toFixed(0)}/month ($${result.totalAnnualSavings.toFixed(0)}/year) by optimizing your AI tool spend. The biggest opportunity is ${TOOL_LABELS[topSaving.tool]}, where switching plans could save $${topSaving.monthlySavings.toFixed(0)}/month.`
}
