import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CORTEX AI — Search & Reasoning Intelligence Platform',
  description: 'Interactive AI Intelligence Platform for Search, Reasoning, Decision and Constraint Analysis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#050505] font-sans antialiased text-white">
        {children}
      </body>
    </html>
  )
}
