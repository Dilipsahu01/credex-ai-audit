'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuditFormData, AuditResult } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  formData: AuditFormData
  result: AuditResult
  isHighSavings: boolean
}

export default function LeadCaptureModal({
  open, onClose, formData, result, isHighSavings
}: Props) {
  const [email, setEmail] = useState('')
  const [companyEmail, setCompanyEmail] = useState('') // New CC state
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/save-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Added companyEmail to the body
        body: JSON.stringify({ formData, result, email, companyEmail, companyName, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      window.location.href = `/audit/${data.auditId}`

    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isHighSavings ? 'Get your full savings report' : 'Get notified of better deals'}
          </DialogTitle>
          <DialogDescription>
            {isHighSavings
              ? `We'll email your audit and have a Credex advisor reach out about additional savings.`
              : "We'll alert you when better pricing appears for your stack."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Your Email *</label>
            <Input
              type="email"
              placeholder="you@direct.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Company Email (for CC)
              <span className="text-muted-foreground font-normal"> (optional)</span>
            </label>
            <Input
              type="email"
              placeholder="billing@company.com"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Company name
              <span className="text-muted-foreground font-normal"> (optional)</span>
            </label>
            <Input
              placeholder="Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Your role (optional)</label>
            <Input
              placeholder="CTO, Manager..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !email}
          >
            {loading ? 'Saving...' : isHighSavings ? 'Send my report →' : 'Notify me →'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
