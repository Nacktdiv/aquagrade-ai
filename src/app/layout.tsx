// src/app/layout.tsx
import './globals.css';
import { Inter, Merriweather } from 'next/font/google';
import Link from 'next/link';
import { Fish, Camera, LayoutDashboard } from 'lucide-react';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merri' });

export const metadata: Metadata = {
  title: 'AquaGrade AI',
  description: 'Sistem Sortir Ikan Berbasis AI & Computer Vision',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body 
        suppressHydrationWarning 
        className={`${inter.variable} ${merriweather.variable} font-sans bg-gray-50 text-gray-900 min-h-screen flex flex-col`}
      >
        {/* Header Desktop & Mobile */}
        <header className="sticky top-0 z-50 bg-black text-white shadow-lg border-b border-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                <Fish size={24} className="text-white" />
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-white">
                AquaGrade <span className="text-orange-500">AI</span>
              </span>
            </Link>

            {/* Menu Navigasi Topbar */}
            <nav className="flex space-x-1 sm:space-x-4">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 hover:bg-gray-800 hover:text-orange-400 transition-colors"
              >
                <Camera size={18} />
                <span>Analisis</span>
              </Link>
              <Link 
                href="/dashboard" 
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 hover:bg-gray-800 hover:text-orange-400 transition-colors"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Konten Utama */}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs sm:text-sm text-gray-500">
          <div className="container mx-auto px-4">
            &copy; {new Date().getFullYear()} AquaGrade AI. Sistem Sortir Ikan Cerdas.
          </div>
        </footer>
      </body>
    </html>
  );
}