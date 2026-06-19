'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Phone,
  MapPin,
  Home,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

const KECAMATAN_LIST = [
  'Bangkalan',
  'Burneh',
  'Kamal',
  'Labang',
  'Kwanyar',
  'Modung',
  'Blega',
  'Konang',
  'Galis',
  'Tanah Merah',
  'Tragah',
  'Socah',
  'Arosbaya',
  'Geger',
  'Kokop',
  'Tanjungbumi',
  'Sepulu',
  'Klampis',
]

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [address, setAddress] = useState('')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Feedback
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name || '')
      setPhoneNumber(data.phone_number || '')
      setKecamatan(data.kecamatan || '')
      setAddress(data.address || '')
    }
    setLoading(false)
  }

  function clearMessages() {
    setSuccessMsg('')
    setErrorMsg('')
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    clearMessages()

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        kecamatan: kecamatan || null,
        address: address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setErrorMsg('Gagal menyimpan perubahan. Silakan coba lagi.')
    } else {
      setSuccessMsg('Profil berhasil diperbarui!')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    clearMessages()

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)

    if (error) {
      setErrorMsg(error.message || 'Gagal mengubah password. Silakan coba lagi.')
    } else {
      setSuccessMsg('Password berhasil diubah!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-slate-400 text-sm">Memuat profil...</p>
        </div>
      </div>
    )
  }

  const initials = (fullName || profile?.full_name || 'W')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white px-4 pt-12 pb-14 relative overflow-hidden rounded-b-[2rem] shadow-lg shadow-blue-900/10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-lg pointer-events-none" />

        {/* Back button + title */}
        <div className="relative flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Edit Profil</h1>
        </div>

        {/* Avatar */}
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <span className="text-2xl font-extrabold text-white tracking-wide">{initials}</span>
          </div>
          <p className="text-blue-200 text-xs mt-2">{profile?.email}</p>
        </div>
      </div>

      {/* Tab switcher & Form card — pulled up */}
      <div className="px-4 -mt-8 relative z-10 space-y-3">
        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm flex gap-1">
          <button
            onClick={() => { setActiveTab('profile'); clearMessages() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <User className="w-4 h-4" />
            Informasi
          </button>
          <button
            onClick={() => { setActiveTab('password'); clearMessages() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'password'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Lock className="w-4 h-4" />
            Password
          </button>
        </div>

        {/* Feedback banner */}
        {successMsg && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* — Profile Tab — */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Full Name */}
            <div className="px-4 py-4 border-b border-slate-50">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" /> Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full text-sm text-slate-800 font-medium bg-slate-50/60 border border-slate-100 rounded-xl px-3.5 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Phone */}
            <div className="px-4 py-4 border-b border-slate-50">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Phone className="w-3.5 h-3.5" /> Nomor HP
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full text-sm text-slate-800 font-medium bg-slate-50/60 border border-slate-100 rounded-xl px-3.5 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Kecamatan */}
            <div className="px-4 py-4 border-b border-slate-50">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5" /> Kecamatan
              </label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full text-sm text-slate-800 font-medium bg-slate-50/60 border border-slate-100 rounded-xl px-3.5 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none"
              >
                <option value="">-- Pilih Kecamatan --</option>
                {KECAMATAN_LIST.map((kec) => (
                  <option key={kec} value={kec}>{kec}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="px-4 py-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Home className="w-3.5 h-3.5" /> Alamat Lengkap
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan alamat lengkap Anda"
                rows={3}
                className="w-full text-sm text-slate-800 font-medium bg-slate-50/60 border border-slate-100 rounded-xl px-3.5 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="px-4 pb-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-sm shadow-blue-200 active:scale-[0.98] transition-all text-sm disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* — Password Tab — */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* New Password */}
            <div className="px-4 py-4 border-b border-slate-50">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" /> Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-sm text-slate-800 font-medium bg-slate-50/60 border border-slate-100 rounded-xl px-3.5 py-3 pr-11 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${newPassword.length >= level * 3
                        ? level <= 1 ? 'bg-red-400'
                          : level <= 2 ? 'bg-amber-400'
                            : level <= 3 ? 'bg-blue-400'
                              : 'bg-emerald-400'
                        : 'bg-slate-100'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="px-4 py-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" /> Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className={`w-full text-sm font-medium bg-slate-50/60 border rounded-xl px-3.5 py-3 pr-11 outline-none focus:ring-2 transition-all placeholder:text-slate-300 ${confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-300 text-red-600 focus:border-red-400 focus:ring-red-50'
                    : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-300 text-slate-800 focus:border-emerald-400 focus:ring-emerald-50'
                      : 'border-slate-100 text-slate-800 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Password cocok
                </p>
              )}
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Password tidak cocok
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="px-4 pb-4">
              <button
                type="submit"
                disabled={saving || !newPassword || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-sm shadow-blue-200 active:scale-[0.98] transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengubah Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Ubah Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
