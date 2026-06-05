import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Play,
  Bell,
} from 'lucide-react'
import { UrgencyBadge, StatusBadge } from '@/components/Badges'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function OfficerDashboard() {
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
  if (!['officer', 'admin'].includes(profile?.role || '')) redirect('/dashboard')

  const [
    { count: total },
    { count: inProgress },
    { count: completed },
    { count: assigned },
    { count: unreadCount },
  ] = await Promise.all([
    supabase
      .from('officer_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('officer_id', user.id),
    supabase
      .from('officer_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('officer_id', user.id)
      .eq('status', 'in_progress'),
    supabase
      .from('officer_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('officer_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('officer_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('officer_id', user.id)
      .eq('status', 'assigned'),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
  ])

  const { data: activeTasks } = await supabase
    .from('officer_tasks')
    .select('*, report:reports(*)')
    .eq('officer_id', user.id)
    .not('status', 'eq', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  const priorityCount = activeTasks?.filter((t) => t.report?.urgency === 'emergency').length || 0
  const displayName = profile?.full_name || 'Petugas'
  const firstName = displayName.split(' ')[0] || 'Petugas'

  const stats = [
    {
      label: 'Total',
      value: total || 0,
      icon: ClipboardList,
      color: 'text-green-600',
      bg: 'bg-green-50/50 border-green-100',
    },
    {
      label: 'Menunggu',
      value: assigned || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50/50 border-amber-100',
    },
    {
      label: 'Proses',
      value: inProgress || 0,
      icon: Play,
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

      {/* 👷 Premium Header (Sesuai Warga & Admin) */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white px-5 pt-12 pb-14 relative overflow-hidden rounded-b-[2rem] shadow-lg shadow-emerald-900/10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0 pr-12">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-extrabold text-base shadow-inner uppercase flex-shrink-0">
              {firstName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-green-200 text-[10px] font-bold tracking-wider uppercase">Selamat datang,</p>
              <h1 className="text-lg font-bold mt-0.5 tracking-tight leading-snug break-words">
                {displayName} <span className="inline-block animate-wiggle ml-1"></span>
              </h1>
            </div>
          </div>

          <Link
            href="/officer/notifications"
            className="relative w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95 md:hidden"
          >
            <Bell className="w-5 h-5 text-white/90" />
            {(unreadCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-green-600 rounded-full text-[9px] flex items-center justify-center font-extrabold px-1 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Hero Card / CTA */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner">
          <p className="text-xs text-green-100 mb-2 leading-relaxed">
            Kelola tugas lapangan dan selesaikan aduan warga Kabupaten Bangkalan secara responsif.
          </p>
          {(assigned || 0) > 0 ? (
            <Link
              href="/officer/tasks"
              className="flex items-center justify-center gap-2 bg-white text-green-700 font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-900/10 hover:bg-green-50 active:scale-[0.98] transition-all text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              Lihat Tugas Menunggu ({assigned})
            </Link>
          ) : (
            <div className="text-center py-2.5 text-xs text-green-100 font-semibold border border-white/10 bg-white/5 rounded-xl">
              ✓ Semua tugas baru telah ditangani
            </div>
          )}
        </div>
      </div>

      {/* 📊 Stats Section (Sesuai Warga & Admin) */}
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

      {/* 📋 Tugas Aktif Section */}
      <div className="px-4 mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">Tugas Aktif</h3>
          <Link href="/officer/tasks" className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors">
            Lihat Semua
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {activeTasks && activeTasks.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {activeTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/officer/tasks/${task.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate leading-snug">
                      {task.report?.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {task.report?.category_name} · Kec. {task.report?.kecamatan} · {formatDate(task.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {task.report?.urgency && <UrgencyBadge urgency={task.report.urgency} />}
                    <StatusBadge status={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Semua Tugas Selesai!</p>
              <p className="text-xs text-slate-400 mt-1">Tidak ada tugas aktif saat ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ Prioritas Darurat */}
      {priorityCount > 0 && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">
              {priorityCount} Tugas Darurat Menunggu!
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Segera tangani laporan dengan status emergency.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
