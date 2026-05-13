'use client'

import SpendForm from '@/components/audit/SpendForm'
import { AuditFormData } from '@/lib/types'

export default function Home() {
  const handleSubmit = (formData: AuditFormData) => {
    void formData
    // Form already persisted to localStorage in SpendForm
    window.location.href = '/results'
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background py-12 sm:py-16">
      <header className="max-w-2xl mx-auto px-4 text-center mb-10 sm:mb-12 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Credex · AI Spend Audit
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
          Find out if you&apos;re overpaying for AI tools
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto text-pretty leading-relaxed">
          Free 2-minute audit for SaaS teams. Map seats and plans across Cursor, Copilot, Claude,
          ChatGPT, and more—then see where budget is leaking.
        </p>
      </header>
      <SpendForm onSubmit={handleSubmit} />
    </main>
  )
}
