'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, ClipboardList, ChevronDown } from 'lucide-react'
import ReportCard from '@/components/ReportCard'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/types'
import { CATEGORY_LIST, STATUS_LIST } from '@/lib/utils'

export default function ReportHistoryPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    loadReports()
  }, [statusFilter, categoryFilter])

  async function loadReports() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    let query = supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)
    if (categoryFilter) query = query.eq('category_name', categoryFilter)

    const { data } = await query
    setReports(data || [])
    setLoading(false)
  }

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-4 pt-12 pb-4 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="font-bold text-slate-800 text-base">Riwayat Laporan</h1>
            <p className="text-xs text-slate-400">Semua laporan yang Anda buat</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari laporan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 border border-transparent focus:border-blue-300"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <div className="relative flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium focus:outline-none"
            >
              <option value="">Semua Status</option>
              {STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium">
              {filtered.length} laporan ditemukan
            </p>
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                href={`/reports/${report.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ClipboardList className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-600 mb-1">
              Belum Ada Laporan
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {search || statusFilter || categoryFilter
                ? 'Tidak ada laporan yang sesuai filter'
                : 'Anda belum membuat laporan apapun'}
            </p>
            <Link
              href="/reports/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl text-sm"
            >
              Buat Laporan Pertama
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
