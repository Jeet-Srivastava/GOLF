import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Golf Heroes — Play Golf. Give Back. Win Big.',
  description:
    'A subscription platform that turns your golf scores into charity contributions and prize-winning chances. Every round becomes something meaningful.',
  keywords: ['golf', 'charity', 'prizes', 'stableford', 'draw', 'subscription'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      <body className="min-h-full flex flex-col relative text-white selection:bg-white/20 selection:text-white">
        <div className="bg-noise fixed pointer-events-none" />
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
