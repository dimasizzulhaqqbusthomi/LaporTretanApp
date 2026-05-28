'use client'

import { useState, useEffect } from 'react'
import { Bell, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function OfficerNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (active) router.push('/login')
        return
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (active) {
        setNotifications(data || [])
        setLoading(false)
      }
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [])

  async function markAsRead(id: string) {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  async function markAllAsRead() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  async function handleNotificationClick(notif: Notification) {
    const isUnread = !notif.is_read
    if (isUnread) {
      await markAsRead(notif.id)
    }

    if (notif.report_id) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Dynamic check for officer task ID associated with this report
      const { data: task } = await supabase
        .from('officer_tasks')
        .select('id')
        .eq('report_id', notif.report_id)
        .eq('officer_id', user.id)
        .maybeSingle()

      if (task) {
        router.push(`/officer/tasks/${task.id}`)
      } else {
        router.push('/officer/tasks')
      }
    }
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
      <div className="sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md">
        <Link
          href="/officer/dashboard"
          className="p-1 hover:bg-white/10 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        <span className="font-extrabold text-white text-[15px] tracking-tight">
          Notifikasi
        </span>

        {unreadCount > 0 ? (
          <button
            onClick={markAllAsRead}
            className="text-xs font-black text-green-200 hover:text-white transition-colors"
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
              <div key={i} className="bg-white rounded-3xl h-24 animate-pulse border border-slate-100/80 shadow-sm" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3.5">
            {notifications.map((notif) => {
              const isUnread = !notif.is_read

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`border transition-all duration-200 p-4 rounded-3xl shadow-sm flex items-start gap-3.5 relative cursor-pointer hover:shadow-md hover:scale-[1.005] ${
                    isUnread
                      ? 'bg-green-50/20 border-green-150/20'
                      : 'bg-white border-slate-100/80'
                  }`}
                >
                  {/* Left Bell Icon Container (Sesuai Mockup) */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isUnread
                        ? 'bg-green-100/40 border border-green-150/10'
                        : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <Bell
                      className={`w-5 h-5 ${
                        isUnread ? 'text-green-600 fill-green-500/20' : 'text-slate-400'
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
                        isUnread ? 'text-green-600' : 'text-slate-400'
                      }`}
                    >
                      {formatNotifTime(notif.created_at)}
                    </p>
                  </div>

                  {/* Green Bullet Unread Indicator */}
                  {isUnread && (
                    <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-green-600 shadow-sm animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-355" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-1 tracking-tight">
              Belum Ada Notifikasi
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
              Notifikasi tentang tugas baru lapangan Anda akan muncul di sini.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
