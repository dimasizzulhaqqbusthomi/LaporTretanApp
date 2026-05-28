'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, ClipboardList, MapPin, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/types'
import { StatusBadge, UrgencyBadge } from '@/components/Badges'
import { formatDate, CATEGORY_LIST, STATUS_LIST, KECAMATAN_LIST } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function AdminReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [kecamatanFilter, setKecamatanFilter] = useState('')

  useEffect(() => {
    checkAuth()
    loadReports()
  }, [statusFilter, categoryFilter, kecamatanFilter])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') router.push('/dashboard')
  }

  async function loadReports() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter) query = query.eq('status', statusFilter)
    if (categoryFilter) query = query.eq('category_name', categoryFilter)
    if (kecamatanFilter) query = query.eq('kecamatan', kecamatanFilter)

    const { data } = await query
    setReports(data || [])
    setLoading(false)
  }

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.category_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto space-y-4 px-1">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Daftar Laporan Warga</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Kelola & saring semua pengaduan infrastruktur Bangkalan
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari laporan atau pelapor..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-300"
            >
              <option value="">Semua Status</option>
              {STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-300"
            >
              <option value="">Semua Kategori</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={kecamatanFilter}
              onChange={(e) => setKecamatanFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-300"
            >
              <option value="">Semua Kecamatan</option>
              {KECAMATAN_LIST.map((k) => (
                <option key={k} value={k}>Kec. {k}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reports Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          {loading ? 'Memuat Laporan...' : `${filtered.length} Laporan Ditemukan`}
        </p>
      </div>

      {/* Report Cards (Mobile Feed View) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse border border-slate-50" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/admin/reports/${r.id}`}
              className="block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow hover:border-slate-200 transition-all p-4 space-y-3 relative group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                    {r.reporter_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{r.reporter_name}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{formatDate(r.created_at)}</span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                  {r.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {r.category_name}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Kecamatan {r.kecamatan || '-'}</span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={r.status} />
                  <UrgencyBadge urgency={r.urgency} />
                </div>
                <div className="flex items-center gap-0.5 text-xs text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>Detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 px-4">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tidak ada laporan ditemukan</p>
        </div>
      )}
    </div>
  )
}
