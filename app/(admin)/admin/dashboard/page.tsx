import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  TrendingUp,
  Shield,
  FileText,
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

  return (
    <div className="max-w-md md:max-w-2xl mx-auto space-y-5 px-1 pb-10">
      
      {/* 🛡️ Admin Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg shadow-blue-150/50 flex items-center gap-4 relative overflow-hidden border border-blue-500/20">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-md border border-white/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-extrabold text-sm md:text-base leading-tight tracking-tight truncate">
            {displayName}
          </h2>
          <p className="text-white/80 text-[10px] md:text-xs font-semibold mt-0.5">
            Administrator · Kab. Bangkalan
          </p>
        </div>
      </div>

      {/* 📊 Ringkasan Pengaduan Grid (Sesuai Screenshot User) */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800 tracking-tight">
          Ringkasan Pengaduan
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Pengaduan */}
          <div className="bg-indigo-600 text-white rounded-3xl p-4 flex flex-col justify-between aspect-[1.2] shadow-md shadow-indigo-100">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">{total || 0}</p>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5">Total Pengaduan</p>
            </div>
          </div>

          {/* Card 2: Menunggu Verifikasi */}
          <div className="bg-amber-50/70 border border-amber-100/60 rounded-3xl p-4 flex flex-col justify-between aspect-[1.2]">
            <div className="w-8 h-8 bg-amber-100/50 rounded-xl flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-600 tracking-tight">{waiting || 0}</p>
              <p className="text-[10px] text-amber-800/80 font-bold uppercase tracking-wider mt-0.5">Menunggu Verifikasi</p>
            </div>
          </div>

          {/* Card 3: Sedang Ditangani */}
          <div className="bg-blue-50/70 border border-blue-100/60 rounded-3xl p-4 flex flex-col justify-between aspect-[1.2]">
            <div className="w-8 h-8 bg-blue-100/50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-blue-600 tracking-tight">{inProgress || 0}</p>
              <p className="text-[10px] text-blue-800/80 font-bold uppercase tracking-wider mt-0.5">Sedang Ditangani</p>
            </div>
          </div>

          {/* Card 4: Selesai */}
          <div className="bg-emerald-50/70 border border-emerald-100/60 rounded-3xl p-4 flex flex-col justify-between aspect-[1.2]">
            <div className="w-8 h-8 bg-emerald-100/50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-600 tracking-tight">{completed || 0}</p>
              <p className="text-[10px] text-emerald-800/80 font-bold uppercase tracking-wider mt-0.5">Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🛡️ Primary Action Button (Sesuai Screenshot User) */}
      <Link
        href="/admin/reports?status=waiting_verification"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl text-center shadow-lg shadow-blue-150/40 hover:shadow-indigo-200/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        <Shield className="w-4 h-4 text-white" />
        Buka Panel Verifikasi Laporan ({waiting || 0})
      </Link>

      {/* 📊 Statistik Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-black text-slate-800 tracking-tight">
          Statistik Pengaduan Masuk
        </h3>
        
        {/* Charts Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
            Distribusi Laporan Berdasarkan Kategori
          </p>
          <AdminCharts reports={allReports || []} />
        </div>
      </div>

    </div>
  )
}
