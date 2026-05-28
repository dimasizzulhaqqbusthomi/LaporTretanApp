'use client'

import { useState, useEffect } from 'react'
import { Bell, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Notification } from '@/lib/types'
import { useRouter } from 'next/navigation'

import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/(citizen)/reports/[id]/actions'

export default function AdminNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      setLoading(true)
      const res = await getAdminNotifications()
      if (active && res.success && res.data) {
        setNotifications(res.data as Notification[])
      }
      if (active) setLoading(false)
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [])

  async function markAsRead(id: string) {
    await markNotificationAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  async function markAllAsRead() {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  function formatNotifTime(dateStr: string) {
    const d = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const date = d.getDate()
    const month = months[d.getMonth()]
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${date} ${month}, ${hours}:${minutes}`
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      
      {/* 📱 Premium Mobile App Bar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between shadow-md">
        <Link
          href="/admin/dashboard"
          className="p-1 hover:bg-white/10 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        <span className="font-extrabold text-white text-[15px] tracking-tight">
          Notifikasi Admin
        </span>

        {unreadCount > 0 ? (
          <button
            onClick={markAllAsRead}
            className="text-xs font-black text-blue-200 hover:text-white transition-colors"
          >
            Tandai Semua
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* 🔔 Notification Feed List */}
      <div className="px-4 py-4 max-w-md mx-auto">
        {loading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-24 animate-pulse border border-slate-100 shadow-sm" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3.5">
            {notifications.map((notif) => {
              const isUnread = !notif.is_read

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (isUnread) markAsRead(notif.id)
                    if (notif.report_id) {
                      // Redirect to dynamic admin report detail
                      router.push(`/admin/reports/${notif.report_id}`)
                    }
                  }}
                  className={`border transition-all duration-200 p-4 rounded-3xl shadow-sm flex items-start gap-3.5 relative cursor-pointer hover:shadow-md hover:scale-[1.005] ${
                    isUnread
                      ? 'bg-blue-50/70 border-blue-150/40'
                      : 'bg-white border-slate-100/80'
                  }`}
                >
                  {/* Left Bell Icon Container (Sesuai Mockup) */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isUnread
                        ? 'bg-blue-100/50 border border-blue-150/20'
                        : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <Bell
                      className={`w-5 h-5 ${
                        isUnread ? 'text-blue-600 fill-blue-500/20' : 'text-slate-400'
                      }`}
                    />
                  </div>

                  {/* Right Content Column */}
                  <div className="flex-1 min-w-0 pr-3">
                    <h4
                      className={`text-sm font-black tracking-tight leading-snug ${
                        isUnread ? 'text-slate-800' : 'text-slate-700/90'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    
                    <p
                      className={`text-[11px] leading-relaxed mt-1 ${
                        isUnread ? 'text-slate-700 font-semibold' : 'text-slate-500 font-medium'
                      }`}
                    >
                      {notif.message}
                    </p>
                    
                    <p
                      className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${
                        isUnread ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {formatNotifTime(notif.created_at)}
                    </p>
                  </div>

                  {/* Blue Bullet Unread Indicator (Sesuai Mockup) */}
                  {isUnread && (
                    <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-blue-600 shadow-sm animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-350" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-1 tracking-tight">
              Belum Ada Notifikasi Masuk
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
              Notifikasi tentang penyerahan bukti baru dan aktivitas warga akan muncul di sini.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
