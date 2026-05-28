import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Play,
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

  return (
    <div className="max-w-md md:max-w-2xl mx-auto space-y-5 px-1 pb-10">

      {/* 👷 Officer Profile Header Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-3xl p-5 shadow-lg shadow-green-150/50 flex items-center gap-4 relative overflow-hidden border border-green-500/20">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-md border border-white/20">
          <HardHat className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-extrabold text-sm md:text-base leading-tight tracking-tight truncate">
            {displayName}
          </h2>
          <p className="text-white/80 text-[10px] md:text-xs font-semibold mt-0.5">
            Petugas Lapangan · Kab. Bangkalan
          </p>
        </div>
      </div>

      {/* 📊 Statistik Tugas Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800 tracking-tight">
          Ringkasan Tugas
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Tugas */}
          <div className="bg-green-600 text-white rounded-3xl p-4 flex flex-col justify-between aspect-[1.2] shadow-md shadow-green-100">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">{total || 0}</p>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5">Total Tugas</p>
            </div>
          </div>

          {/* Card 2: Menunggu Dikerjakan */}
          <div className="bg-amber-50/70 border border-amber-100/60 rounded-3xl p-4 flex flex-col justify-between aspect-[1.2]">
            <div className="w-8 h-8 bg-amber-100/50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-600 tracking-tight">{assigned || 0}</p>
              <p className="text-[10px] text-amber-800/80 font-bold uppercase tracking-wider mt-0.5">Menunggu</p>
            </div>
          </div>

          {/* Card 3: Dalam Proses */}
          <div className="bg-blue-50/70 border border-blue-100/60 rounded-3xl p-4 flex flex-col justify-between aspect-[1.2]">
            <div className="w-8 h-8 bg-blue-100/50 rounded-xl flex items-center justify-center">
              <Play className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-blue-600 tracking-tight">{inProgress || 0}</p>
              <p className="text-[10px] text-blue-800/80 font-bold uppercase tracking-wider mt-0.5">Dalam Proses</p>
            </div>
          </div>

          {/* Card 4: Selesai */}
          <div className="bg-emerald-50/70 border border-emerald-100/60 rounded-3xl p-4 flex flex-col justify-between aspect-[1.2]">
            <div className="w-8 h-8 bg-emerald-100/50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-600 tracking-tight">{completed || 0}</p>
              <p className="text-[10px] text-emerald-800/80 font-bold uppercase tracking-wider mt-0.5">Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 Primary CTA — if there are assigned tasks */}
      {(assigned || 0) > 0 && (
        <Link
          href="/officer/tasks"
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl text-center shadow-lg shadow-green-150/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <ClipboardList className="w-4 h-4 text-white" />
          Lihat Tugas Menunggu ({assigned || 0})
        </Link>
      )}

      {/* 📋 Tugas Aktif Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">Tugas Aktif</h3>
          <Link href="/officer/tasks" className="text-xs font-bold text-green-600 hover:text-green-700">
            Lihat Semua
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
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
