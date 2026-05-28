import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ClipboardList, CheckCircle2, User } from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '@/components/Badges'
import { formatDateTime } from '@/lib/utils'
import AdminActions from './AdminActions'
import ReportMap from '@/components/ReportMap'

export default async function AdminReportDetailPage({
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
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()
  if (!report) notFound()

  const { data: histories } = await supabase
    .from('report_status_histories')
    .select('*')
    .eq('report_id', id)
    .order('created_at', { ascending: false })

  const { data: officers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'officer')

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('is_active', true)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/reports"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Detail Laporan</h1>
          <p className="text-xs text-slate-400">ID: {report.id}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_340px] gap-5">
        {/* Left */}
        <div className="space-y-4">
          {/* Report Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              {report.title}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusBadge status={report.status} />
              <UrgencyBadge urgency={report.urgency} />
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>{report.category_name}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>
                  {report.address || '-'}, Kec. {report.kecamatan || 'Bangkalan'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>{formatDateTime(report.created_at)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelapor</p>
                <p className="text-sm font-semibold text-slate-700">{report.reporter_name}</p>
              </div>
            </div>
          </div>

          {/* 🗺️ Peta Lokasi Kejadian */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Deskripsi Laporan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">
              Foto Bukti Pelapor
            </h3>
            {report.photo_urls && report.photo_urls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {report.photo_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative overflow-hidden rounded-xl border border-slate-100 aspect-video bg-slate-50">
                    <img
                      src={url}
                      alt={`Bukti ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">📸 Tidak Ada Lampiran Foto</p>
              </div>
            )}
          </div>

          {/* Completion Evidence from Officer */}
          {report.status === 'completed' && (
            <div className="bg-green-50/50 rounded-2xl border border-green-100 shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-green-850 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Bukti Penyelesaian Petugas Lapangan
              </h3>
              {report.completion_note && (
                <p className="text-sm text-green-700 font-semibold">
                  Catatan: <span className="text-slate-600 font-normal">{report.completion_note}</span>
                </p>
              )}
              {report.completion_photo_urls && report.completion_photo_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {report.completion_photo_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={`Bukti Selesai ${i + 1}`}
                        className="w-full h-28 object-cover rounded-xl hover:opacity-80 transition-opacity border border-green-200"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4">
              Riwayat Status
            </h3>
            {histories && histories.length > 0 ? (
              <div className="space-y-3">
                {histories.map((h) => (
                  <div
                    key={h.id}
                    className="flex gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-xs text-slate-400">
                          {h.updated_by_role}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-slate-500 mt-1">{h.note}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(h.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Belum ada riwayat.</p>
            )}
          </div>
        </div>

        {/* Right: Admin Actions */}
        <div>
          <AdminActions
            report={report}
            officers={officers || []}
            departments={departments || []}
            adminId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
