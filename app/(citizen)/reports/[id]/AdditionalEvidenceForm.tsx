'use client'

import { useState, useRef } from 'react'
import { Camera, X, Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

import { submitAdditionalEvidence } from './actions'

interface Props {
  reportId: string
  existingPhotos: string[]
}

export default function AdditionalEvidenceForm({ reportId, existingPhotos }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPhotos = [...photos, ...files].slice(0, 5)
    setPhotos(newPhotos)
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)))
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index))
    setPhotoPreviews((p) => p.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (photos.length === 0) {
      setError('Mohon lampirkan minimal 1 foto bukti tambahan.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      // 1. Upload new photos to report-photos bucket via client-side (safe as bucket is verified public!)
      const uploadedUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(fileName, photo, { upsert: false })

        if (uploadError) {
          throw new Error(`Gagal mengunggah foto "${photo.name}": ${uploadError.message}`)
        }

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('report-photos')
            .getPublicUrl(uploadData.path)
          uploadedUrls.push(urlData.publicUrl)
        }
      }

      // 2. Call the secure server action to update report and status history
      const result = await submitAdditionalEvidence(reportId, user.id, uploadedUrls, note)

      if (!result.success) {
        throw new Error(result.error || 'Gagal menyimpan bukti tambahan di server.')
      }

      setSuccess(true)
      setPhotos([])
      setPhotoPreviews([])
      setNote('')
      
      // Force Next.js router to refresh and update status
      router.refresh()
      
      // Delay slightly and then refresh again or reload window to ensure everything is perfect
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan saat mengirim bukti tambahan.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 text-center space-y-2 shadow-sm shadow-emerald-50 animate-fade-in">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />
        </div>
        <h4 className="font-extrabold text-slate-800 text-sm">Bukti Berhasil Dikirim!</h4>
        <p className="text-xs text-slate-500 font-semibold">
          Status laporan Anda dikembalikan ke <strong>Menunggu Verifikasi</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <Upload className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-sm tracking-tight">Kirim Bukti Tambahan</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Lengkapi data agar laporan Anda segera disetujui</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-650 rounded-2xl p-3.5 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Upload Area */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
            📸 Pilih Foto Bukti Baru (Maks. 5)
          </label>
          <div className="flex gap-2.5 flex-wrap">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 group">
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover rounded-2xl shadow-inner border border-slate-100"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-red-500 rounded-full flex items-center justify-center shadow hover:bg-red-600 active:scale-90 transition-all text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => setShowSourceModal(true)}
                className="w-20 h-20 border-2 border-dashed border-blue-200 bg-blue-50/10 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider">Tambah</span>
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

        {/* Text Note */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
            💬 Catatan Penjelasan (Opsional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Jelaskan bukti tambahan yang Anda lampirkan di sini..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-md shadow-blue-100/50 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengirim Bukti...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Kirim Bukti Tambahan
            </>
          )}
        </button>
      </form>

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
    </div>
  )
}
