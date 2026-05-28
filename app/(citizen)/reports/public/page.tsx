'use client'

import { useState, useEffect } from 'react'
import { Search, Map, ChevronDown, Filter } from 'lucide-react'
import ReportCard from '@/components/ReportCard'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/types'
import { CATEGORY_LIST, KECAMATAN_LIST, STATUS_LIST } from '@/lib/utils'

export default function PublicReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [status, setStatus] = useState('')
  const [urgency, setUrgency] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadReports()
  }, [category, kecamatan, status, urgency])

  async function loadReports() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('reports')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (category) query = query.eq('category_name', category)
    if (kecamatan) query = query.eq('kecamatan', kecamatan)
    if (status) query = query.eq('status', status)
    if (urgency) query = query.eq('urgency', urgency)

    const { data } = await query
    setReports(data || [])
    setLoading(false)
  }

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.kecamatan || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeFilters = [category, kecamatan, status, urgency].filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-4 pt-12 pb-4 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bold text-slate-800 text-base">Laporan Publik</h1>
            <p className="text-xs text-slate-400">Semua laporan warga Bangkalan</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1.5">
            <Map className="w-3 h-3" />
            Bangkalan
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari laporan, kategori, atau kecamatan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 border border-transparent focus:border-blue-300"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            activeFilters > 0
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Filter className="w-3 h-3" />
          Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {showFilters && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs focus:outline-none"
            >
              <option value="">Semua Kecamatan</option>
              {KECAMATAN_LIST.map((k) => (
                <option key={k} value={k}>Kec. {k}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs focus:outline-none"
            >
              <option value="">Semua Status</option>
              {STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs focus:outline-none"
            >
              <option value="">Semua Urgensi</option>
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="emergency">Darurat</option>
            </select>

            {activeFilters > 0 && (
              <button
                onClick={() => { setCategory(''); setKecamatan(''); setStatus(''); setUrgency('') }}
                className="col-span-2 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map Placeholder */}
      <div className="mx-4 mt-4 bg-blue-50 rounded-2xl border border-blue-100 p-4 text-center">
        <Map className="w-6 h-6 text-blue-400 mx-auto mb-1" />
        <p className="text-xs text-blue-600 font-medium">Peta Laporan Bangkalan</p>
        <p className="text-xs text-blue-400">Integrasi peta interaktif akan tersedia</p>
      </div>

      {/* Reports Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-xs text-slate-400 font-medium mb-3">
              {filtered.length} laporan ditemukan
            </p>
            <div className="space-y-3">
              {filtered.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  href={`/reports/${report.id}`}
                  showReporter={false}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">Tidak ada laporan yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
