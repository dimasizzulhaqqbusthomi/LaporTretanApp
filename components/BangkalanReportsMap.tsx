'use client'

import dynamic from 'next/dynamic'
import { Report } from '@/lib/types'

const MapInner = dynamic(() => import('./BangkalanReportsMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center border border-slate-200">
      <p className="text-xs font-bold text-slate-400">Memuat peta interaktif Bangkalan...</p>
    </div>
  ),
})

interface BangkalanReportsMapProps {
  reports: Report[]
}

export default function BangkalanReportsMap({ reports }: BangkalanReportsMapProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapInner reports={reports} />
    </div>
  )
}
