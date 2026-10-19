import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope, Unbounded } from 'next/font/google'
import Script from 'next/script'
import { TelegramInit } from '@/components/tma/telegram-init'
import './globals.css'

const manrope = Manrope({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], variable: '--font-manrope' })
const unbounded = Unbounded({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], weight: ['500', '600', '700'], variable: '--font-unbounded' })

export const metadata: Metadata = {
  title: 'Бухгалтер KZ — ИИ-помощник бухгалтера',
  description:
    'Telegram Mini App для бухгалтеров Казахстана: ИИ-ревизия ОСВ, калькулятор зарплаты и налогов 2026, Excel-шаблоны и база промптов.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: '#f2f7fa',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable} light bg-background`} suppressHydrationWarning>
      <body className="antialiased">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramInit />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
