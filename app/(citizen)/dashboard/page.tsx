import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Plus,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Construction,
  Lightbulb,
  Trash2,
  Droplets,
  Building,
  TrafficCone,
  Trees,
  Layers,
  MapPin,
  Calendar,
} from 'lucide-react'
import ReportCard from '@/components/ReportCard'
import { Report } from '@/lib/types'

const categoryItems = [
  { name: 'Jalan Rusak', icon: Construction, color: 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100/50' },
  { name: 'Lampu Jalan', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-100 hover:bg-yellow-100/50' },
  { name: 'Sampah', icon: Trash2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50' },
  { name: 'Drainase', icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/50' },
  { name: 'Banjir', icon: Droplets, color: 'text-cyan-600 bg-cyan-50 border-cyan-100 hover:bg-cyan-100/50' },
  { name: 'Fasilitas', icon: Building, color: 'text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100/50' },
  { name: 'Rambu', icon: TrafficCone, color: 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100/50' },
  { name: 'Pohon', icon: Trees, color: 'text-teal-600 bg-teal-50 border-teal-100 hover:bg-teal-100/50' },
]

export default async function DashboardPage() {
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

  // Stats
  const { count: totalReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id)

  const { count: waitingCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .eq('status', 'waiting_verification')

  const { count: inProgressCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .eq('status', 'in_progress')

  const { count: completedCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .eq('status', 'completed')

  // Recent public reports
  const { data: recentReports } = await supabase
    .from('reports')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(4)

  // Unread notifications count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const firstName = profile?.full_name?.split(' ')[0] || 'Warga'

  const stats = [
    {
      label: 'Total Laporan',
      value: totalReports || 0,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50/50 border-blue-100',
    },
    {
      label: 'Menunggu',
      value: waitingCount || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50/50 border-amber-100',
    },
    {
      label: 'Proses',
      value: inProgressCount || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50/50 border-orange-100',
    },
    {
      label: 'Selesai',
      value: completedCount || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/50 border-emerald-100',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white px-5 pt-12 pb-14 relative overflow-hidden rounded-b-[2rem] shadow-lg shadow-blue-900/10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-base shadow-inner">
              {firstName[0]}
            </div>
            <div>
              <p className="text-blue-200 text-[11px] font-medium tracking-wide uppercase">Selamat datang,</p>
              <h1 className="text-lg font-bold mt-0.5 tracking-tight flex items-center gap-1.5">
                {firstName} <span className="animate-wiggle"></span>
              </h1>
            </div>
          </div>

          <Link
            href="/notifications"
            className="relative w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95"
          >
            <Bell className="w-5 h-5 text-white/90" />
            {(unreadCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-blue-600 rounded-full text-[9px] flex items-center justify-center font-extrabold px-1 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Hero Card / CTA */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner">
          <p className="text-xs text-blue-100 mb-2 leading-relaxed">
            Laporkan kendala fasilitas umum di sekitar Anda untuk Bangkalan yang lebih baik.
          </p>
          <Link
            href="/reports/create"
            className="flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-900/10 hover:bg-blue-50 active:scale-[0.98] transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Laporan Baru
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${s.bg} border rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[72px] transition-all hover:scale-[1.02]`}
              >
                <div className="flex justify-center mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 leading-none">{s.value}</p>
                  <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-wider leading-none">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight">Kategori Laporan</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {categoryItems.map((cat) => (
            <Link
              key={cat.name}
              href={`/reports/create?category=${encodeURIComponent(cat.name)}`}
              className={`${cat.color} border rounded-xl p-2.5 text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:shadow-sm hover:scale-[1.02] active:scale-95`}
            >
              <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                <cat.icon className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-bold text-slate-700 leading-tight">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="px-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight">Laporan Terbaru</h2>
          <Link
            href="/reports/public"
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {recentReports && recentReports.length > 0 ? (
          <div className="space-y-3">
            {recentReports.map((report: Report) => (
              <ReportCard
                key={report.id}
                report={report}
                href={`/reports/${report.id}`}
                showReporter={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-medium">Belum ada laporan publik</p>
          </div>
        )}
      </div>
    </div>
  )
}
