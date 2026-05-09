'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AuditFormData,
  ToolInput,
  ToolName,
  UseCase,
  TOOL_PLANS,
  TOOL_LABELS,
} from '@/lib/types'

const ALL_TOOLS: ToolName[] = [
  'cursor', 'github-copilot', 'claude', 'anthropic-api',
  'chatgpt', 'openai-api', 'gemini', 'windsurf',
]

const STORAGE_KEY = 'credex-audit-form'

const defaultFormData: AuditFormData = {
  tools: [],
  teamSize: 1,
  useCase: 'mixed',
}

export default function SpendForm({
  onSubmit,
}: {
  onSubmit: (data: AuditFormData) => void
}) {
  const [formData, setFormData] = useState<AuditFormData>(defaultFormData)
  const [selectedTools, setSelectedTools] = useState<ToolName[]>([])

  // Load persisted form state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuditFormData
        setFormData(parsed)
        setSelectedTools(parsed.tools.map((t) => t.tool))
      } catch {}
    }
  }, [])

  // Persist form state on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }, [formData])

  const toggleTool = (tool: ToolName) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools((prev) => prev.filter((t) => t !== tool))
      setFormData((prev) => ({
        ...prev,
        tools: prev.tools.filter((t) => t.tool !== tool),
      }))
    } else {
      setSelectedTools((prev) => [...prev, tool])
      setFormData((prev) => ({
        ...prev,
        tools: [
          ...prev.tools,
          { tool, plan: TOOL_PLANS[tool][0], monthlySpend: 0, seats: 1 },
        ],
      }))
    }
  }

  // UPDATED: Allow 'any' for the value to handle compliance objects
  const updateTool = (tool: ToolName, field: keyof ToolInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.map((t) =>
        t.tool === tool ? { ...t, [field]: value } : t
      ),
    }))
  }

  const handleSubmit = () => {
    if (formData.tools.length === 0) return
    onSubmit(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">AI Spend Audit</h1>
        <p className="text-muted-foreground text-sm">
          Select the AI tools you pay for and we'll find where you're overspending.
        </p>
      </div>

      {/* Tool selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Which tools do you pay for?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ALL_TOOLS.map((tool) => (
            <Badge
              key={tool}
              variant={selectedTools.includes(tool) ? 'default' : 'outline'}
              className="cursor-pointer text-sm py-1 px-3"
              onClick={() => toggleTool(tool)}
            >
              {TOOL_LABELS[tool]}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Per-tool inputs */}
      {formData.tools.map((toolInput) => (
        <Card key={toolInput.tool}>
          <CardHeader>
            <CardTitle className="text-base">{TOOL_LABELS[toolInput.tool]}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Plan</label>
              <Select
                value={toolInput.plan}
                onValueChange={(val) => updateTool(toolInput.tool, 'plan', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_PLANS[toolInput.tool].map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Monthly spend ($)</label>
              <Input
                type="number"
                min={0}
                value={toolInput.monthlySpend}
                onChange={(e) =>
                  updateTool(toolInput.tool, 'monthlySpend', parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Seats / users</label>
              <Input
                type="number"
                min={1}
                value={toolInput.seats}
                onChange={(e) =>
                  updateTool(toolInput.tool, 'seats', parseInt(e.target.value) || 1)
                }
              />
            </div>

            {/* NEW: Compliance requirements checkboxes */}
            <div className="space-y-2 col-span-full pt-2">
              <label className="text-sm text-muted-foreground">
                Compliance requirements (optional)
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toolInput.compliance?.requiresZDR ?? false}
                    onChange={(e) =>
                      updateTool(toolInput.tool, 'compliance', {
                        ...toolInput.compliance,
                        requiresZDR: e.target.checked,
                        requiresSSO: toolInput.compliance?.requiresSSO ?? false,
                      })
                    }
                  />
                  Zero Data Retention (ZDR)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toolInput.compliance?.requiresSSO ?? false}
                    onChange={(e) =>
                      updateTool(toolInput.tool, 'compliance', {
                        ...toolInput.compliance,
                        requiresZDR: toolInput.compliance?.requiresZDR ?? false,
                        requiresSSO: e.target.checked,
                      })
                    }
                  />
                  SSO / SAML required
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Team info */}
      {selectedTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About your team</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Total team size</label>
              <Input
                type="number"
                min={1}
                value={formData.teamSize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    teamSize: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Primary use case</label>
              <Select
                value={formData.useCase}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, useCase: val as UseCase }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="data">Data analysis</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={formData.tools.length === 0}
        onClick={handleSubmit}
      >
        Run my audit →
      </Button>
    </div>
  )
}
