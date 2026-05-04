import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CORTEX AI — Search & Reasoning Intelligence Platform',
  description: 'Visualizing how intelligent systems search, reason, decide and handle constraints.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-0">{children}</body>
    </html>
  )
}
