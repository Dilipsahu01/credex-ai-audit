'use client'

import SpendForm from '@/components/audit/SpendForm'
import { AuditFormData } from '@/lib/types'

export default function Home() {
  const handleSubmit = (data: AuditFormData) => {
    // Form already persisted to localStorage in SpendForm
    window.location.href = '/results'
  }

  return (
    <main className="min-h-screen py-12">
      <SpendForm onSubmit={handleSubmit} />
    </main>
  )
}
