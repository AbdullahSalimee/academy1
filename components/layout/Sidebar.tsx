'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Wallet, ClipboardList, BarChart3, BookOpen, Settings } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/students',   label: 'Students',   icon: Users },
  { href: '/fees',       label: 'Fees',       icon: Wallet },
  { href: '/tests',      label: 'Tests',      icon: ClipboardList },
  { href: '/results',    label: 'Results',    icon: BarChart3 },
  { href: '/classes',    label: 'Classes',    icon: BookOpen },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <span className="font-display font-bold text-white text-lg leading-tight">
          Academy<br />
          <span className="text-blue-400 text-sm font-normal">Management</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 px-3">Academy v1.0</div>
      </div>
    </aside>
  )
}
