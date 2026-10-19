'use client'

import { useEffect } from 'react'
import { getWebApp } from '@/lib/telegram'

const APP_BACKGROUND = '#f2f7fa'

export function TelegramInit() {
  useEffect(() => {
    const webApp = getWebApp()
    if (!webApp) return

    webApp.ready()
    webApp.expand()
    try {
      // The app always uses its own light palette, so paint Telegram's chrome to match.
      webApp.setHeaderColor?.(APP_BACKGROUND)
      webApp.setBackgroundColor?.(APP_BACKGROUND)
    } catch {
      // Older Telegram clients do not support these methods.
    }
  }, [])

  return null
}
