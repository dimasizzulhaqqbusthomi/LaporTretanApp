import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ClipboardList, User, FileText } from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '@/components/Badges'
import { formatDateTime } from '@/lib/utils'
import OfficerTaskActions from './OfficerTaskActions'
import ReportMap from '@/components/ReportMap'

export default async function OfficerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: task } = await supabase
    .from('officer_tasks')
    .select('*, report:reports(*)')
    .eq('id', id)
    .eq('officer_id', user.id)
    .single()

  if (!task) notFound()

  const report = task.report

  const { data: histories } = await supabase
    .from('report_status_histories')
    .select('*')
    .eq('report_id', report.id)
    .order('created_at', { ascending: false })

  const { data: rating } = await supabase
    .from('satisfaction_ratings')
    .select('*')
    .eq('report_id', report.id)
    .maybeSingle()

  return (
    <div className="max-w-md md:max-w-2xl mx-auto space-y-4 px-1 pb-10">

      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/officer/tasks"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-base font-black text-slate-800 tracking-tight">Detail Tugas</h1>
          <p className="text-xs text-slate-400 font-medium">ID: {report?.id?.slice(0, 8)}...</p>
        </div>
      </div>

      {/* ⭐ Penilaian Kepuasan Warga */}
      {rating && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                Penilaian Kepuasan Warga
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-amber-100/80 border border-amber-200/50 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black">
              ⭐ {rating.rating}/5
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg leading-none ${
                  star <= rating.rating ? 'text-amber-500' : 'text-slate-200'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <div className="bg-white/80 border border-amber-100/50 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed font-semibold">
            <span className="font-extrabold uppercase text-[9px] tracking-wider block text-amber-600 mb-0.5">
              Ulasan / Komentar Warga:
            </span>
            {rating.comment ? (
              `"${rating.comment}"`
            ) : (
              <span className="text-slate-400 italic">Tidak ada ulasan tertulis dari warga.</span>
            )}
          </div>
        </div>
      )}

      {/* 📸 Foto Hasil Penyelesaian Tugas Petugas (Diletakkan di Bagian Paling Atas!) */}
      {report?.completion_photo_urls && report.completion_photo_urls.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
              Bukti Penyelesaian Tugas Anda
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {report.completion_photo_urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative overflow-hidden rounded-2xl border border-emerald-100 aspect-video bg-white">
                <img
                  src={url}
                  alt={`Bukti Penyelesaian ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </a>
            ))}
          </div>
          {report.completion_note && (
            <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3.5 text-xs text-emerald-800 leading-relaxed font-semibold">
              <span className="font-extrabold uppercase text-[9px] tracking-wider block text-emerald-600 mb-0.5">Catatan Penyelesaian:</span>
              "{report.completion_note}"
            </div>
          )}
        </div>
      )}

      {/* Report Info Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge status={report?.status} />
          <UrgencyBadge urgency={report?.urgency} />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-4 tracking-tight leading-snug">
          {report?.title}
        </h2>
        <div className="space-y-2.5 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{report?.category_name}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="font-medium">
              {report?.address || '-'}, Kec. {report?.kecamatan || 'Bangkalan'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{formatDateTime(report?.created_at)}</span>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{report?.reporter_name}</span>
          </div>
        </div>
      </div>

      {/* 🗺️ Peta Lokasi */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Lokasi Kejadian
        </h3>
        <ReportMap
          latitude={report?.latitude ?? null}
          longitude={report?.longitude ?? null}
          address={report?.address ? `${report.address}, Kec. ${report?.kecamatan}` : null}
          title={report?.title}
        />
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
          Deskripsi Laporan
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          {report?.description}
        </p>
      </div>

      {/* Citizen Photos */}
      {report?.photo_urls && report.photo_urls.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
            Foto Bukti Warga
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {report.photo_urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                <img
                  src={url}
                  alt={`Bukti ${i + 1}`}
                  className="w-full h-28 object-cover rounded-2xl hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Admin Note */}
      {report?.admin_note && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">
            Catatan Admin
          </h3>
          <p className="text-sm text-blue-700 font-medium leading-relaxed">{report.admin_note}</p>
        </div>
      )}

      {/* Status History */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
          Riwayat Status
        </h3>
        {histories && histories.length > 0 ? (
          <div className="space-y-3">
            {histories.map((h, idx) => (
              <div
                key={h.id}
                className="flex gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0"
              >
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-1 ${idx === 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                  {idx < histories.length - 1 && (
                    <div className="w-px flex-1 bg-slate-100 min-h-[12px]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <StatusBadge status={h.status} />
                  {h.note && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{h.note}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {formatDateTime(h.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <FileText className="w-4 h-4" />
            <span>Belum ada riwayat status.</span>
          </div>
        )}
      </div>

      {/* Officer Actions */}
      <OfficerTaskActions task={task} report={report} officerId={user.id} />
    </div>
  )
}
