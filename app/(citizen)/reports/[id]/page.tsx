import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  FileText,
} from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '@/components/Badges'
import { formatDateTime, getStatusLabel } from '@/lib/utils'
import { ReportStatus } from '@/lib/types'
import SatisfactionRatingForm from './SatisfactionRatingForm'
import AdditionalEvidenceForm from './AdditionalEvidenceForm'
import ReportMap from '@/components/ReportMap'

const statusTimeline: { status: ReportStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'waiting_verification', label: 'Terkirim', icon: <FileText className="w-4 h-4" /> },
  { status: 'verified', label: 'Diverifikasi', icon: <CheckCircle2 className="w-4 h-4" /> },
  { status: 'assigned', label: 'Ditugaskan', icon: <User className="w-4 h-4" /> },
  { status: 'in_progress', label: 'Dalam Proses', icon: <Clock className="w-4 h-4" /> },
  { status: 'completed', label: 'Selesai', icon: <CheckCircle2 className="w-4 h-4" /> },
]

const statusOrder: Record<ReportStatus, number> = {
  waiting_verification: 0,
  verified: 1,
  assigned: 2,
  in_progress: 3,
  completed: 4,
  rejected: -1,
  duplicate: -1,
  need_evidence: -1,
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (!report) notFound()

  // Fetch department name if assigned
  let departmentName = null
  if (report.assigned_department_id) {
    const { data: dept } = await supabase
      .from('departments')
      .select('name')
      .eq('id', report.assigned_department_id)
      .single()
    departmentName = dept?.name || null
  }

  const { data: histories } = await supabase
    .from('report_status_histories')
    .select('*')
    .eq('report_id', id)
    .order('created_at', { ascending: true })

  const { data: existingRating } = user
    ? await supabase
        .from('satisfaction_ratings')
        .select('*')
        .eq('report_id', id)
        .eq('user_id', user.id)
        .single()
    : { data: null }

  const currentStatusOrder = statusOrder[report.status as ReportStatus]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3 flex items-center gap-3 border-b border-slate-100 shadow-sm">
        <Link
          href="/reports/history"
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="font-bold text-slate-800 text-base">Detail Laporan</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Title & Badges */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 text-lg mb-3 leading-snug">
            {report.title}
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={report.status} />
            <UrgencyBadge urgency={report.urgency} />
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{report.category_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {report.address || '-'}, Kec. {report.kecamatan || 'Bangkalan'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateTime(report.created_at)}</span>
            </div>
            {departmentName && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 border border-blue-100/50">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dinas Penanggung Jawab</p>
                  <p className="text-xs font-extrabold text-blue-700 mt-0.5">{departmentName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        {report.photo_urls && report.photo_urls.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">
              📸 Foto Bukti
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {report.photo_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="block flex-shrink-0">
                  <img
                    src={url}
                    alt={`Bukti ${i + 1}`}
                    className="w-36 h-28 object-cover rounded-xl hover:opacity-85 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Peta Lokasi Kejadian */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-500" />
            Lokasi Kejadian
          </h3>
          <ReportMap
            latitude={report.latitude ?? null}
            longitude={report.longitude ?? null}
            address={report.address ? `${report.address}, Kec. ${report.kecamatan}` : null}
            title={report.title}
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">
            📝 Deskripsi
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* Admin Note */}
        {report.admin_note && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-700 text-sm mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Catatan Admin
            </h3>
            <p className="text-sm text-blue-600">{report.admin_note}</p>
          </div>
        )}

        {/* Kirim Bukti Tambahan Form (Hanya jika butuh bukti tambahan dan diakses oleh pemilik laporan) */}
        {report.status === 'need_evidence' && user && report.reporter_id === user.id && (
          <AdditionalEvidenceForm reportId={report.id} existingPhotos={report.photo_urls || []} />
        )}

        {/* Completion */}
        {report.status === 'completed' && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <h3 className="font-semibold text-green-700 text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Laporan Selesai
            </h3>
            {report.completion_note && (
              <p className="text-sm text-green-650 font-medium mb-3">{report.completion_note}</p>
            )}
            {report.completion_photo_urls && report.completion_photo_urls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {report.completion_photo_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block flex-shrink-0">
                    <img
                      src={url}
                      alt={`Selesai ${i + 1}`}
                      className="w-32 h-24 object-cover rounded-xl hover:opacity-85 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">
            📊 Status Laporan
          </h3>

          {report.status === 'rejected' ? (
            <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
              <p className="text-red-600 font-semibold text-sm">Laporan Ditolak</p>
              {report.admin_note && (
                <p className="text-red-400 text-xs mt-1">{report.admin_note}</p>
              )}
            </div>
          ) : report.status === 'need_evidence' ? (
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-150 text-center space-y-1">
              <p className="text-amber-800 font-black text-sm">Butuh Bukti Tambahan</p>
              <p className="text-amber-600 text-xs font-semibold leading-relaxed">
                Silakan lengkapi dan unggah foto bukti baru pada form <strong>"Kirim Bukti Tambahan"</strong> di atas agar admin dapat memverifikasi ulang laporan Anda.
              </p>
            </div>
          ) : report.status === 'duplicate' ? (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-center space-y-1">
              <p className="text-slate-800 font-black text-sm">Laporan Duplikat</p>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Laporan ini ditandai sebagai duplikat dari laporan lain yang sudah dikirimkan sebelumnya.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-100" />
              <div className="space-y-4">
                {statusTimeline.map((step, idx) => {
                  const done = currentStatusOrder >= idx
                  const active = currentStatusOrder === idx
                  const history = histories?.find(
                    (h) =>
                      h.status === step.status ||
                      (step.status === 'waiting_verification' &&
                        h.status === 'waiting_verification')
                  )
                  return (
                    <div key={step.status} className="flex items-start gap-3 relative pl-0.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          done
                            ? active
                              ? 'bg-blue-600 text-white'
                              : 'bg-green-100 text-green-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            done ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        {history && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDateTime(history.created_at)}
                          </p>
                        )}
                        {history?.note && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">
                            {history.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Satisfaction Rating */}
        {report.status === 'completed' &&
          user &&
          report.reporter_id === user.id &&
          !existingRating && (
            <SatisfactionRatingForm reportId={report.id} userId={user.id} />
          )}

        {existingRating && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                  Penilaian Kepuasan Anda
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-amber-100/80 border border-amber-200/50 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black">
                ⭐ {existingRating.rating}/5
              </div>
            </div>
            
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg leading-none ${
                    star <= existingRating.rating ? 'text-amber-500' : 'text-slate-200'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="bg-white/80 border border-amber-100/50 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed font-semibold">
              <span className="font-extrabold uppercase text-[9px] tracking-wider block text-amber-600 mb-0.5">
                Ulasan / Komentar Anda:
              </span>
              {existingRating.comment ? (
                `"${existingRating.comment}"`
              ) : (
                <span className="text-slate-400 italic">Tidak ada ulasan tertulis.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
