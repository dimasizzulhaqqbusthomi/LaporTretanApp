import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  TrendingUp,
  Shield,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import AdminCharts from './AdminCharts'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { count: total },
    { count: waiting },
    { count: inProgress },
    { count: completed },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting_verification'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
  ])

  const { data: allReports } = await supabase
    .from('reports')
    .select('category_name, kecamatan, status, created_at, urgency')
    .order('created_at', { ascending: false })

  const displayName = profile?.full_name || 'Diana Putri Utami'
  const firstName = displayName.split(' ')[0] || 'Admin'

  const stats = [
    {
      label: 'Total',
      value: total || 0,
      icon: ClipboardList,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50/50 border-indigo-100',
    },
    {
      label: 'Menunggu',
      value: waiting || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50/50 border-amber-100',
    },
    {
      label: 'Proses',
      value: inProgress || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50/50 border-blue-100',
    },
    {
      label: 'Selesai',
      value: completed || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/50 border-emerald-100',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 max-w-lg mx-auto w-full">
      
      {/* 🛡️ Premium Header (Sesuai Warga) */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white px-5 pt-12 pb-14 relative overflow-hidden rounded-b-[2rem] shadow-lg shadow-blue-900/10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-lg pointer-events-none" />
        
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0 pr-12">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-extrabold text-base shadow-inner uppercase flex-shrink-0">
              {firstName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-blue-200 text-[10px] font-bold tracking-wider uppercase">Selamat datang,</p>
              <h1 className="text-lg font-bold mt-0.5 tracking-tight leading-snug break-words">
                {displayName} <span className="inline-block animate-wiggle ml-1">👋</span>
              </h1>
            </div>
          </div>
          
          <Link
            href="/admin/notifications"
            className="relative w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95 md:hidden"
          >
            <Bell className="w-5 h-5 text-white/90" />
            {(waiting || 0) > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-blue-600 rounded-full text-[9px] flex items-center justify-center font-extrabold px-1 animate-pulse">
                {waiting}
              </span>
            )}
          </Link>
        </div>

        {/* Hero Card / CTA */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner">
          <p className="text-xs text-blue-100 mb-2 leading-relaxed">
            Kelola aspirasi & pengaduan warga Kabupaten Bangkalan secara efisien.
          </p>
          <Link
            href="/admin/reports?status=waiting_verification"
            className="flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-900/10 hover:bg-blue-50 active:scale-[0.98] transition-all text-sm"
          >
            <Shield className="w-4 h-4" />
            Buka Panel Verifikasi Laporan ({waiting || 0})
          </Link>
        </div>
      </div>

      {/* 📊 Stats Section (Sesuai Warga) */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${s.bg} border rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[72px] transition-all hover:scale-[1.02]`}
              >
                <div className="flex justify-center mb-1">
                  <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-800 leading-none">{s.value}</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider leading-none">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Statistik Chart Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight">Statistik Pengaduan Masuk</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
            Distribusi Laporan Berdasarkan Kategori
          </p>
          <AdminCharts reports={allReports || []} />
        </div>
      </div>

    </div>
  )
}
