'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  MapPin,
  AlertCircle,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  Construction,
  Lightbulb,
  Trash2,
  Layers,
  Droplets,
  Building,
  TrafficCone,
  Trees,
  ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import exifr from 'exifr'
import { createClient } from '@/lib/supabase/client'
import { KECAMATAN_LIST, CATEGORY_LIST, URGENCY_LIST } from '@/lib/utils'

// Dynamically import Leaflet map with SSR disabled to work perfectly with React 19 / Next.js
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
        <p className="text-xs text-slate-400 font-medium">Memuat peta interaktif...</p>
      </div>
    </div>
  ),
})

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  'Jalan Rusak': { icon: Construction, color: 'text-amber-600', bg: 'bg-amber-50' },
  'Lampu Jalan Mati': { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Sampah Menumpuk': { icon: Trash2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Drainase Tersumbat': { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Banjir / Genangan Air': { icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'Fasilitas Umum Rusak': { icon: Building, color: 'text-purple-600', bg: 'bg-purple-50' },
  'Rambu Lalu Lintas Rusak': { icon: TrafficCone, color: 'text-red-600', bg: 'bg-red-50' },
  'Pohon Tumbang': { icon: Trees, color: 'text-teal-600', bg: 'bg-teal-50' },
  'Kebersihan Lingkungan': { icon: Trash2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Lainnya': { icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-50' },
}

export default function CreateReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gpsDetectedMsg, setGpsDetectedMsg] = useState('')
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  // Auto-detect & map simplified category from query param to full CATEGORY_LIST item
  const queryCat = searchParams.get('category') || ''
  const defaultCategory = CATEGORY_LIST.find((c) =>
    c.toLowerCase().includes(queryCat.toLowerCase())
  ) || ''

  const [form, setForm] = useState({
    title: '',
    category: defaultCategory,
    description: '',
    urgency: 'medium',
    kecamatan: '',
    address: '',
    latitude: '',
    longitude: '',
  })

  // Ensure form category updates if query parameters change
  useEffect(() => {
    if (defaultCategory) {
      setForm((p) => ({ ...p, category: defaultCategory }))
    }
  }, [defaultCategory])

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // EXIF GPS metadata parser on photo uploads
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPhotos = [...photos, ...files].slice(0, 5)
    setPhotos(newPhotos)
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)))

    // Extract EXIF data from first uploaded photo
    const firstFile = files[0]
    try {
      const gps = await exifr.gps(firstFile)
      if (gps && gps.latitude && gps.longitude) {
        setForm((prev) => ({
          ...prev,
          latitude: gps.latitude.toString(),
          longitude: gps.longitude.toString(),
        }))
        setGpsDetectedMsg('📍 Lokasi GPS berhasil dideteksi otomatis dari foto!')
        setTimeout(() => setGpsDetectedMsg(''), 5000)

        // Trigger reverse geocoding to fill address & kecamatan
        reverseGeocode(gps.latitude, gps.longitude)
      }
    } catch (err) {
      console.warn('Metadata GPS tidak ditemukan pada foto ini.', err)
    }
  }

  // Approximate coordinate centers for each Kecamatan in Bangkalan to guarantee matching
  const KECAMATAN_CENTERS = [
    { name: 'Bangkalan', lat: -7.025, lng: 112.74 },
    { name: 'Burneh', lat: -7.045, lng: 112.77 },
    { name: 'Kamal', lat: -7.165, lng: 112.71 },
    { name: 'Socah', lat: -7.075, lng: 112.71 },
    { name: 'Arosbaya', lat: -6.955, lng: 112.76 },
    { name: 'Klampis', lat: -6.925, lng: 112.83 },
    { name: 'Tanjungbumi', lat: -6.905, lng: 112.97 },
    { name: 'Sepulu', lat: -6.895, lng: 112.92 },
    { name: 'Galis', lat: -7.075, lng: 112.89 },
    { name: 'Blega', lat: -7.135, lng: 112.98 },
  ]

  function getClosestKecamatan(lat: number, lng: number): string {
    let closestName = 'Bangkalan'
    let minDistance = Infinity

    for (const kec of KECAMATAN_CENTERS) {
      const d = Math.pow(lat - kec.lat, 2) + Math.pow(lng - kec.lng, 2)
      if (d < minDistance) {
        minDistance = d
        closestName = kec.name
      }
    }
    return closestName
  }

  // Reverse geocoding helper using OpenStreetMap free Nominatim API
  async function reverseGeocode(lat: number, lon: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      )
      const data = await res.json()
      
      let matchedKecamatan = ''
      let fullAddr = ''

      if (data && data.address) {
        const road = data.address.road || ''
        const suburb = data.address.suburb || data.address.village || data.address.town || ''
        fullAddr = [road, suburb, data.address.city || data.address.county || '']
          .filter(Boolean)
          .join(', ')

        // 1. Match from API text keywords
        const addressText = JSON.stringify(data.address).toLowerCase()
        const found = KECAMATAN_LIST.find((k) =>
          addressText.includes(k.toLowerCase())
        )
        if (found) matchedKecamatan = found
      }

      // 2. Guarantee match using closest geographic distance fallback
      if (!matchedKecamatan) {
        matchedKecamatan = getClosestKecamatan(lat, lon)
      }

      setForm((prev) => ({
        ...prev,
        address: fullAddr || prev.address,
        kecamatan: matchedKecamatan,
      }))
    } catch (err) {
      console.error('Reverse geocode error:', err)
      // Fallback to closest kecamatan on network failure
      const fallbackKec = getClosestKecamatan(lat, lon)
      setForm((prev) => ({
        ...prev,
        kecamatan: fallbackKec,
      }))
    }
  }

  function handleMapLocationChange(newLat: number, newLng: number) {
    setForm((prev) => ({
      ...prev,
      latitude: newLat.toFixed(6),
      longitude: newLng.toFixed(6),
    }))
    reverseGeocode(newLat, newLng)
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index))
    setPhotoPreviews((p) => p.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.description) {
      setError('Mohon isi semua field yang wajib diisi.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const photoUrls: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(fileName, photo, { upsert: false })

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError)
        setError(`Gagal mengunggah foto "${photo.name}": ${uploadError.message}. Silakan hubungi admin atau pastikan kebijakan RLS Storage (bucket 'report-photos') sudah diizinkan untuk publik di Supabase dashboard Anda.`)
        setLoading(false)
        return
      }

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(uploadData.path)
        photoUrls.push(urlData.publicUrl)
      }
    }

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reporter_name: profile?.full_name || 'Warga',
        title: form.title,
        description: form.description,
        category_name: form.category,
        urgency: form.urgency,
        status: 'waiting_verification',
        kecamatan: form.kecamatan,
        address: form.address,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        photo_urls: photoUrls,
        is_public: true,
      })
      .select()
      .single()

    if (reportError) {
      setError('Gagal mengirim laporan: ' + reportError.message)
      setLoading(false)
      return
    }

    await supabase.from('report_status_histories').insert({
      report_id: reportData.id,
      status: 'waiting_verification',
      note: 'Laporan berhasil dikirim oleh warga.',
      updated_by: user.id,
      updated_by_role: 'citizen',
    })

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Laporan Berhasil Dikirim',
      message: `Laporan "${form.title}" Anda telah berhasil dikirim dan sedang menunggu verifikasi.`,
      report_id: reportData.id,
    })

    // Broadcast new report notification to all Admin users!
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (adminProfiles && adminProfiles.length > 0) {
      const adminNotifs = adminProfiles.map((adm) => ({
        user_id: adm.id,
        title: 'Laporan Baru Menunggu Verifikasi',
        message: `Warga baru saja mengirimkan laporan baru "${form.title}". Segera verifikasi laporan ini!`,
        report_id: reportData.id,
        is_read: false,
      }))
      await supabase.from('notifications').insert(adminNotifs)
    }

    setStep('success')
    setLoading(false)
    setTimeout(() => router.push(`/reports/${reportData.id}`), 2500)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Laporan Terkirim!</h2>
          <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
            Laporan Anda sedang menunggu verifikasi. Kami akan segera menindaklanjuti.
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 border-b border-slate-100 shadow-sm">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="font-bold text-slate-800 text-sm">Buat Laporan</h1>
          <p className="text-[10px] text-slate-400 font-medium">Laporkan masalah fasilitas umum</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5 max-w-md mx-auto">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-2xl p-4 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {gpsDetectedMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 rounded-2xl p-4 text-xs font-semibold shadow-sm shadow-emerald-100 animate-pulse">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {gpsDetectedMsg}
          </div>
        )}

        {/* Photo Upload */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
            📸 Foto Bukti{' '}
            <span className="text-slate-400 font-medium text-[10px] lowercase">(maks. 5 foto)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 group">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl shadow-inner border border-slate-100" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow hover:bg-red-600 active:scale-90 transition-all"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => setShowSourceModal(true)}
                className="w-20 h-20 border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-xl flex flex-col items-center justify-center gap-1.5 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-bold">Tambah</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-2.5 leading-normal">
            💡 <strong>Tips:</strong> Foto yang diambil langsung di lokasi secara otomatis mengisi koordinat GPS peta!
          </p>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
            📂 Kategori <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_LIST.map((cat) => {
              const meta = categoryMeta[cat] || {
                icon: ClipboardList,
                color: 'text-slate-600',
                bg: 'bg-slate-50',
              }
              const IconComp = meta.icon
              const isSelected = form.category === cat

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className={`text-left p-3 rounded-xl border-2 transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white shadow-sm' : meta.bg}`}>
                    <IconComp className={`w-4 h-4 ${isSelected ? 'text-blue-600' : meta.color}`} />
                  </div>
                  <span className="text-[11px] font-bold leading-tight">{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Title & Description */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              📝 Judul Laporan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Contoh: Jalan berlubang di depan pasar..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              💬 Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Jelaskan kondisi dan dampak masalah secara detail..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>

        {/* Urgency */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">⚡ Tingkat Urgensi</label>
          <div className="grid grid-cols-4 gap-2">
            {URGENCY_LIST.map((u) => {
              const active: Record<string, string> = {
                low: 'border-green-400 bg-green-50 text-green-700 shadow-sm shadow-green-100',
                medium: 'border-yellow-400 bg-yellow-50 text-yellow-700 shadow-sm shadow-yellow-100',
                high: 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm shadow-orange-100',
                emergency: 'border-red-400 bg-red-50 text-red-700 shadow-sm shadow-red-100',
              }
              return (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, urgency: u.value }))}
                  className={`py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all text-center ${
                    form.urgency === u.value
                      ? active[u.value]
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {u.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Real Dynamic Interactive Map */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" />
            Lokasi Kejadian
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kecamatan</label>
              <select
                name="kecamatan"
                value={form.kecamatan}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Pilih Kecamatan</option>
                {KECAMATAN_LIST.map((k) => (
                  <option key={k} value={k}>Kec. {k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alamat Lengkap</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                placeholder="Nama jalan, RT/RW, atau landmark terdekat..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Peta Lokasi Asli</span>
            </div>

            <InteractiveMap
              lat={form.latitude ? parseFloat(form.latitude) : null}
              lng={form.longitude ? parseFloat(form.longitude) : null}
              onChange={handleMapLocationChange}
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="-7.025000"
                  step="any"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="112.740000"
                  step="any"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Mengirim Laporan...</>
          ) : (
            <><Upload className="w-4 h-4" />Kirim Laporan</>
          )}
        </button>
        <div className="pb-4" />
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
