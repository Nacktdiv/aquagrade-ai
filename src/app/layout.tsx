// src/app/layout.tsx
import './globals.css'
import { Inter, Merriweather } from 'next/font/google'
import Link from 'next/link'
import { Fish } from 'lucide-react'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merri' })

export const metadata: Metadata = {
  title: 'AquaGrade AI',
  description: 'Sistem Sortir Ikan Berbasis AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${merriweather.variable} font-sans bg-white text-gray-900 min-h-screen flex flex-col`}>
        {/* Navbar */}
        <nav className="bg-black text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-orange-500 font-bold text-xl">
              <Fish size={28} />
              <span>AquaGrade AI</span>
            </Link>
            <div className="space-x-6 font-medium">
              <Link href="/" className="hover:text-orange-400 transition-colors">Analisis</Link>
              <Link href="/dashboard" className="hover:text-orange-400 transition-colors">Dashboard</Link>
            </div>
          </div>
        </nav>

        {/* Konten Utama */}
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 text-center p-4 text-sm text-gray-500 border-t border-gray-200">
          &copy; {new Date().getFullYear()} AquaGrade AI. MVP Product.
        </footer>
      </body>
    </html>
  )
}