import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, MapPin, Calendar, CheckCircle2 } from 'lucide-react'
import { UrgencyBadge, StatusBadge } from '@/components/Badges'
import { formatDate } from '@/lib/utils'

export default async function OfficerTasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!['officer', 'admin'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: tasks } = await supabase
    .from('officer_tasks')
    .select('*, report:reports(*)')
    .eq('officer_id', user.id)
    .order('created_at', { ascending: false })

  const pending = tasks?.filter((t) => t.status === 'assigned') || []
  const inProgress = tasks?.filter((t) => t.status === 'in_progress') || []
  const completed = tasks?.filter((t) => t.status === 'completed') || []

  return (
    <div className="max-w-md md:max-w-2xl mx-auto space-y-6 px-1 pb-10">

      {/* Page Header (Desktop Only to prevent duplication) */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tugas Saya</h1>
        <p className="text-slate-400 text-sm mt-1 font-medium">
          Semua laporan yang ditugaskan kepada Anda
        </p>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="space-y-6">

          {/* --- Menunggu Dikerjakan --- */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Menunggu Dikerjakan ({pending.length})
                </h2>
              </div>
              <div className="space-y-3">
                {pending.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* --- Dalam Proses --- */}
          {inProgress.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Dalam Proses ({inProgress.length})
                </h2>
              </div>
              <div className="space-y-3">
                {inProgress.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* --- Selesai --- */}
          {completed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Selesai ({completed.length})
                </h2>
              </div>
              <div className="space-y-3 opacity-80">
                {completed.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm text-center py-20 px-6">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-600 text-sm mb-1">Belum Ada Tugas</h3>
          <p className="text-xs text-slate-400 font-medium">
            Anda belum memiliki tugas yang ditugaskan
          </p>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: Record<string, any> }) {
  const urgency = task.report?.urgency || 'low'
  
  // Custom border color based on urgency
  let borderLeftColor = 'border-l-emerald-500'
  if (urgency === 'emergency') {
    borderLeftColor = 'border-l-red-500'
  } else if (urgency === 'high' || urgency === 'medium') {
    borderLeftColor = 'border-l-amber-500'
  }

  return (
    <Link
      href={`/officer/tasks/${task.id}`}
      className={`flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 ${borderLeftColor} hover:scale-[1.01] active:scale-[0.99] transition-all`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate leading-snug">
          {task.report?.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-450 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Kec. {task.report?.kecamatan || 'Bangkalan'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-450 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(task.created_at)}</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1.5">{task.report?.category_name}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 flex-col items-end">
        {task.report?.urgency && <UrgencyBadge urgency={task.report.urgency} />}
        <StatusBadge status={task.status} />
      </div>
    </Link>
  )
}
