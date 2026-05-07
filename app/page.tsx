'use client'

import SpendForm from '@/components/audit/SpendForm'
import { AuditFormData } from '@/lib/types'

export default function Home() {
  const handleSubmit = (data: AuditFormData) => {
    console.log('Audit data:', data)
    // Tomorrow: pass to audit engine
  }

  return (
    <main className="min-h-screen py-12">
      <SpendForm onSubmit={handleSubmit} />
    </main>
  )
}
