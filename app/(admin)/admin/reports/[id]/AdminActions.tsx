'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  Copy,
  UserCheck,
  FileWarning,
  Loader2,
  AlertCircle,
  Building,
  User,
} from 'lucide-react'
import { Report } from '@/lib/types'

import { performAdminReportAction } from '@/app/(citizen)/reports/[id]/actions'

interface Props {
  report: Report
  officers: { id: string; full_name: string }[]
  departments: { id: string; name: string }[]
  adminId: string
}

export default function AdminActions({ report, officers, departments, adminId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote] = useState(report.admin_note || '')
  const [selectedDept, setSelectedDept] = useState(report.assigned_department_id || '')
  const [success, setSuccess] = useState('')
  const [noteError, setNoteError] = useState('')

  async function performAction(
    action: 'verify' | 'reject' | 'duplicate' | 'need_evidence' | 'assign'
  ) {
    setLoading(action)
    setSuccess('')
    setNoteError('')

    if (action === 'reject' && !note.trim()) {
      setNoteError('Catatan wajib diisi sebelum menolak laporan.')
      setLoading(null)
      return
    }

    if (action === 'assign' && !selectedDept) {
      alert('Pilih dinas terlebih dahulu')
      setLoading(null)
      return
    }

    const res = await performAdminReportAction(
      report.id,
      action,
      adminId,
      note,
      selectedDept || undefined
    )

    if (res.success) {
      setSuccess('Berhasil memproses laporan!')
      setLoading(null)
      router.refresh()
    } else {
      alert(res.error || 'Terjadi kesalahan penanganan aduan.')
      setLoading(null)
    }
  }

  const assignedOfficerObj = officers.find((o) => o.id === report.assigned_officer_id)
  const assignedDeptObj = departments.find((d) => d.id === report.assigned_department_id)

  function getDeptAbbreviation(name: string) {
    if (name.includes('Pekerjaan Umum')) return 'PUPR'
    if (name.includes('Lingkungan Hidup')) return 'DLH'
    if (name.includes('Perhubungan')) return 'Dishub'
    if (name.includes('Penanggulangan Bencana')) return 'BPBD'
    if (name.includes('Perumahan Rakyat')) return 'PRKP'
    return ''
  }

  const assignedDeptName = assignedDeptObj?.name
    ? `${assignedDeptObj.name} (${getDeptAbbreviation(assignedDeptObj.name)})`
    : '-'

  return (
    <div className="space-y-4">
      {/* Dynamic Status Banner */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alur Laporan Saat Ini</h4>
        {report.status === 'waiting_verification' && (
          <div className="flex items-start gap-2.5 text-xs text-amber-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Menunggu Penyaringan:</strong> Laporan baru dikirim oleh warga. Admin silakan melakukan pengecekan bukti dan menyaring laporan dengan menekan tombol <strong>Verifikasi Laporan</strong> di bawah.
            </p>
          </div>
        )}
        {report.status === 'verified' && (
          <div className="flex items-start gap-2.5 text-xs text-blue-700 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Terverifikasi:</strong> Laporan valid. Admin dipersilakan memilih <strong>Dinas terkait</strong> pada form di bawah dan menugaskannya untuk perbaikan.
            </p>
          </div>
        )}
        {report.status === 'assigned' && (
          <div className="flex items-start gap-2.5 text-xs text-indigo-700 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
            <UserCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">Sudah Dikirim ke Dinas:</p>
              <p className="mt-1">Dinas: {assignedDeptName}</p>
              <p className="mt-1 text-[10px] text-indigo-500 font-medium">Menunggu petugas dinas mengambil dan menangani laporan ini.</p>
            </div>
          </div>
        )}
        {report.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-orange-700 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 animate-pulse">
              <Loader2 className="w-4 h-4 text-orange-600 animate-spin flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Dalam Perbaikan:</strong> Petugas <strong>{assignedOfficerObj?.full_name || 'Dinas Lapangan'}</strong> sedang di lokasi menyelesaikan perbaikan masalah infrastruktur ini.
              </p>
            </div>
          </div>
        )}
        {report.status === 'completed' && (
          <div className="flex items-start gap-2.5 text-xs text-green-700 bg-green-50/50 p-2.5 rounded-xl border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">Laporan Selesai! 🎉</p>
              <p className="mt-0.5">Telah diselesaikan oleh petugas dengan bukti lampiran foto.</p>
            </div>
          </div>
        )}
        {['rejected', 'duplicate', 'need_evidence'].includes(report.status) && (
          <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200">
            <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Status Akhir Saringan:</strong> Laporan saat ini berstatus <strong>{report.status}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Officer Complain Notice */}
      {(report as any).officer_complain_note && report.status === 'verified' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">⚠ Complain Petugas</p>
            <p className="text-xs text-amber-700 leading-relaxed">{(report as any).officer_complain_note}</p>
            <p className="text-[10px] text-amber-500 font-medium mt-1">Silakan ubah penugasan ke dinas yang sesuai.</p>
          </div>
        </div>
      )}

      {/* Admin Note */}
      {['waiting_verification', 'verified', 'need_evidence'].includes(report.status) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Catatan Admin
            <span className="ml-1 text-red-500 font-bold">*</span>
            <span className="ml-1 text-[10px] text-slate-400 font-medium normal-case">(wajib diisi saat menolak)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); if (noteError) setNoteError('') }}
            rows={3}
            placeholder="Tambahkan catatan untuk laporan ini..."
            className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 resize-none disabled:opacity-60 transition-colors ${noteError
              ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 bg-slate-50 focus:border-blue-300 focus:ring-blue-50'
              }`}
          />
          {noteError && (
            <div className="flex items-center gap-1.5 mt-2 text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <p className="text-[11px] font-semibold">{noteError}</p>
            </div>
          )}
        </div>
      )}

      {/* Assign Officer — locked when in_progress */}
      {['verified', 'assigned', 'in_progress'].includes(report.status) && (
        <div className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${report.status === 'in_progress' ? 'border-slate-200 opacity-60 pointer-events-none select-none' : 'border-slate-100'
          }`}>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            Penugasan Dinas
            {report.status === 'in_progress' && (
              <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 normal-case tracking-normal">
                Terkunci
              </span>
            )}
          </h3>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dinas Terkait</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={report.status === 'in_progress'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:outline-none appearance-none disabled:cursor-not-allowed"
              >
                <option value="">Pilih Dinas</option>
                {departments.map((d) => {
                  const abbr = getDeptAbbreviation(d.name)
                  const displayName = abbr ? `${d.name} (${abbr})` : d.name
                  return (
                    <option key={d.id} value={d.id}>
                      {displayName}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-600 font-semibold shadow-inner">
          ✓ {success}
        </div>
      )}

      {/* Dynamic Action Buttons based on status */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Tindakan</h3>

        {/* STEP 1: Verify / Reject / Dup/ Need Evidence */}
        {report.status === 'waiting_verification' && (
          <div className="space-y-2">
            <button
              onClick={() => performAction('verify')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-60 text-xs uppercase tracking-wide transition-all shadow shadow-green-100"
            >
              {loading === 'verify' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Verifikasi Laporan
            </button>

            <button
              onClick={() => performAction('need_evidence')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white font-bold py-3 rounded-xl hover:bg-yellow-600 disabled:opacity-60 text-xs uppercase tracking-wide transition-all"
            >
              {loading === 'need_evidence' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileWarning className="w-4 h-4" />
              )}
              Minta Bukti Tambahan
            </button>

            <button
              onClick={() => performAction('duplicate')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-500 text-white font-bold py-3 rounded-xl hover:bg-slate-600 disabled:opacity-60 text-xs uppercase tracking-wide transition-all"
            >
              {loading === 'duplicate' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Tandai Duplikat
            </button>

            <button
              onClick={() => performAction('reject')}
              disabled={!!loading}
              title={!note.trim() ? 'Isi catatan admin terlebih dahulu' : ''}
              className="w-full flex flex-col items-center justify-center gap-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 text-xs uppercase tracking-wide transition-all"
            >
              <span className="flex items-center gap-2">
                {loading === 'reject' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Tolak Laporan
              </span>
            </button>
          </div>
        )}

        {/* STEP 2: Assign (only shown if report is verified or already assigned — locked if in_progress) */}
        {['verified', 'assigned', 'in_progress'].includes(report.status) && (
          <div className="space-y-2">
            {report.status === 'in_progress' ? (
              <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-400">
                  Petugas sudah mulai menangani laporan ini.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => performAction('assign')}
                  disabled={!!loading || !selectedDept}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl disabled:opacity-50 text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-100/50"
                >
                  {loading === 'assign' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  {report.status === 'verified' ? 'Kirim ke Dinas' : 'Ubah Penugasan Dinas'}
                </button>

                {report.status === 'verified' && (
                  <button
                    onClick={() => performAction('reject')}
                    disabled={!!loading}
                    title={!note.trim() ? 'Isi catatan admin terlebih dahulu' : ''}
                    className="w-full flex flex-col items-center justify-center gap-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-60 text-xs uppercase tracking-wide transition-all"
                  >
                    <span className="flex items-center gap-2">
                      {loading === 'reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Tolak Laporan
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Report is complete or closed */}
        {['completed', 'rejected', 'duplicate'].includes(report.status) && (
          <div className="text-center py-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
              🔒 Laporan Selesai & Ditutup
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
