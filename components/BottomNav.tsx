'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Plus, ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Beranda' },
  { href: '/reports/public', icon: Map, label: 'Peta' },
  { href: '/reports/create', icon: Plus, label: 'Lapor', isPrimary: true },
  { href: '/reports/history', icon: ClipboardList, label: 'Riwayat' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-300">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-blue-600 mt-1">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors',
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5',
                  isActive && 'fill-blue-100 stroke-blue-600'
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
