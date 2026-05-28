import { Suspense } from 'react'
import CreateReportForm from './CreateReportForm'

export default function CreateReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat form...</div>
      </div>
    }>
      <CreateReportForm />
    </Suspense>
  )
}
