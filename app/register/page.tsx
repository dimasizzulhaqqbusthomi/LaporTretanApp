'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Home,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { KECAMATAN_LIST } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    kecamatan: '',
    address: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Try to upsert profile with extra data
      // If it fails (e.g. email not confirmed yet), trigger will handle basic profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        role: 'citizen',
        kecamatan: form.kecamatan,
        address: form.address,
      })
      // Continue regardless — trigger handles profile creation
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Pendaftaran Berhasil!
          </h2>
          <p className="text-slate-500">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Akun</h1>
          <p className="text-slate-500 text-sm mt-1">
            Daftar sebagai warga Lapor Tretan
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-6 border border-slate-100">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Nomor HP
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Kecamatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Kecamatan
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  name="kecamatan"
                  value={form.kecamatan}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm appearance-none"
                >
                  <option value="">Pilih Kecamatan</option>
                  {KECAMATAN_LIST.map((k) => (
                    <option key={k} value={k}>
                      Kec. {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Alamat
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Alamat lengkap Anda"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm resize-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min. 6 karakter"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-200 disabled:opacity-60 mt-2"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Kembali ke Beranda
          </Link>
        </p>
      </div>
    </div>
  )
}
