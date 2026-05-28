'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  MapPin,
  ChevronRight,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/reports', icon: ClipboardList, label: 'Semua Laporan' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [waitingCount, setWaitingCount] = useState(0)

  useEffect(() => {
    async function fetchWaitingCount() {
      const supabase = createClient()
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting_verification')
      setWaitingCount(count || 0)
    }
    fetchWaitingCount()
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-none">
              Bangkalan
            </p>
            <p className="text-xs text-blue-600 font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-60 bg-white border-r border-slate-100 flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white h-full shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm">Menu</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header (Sesuai Screenshot User) */}
        {!pathname.includes('/admin/notifications') && (
          <div className="md:hidden bg-white sticky top-0 z-30 px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shadow-sm">
            <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-slate-50 rounded-xl transition-all">
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
            
            <span className="font-extrabold text-slate-800 text-[15px] tracking-tight">
              {pathname.includes('dashboard')
                ? 'Dashboard Admin'
                : pathname.includes('reports')
                ? 'Daftar Laporan'
                : 'Admin Panel'}
            </span>

            <div className="flex items-center gap-3">
              {/* Notification Bell with Dynamic Count */}
              <Link href="/admin/notifications" className="relative p-1.5 hover:bg-slate-50 rounded-xl transition-all">
                <Bell className="w-4.5 h-4.5 text-slate-800" />
                {waitingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white ring-2 ring-white">
                    {waitingCount}
                  </span>
                )}
              </Link>

              {/* Red Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-50 rounded-xl text-rose-500 transition-all"
                title="Keluar"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
        <main className={cn(pathname.includes('/admin/notifications') ? 'p-0' : 'p-4 md:p-6')}>
          {children}
        </main>
      </div>
    </div>
  )
}
