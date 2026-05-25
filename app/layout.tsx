import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata: Metadata = {
  title: 'Academy Management System',
  description: 'Student records, fees, and test results',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sora.variable} font-sans bg-slate-50 text-slate-900`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
