'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  ClipboardList,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

const roleLabels: Record<string, string> = {
  citizen: 'Warga',
  admin: 'Administrator',
  officer: 'Petugas',
}

const roleBadgeColors: Record<string, string> = {
  citizen: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
  officer: 'bg-green-100 text-green-700',
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 })
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

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
    setProfile(data)

    const [{ count: total }, { count: completed }, { count: inProgress }] =
      await Promise.all([
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('reporter_id', user.id),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('reporter_id', user.id)
          .eq('status', 'completed'),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('reporter_id', user.id)
          .eq('status', 'in_progress'),
      ])

    setStats({ total: total || 0, completed: completed || 0, inProgress: inProgress || 0 })
    setLoading(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat profil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-14 pb-8 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-white/80" />
          </div>
          <h2 className="text-xl font-bold">{profile?.full_name}</h2>
          <p className="text-blue-200 text-sm mt-0.5">{profile?.email}</p>
          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              roleBadgeColors[profile?.role || 'citizen']
            } bg-white/20 text-white`}
          >
            <Shield className="w-3 h-3 inline mr-1" />
            {roleLabels[profile?.role || 'citizen']}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Selesai', value: stats.completed },
            { label: 'Proses', value: stats.inProgress },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-blue-200 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-4 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {[
            {
              icon: Mail,
              label: 'Email',
              value: profile?.email || '-',
            },
            {
              icon: Phone,
              label: 'Nomor HP',
              value: profile?.phone_number || '-',
            },
            {
              icon: MapPin,
              label: 'Kecamatan',
              value: profile?.kecamatan ? `Kec. ${profile.kecamatan}` : '-',
            },
            {
              icon: Home,
              label: 'Alamat',
              value: profile?.address || '-',
            },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className={`flex items-start gap-3 px-4 py-3.5 ${
                i < arr.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <a
            href="/reports/history"
            className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-slate-700 flex-1">
              Riwayat Laporan
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </a>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-600 font-semibold py-3.5 rounded-2xl hover:bg-red-100 active:scale-[0.98] transition-all text-sm disabled:opacity-60"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? 'Keluar...' : 'Keluar dari Akun'}
        </button>
      </div>
    </div>
  )
}
