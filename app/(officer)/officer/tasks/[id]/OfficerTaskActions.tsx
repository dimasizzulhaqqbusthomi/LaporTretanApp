'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  CheckSquare,
  Loader2,
  Camera,
  X,
  Upload,
  MessageCircleWarning,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { officerComplainTask } from '@/app/(citizen)/reports/[id]/actions'

interface Props {
  task: Record<string, unknown>
  report: Record<string, unknown>
  officerId: string
}

export default function OfficerTaskActions({ task, report, officerId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [completionNote, setCompletionNote] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [showComplainForm, setShowComplainForm] = useState(false)
  const [complainNote, setComplainNote] = useState('')
  const [complainError, setComplainError] = useState('')

  const taskStatus = task.status as string
  const reportStatus = report.status as string

  const isAssigned = taskStatus === 'assigned' || reportStatus === 'assigned'
  const isInProgress = taskStatus === 'in_progress' || reportStatus === 'in_progress'
  const isCompleted = taskStatus === 'completed' || reportStatus === 'completed'

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const newPhotos = [...photos, ...files].slice(0, 5)
    setPhotos(newPhotos)
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)))
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleStartTask() {
    setLoading(true)
    const supabase = createClient()
    const reportId = report.id as string
    const taskId = task.id as string

    await supabase
      .from('reports')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', reportId)

    await supabase
      .from('officer_tasks')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', taskId)

    await supabase.from('report_status_histories').insert({
      report_id: reportId,
      status: 'in_progress',
      note: 'Petugas mulai menangani laporan.',
      updated_by: officerId,
      updated_by_role: 'officer',
    })

    await supabase.from('notifications').insert({
      user_id: report.reporter_id,
      title: 'Laporan Sedang Ditangani',
      message: 'Petugas telah mulai menangani laporan Anda.',
      report_id: reportId,
    })

    setLoading(false)
    router.refresh()
  }

  async function handleComplain() {
    if (!complainNote.trim()) {
      setComplainError('Mohon isi alasan complain terlebih dahulu.')
      return
    }
    setLoading(true)
    setComplainError('')
    const res = await officerComplainTask(
      report.id as string,
      task.id as string,
      officerId,
      complainNote.trim()
    )
    setLoading(false)
    if (res.success) {
      router.push('/officer/tasks')
    } else {
      setComplainError(res.error || 'Terjadi kesalahan.')
    }
  }

  async function handleCompleteTask() {
    if (!completionNote.trim()) {
      alert('Mohon isi catatan penyelesaian terlebih dahulu.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const reportId = report.id as string
    const taskId = task.id as string

    // Upload completion photos
    const completionPhotoUrls: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(fileName, photo, { upsert: false })

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError)
        alert(`Gagal mengunggah foto "${photo.name}": ${uploadError.message}. Pastikan kebijakan RLS Storage (bucket 'completion-photos') di Supabase dashboard sudah mengizinkan insert untuk publik / user terotentikasi.`)
        setLoading(false)
        return
      }

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('completion-photos')
          .getPublicUrl(uploadData.path)
        completionPhotoUrls.push(urlData.publicUrl)
      }
    }

    await supabase.from('reports').update({
      status: 'completed',
      completion_note: completionNote,
      completion_photo_urls: completionPhotoUrls,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', reportId)

    await supabase.from('officer_tasks').update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', taskId)

    await supabase.from('report_status_histories').insert({
      report_id: reportId,
      status: 'completed',
      note: `Tugas selesai: ${completionNote}`,
      updated_by: officerId,
      updated_by_role: 'officer',
    })

    await supabase.from('notifications').insert({
      user_id: report.reporter_id,
      title: 'Laporan Selesai Ditangani',
      message: 'Laporan Anda telah selesai ditangani oleh petugas.',
      report_id: reportId,
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <>
      {isCompleted && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-bold text-green-700">Tugas Selesai</p>
          <p className="text-sm text-green-500 mt-1">
            Laporan ini telah berhasil diselesaikan.
          </p>
        </div>
      )}

      {isInProgress && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800">Laporkan Penyelesaian</h3>

          {!showCompletionForm ? (
            <button
              onClick={() => setShowCompletionForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 active:scale-[0.98] transition-all text-sm shadow-sm shadow-green-200"
            >
              <CheckSquare className="w-5 h-5" />
              Laporkan Tugas Selesai Perbaikan
            </button>
          ) : (
            <div className="space-y-4">
              {/* Completion Note */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Catatan Penyelesaian <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan tindakan yang telah dilakukan..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Foto Bukti Penyelesaian
                </label>
                <div className="flex gap-2 flex-wrap">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setShowSourceModal(true)}
                      className="w-20 h-20 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center gap-1 text-green-400 hover:bg-green-50"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px]">Tambah</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCompletionForm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleCompleteTask}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-60 text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {loading ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAssigned && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          {/* Start Task Button */}
          <button
            onClick={handleStartTask}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all text-sm shadow-sm shadow-blue-200 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {loading ? 'Memproses...' : 'Mulai Tangani'}
          </button>
          <p className="text-xs text-slate-400 text-center">
            Klik untuk menandai bahwa Anda sudah mulai menangani laporan ini
          </p>

          {/* Officer Complain Section */}
          <div className="border-t border-slate-100 pt-3">
            {!showComplainForm ? (
              <button
                type="button"
                onClick={() => setShowComplainForm(true)}
                className="w-full flex items-center justify-center gap-2 border border-orange-200 bg-orange-50 text-orange-700 font-bold py-2.5 rounded-xl hover:bg-orange-100 transition-all text-xs"
              >
                Bidang Tidak Cocok? Ajukan Complain
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700">Alasan Complain <span className="text-red-500">*</span></p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Jelaskan mengapa laporan ini tidak sesuai dengan bidang/dinas Anda. Admin akan menugaskan ulang ke dinas yang tepat.
                </p>
                <textarea
                  value={complainNote}
                  onChange={(e) => { setComplainNote(e.target.value); setComplainError('') }}
                  rows={3}
                  placeholder="Contoh: Laporan ini seharusnya ditangani oleh Dinas DLH karena menyangkut masalah lingkungan..."
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 resize-none transition-colors ${complainError
                    ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-50 focus:border-orange-300 focus:ring-orange-100'
                    }`}
                />
                {complainError && (
                  <p className="text-[11px] text-red-600 font-semibold">{complainError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowComplainForm(false); setComplainNote(''); setComplainError('') }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleComplain}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 disabled:opacity-60 text-xs"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircleWarning className="w-4 h-4" />}
                    {loading ? 'Mengirim...' : 'Kirim Complain'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📱 Flutter-style Image Source Bottom Sheet Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setShowSourceModal(false)} />
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative z-10 animate-slide-up">
            <div>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden" />
              <h4 className="font-extrabold text-slate-800 text-base">Pilih Sumber Foto Bukti</h4>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  cameraRef.current?.click()
                  setShowSourceModal(false)
                }}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl active:scale-[0.98] transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm font-bold text-slate-700">Ambil Foto (Kamera)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileRef.current?.click()
                  setShowSourceModal(false)
                }}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl active:scale-[0.98] transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-700">Pilih dari Galeri</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
