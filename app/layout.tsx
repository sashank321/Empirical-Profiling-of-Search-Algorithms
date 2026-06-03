import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CORTEX AI — Search & Reasoning Intelligence Platform',
  description: 'Visualizing how intelligent systems search, reason, decide and handle constraints.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-0 font-sans antialiased text-white noise-bg">
        {children}
      </body>
    </html>
  )
}
