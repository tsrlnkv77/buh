type HapticImpact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type HapticNotification = 'error' | 'success' | 'warning'

export type TelegramWebApp = {
  platform: string
  version: string
  colorScheme: 'light' | 'dark'
  ready: () => void
  expand: () => void
  isVersionAtLeast: (version: string) => boolean
  onEvent: (event: string, cb: () => void) => void
  offEvent: (event: string, cb: () => void) => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  downloadFile?: (params: { url: string; file_name: string }, cb?: (accepted: boolean) => void) => void
  HapticFeedback?: {
    impactOccurred: (style: HapticImpact) => void
    notificationOccurred: (type: HapticNotification) => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp }
  }
}

/** Returns the WebApp object only when the page is actually opened inside Telegram. */
export function getWebApp(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined
  const webApp = window.Telegram?.WebApp
  if (!webApp || webApp.platform === 'unknown') return undefined
  return webApp
}

function supports(version: string) {
  const webApp = getWebApp()
  return webApp ? webApp.isVersionAtLeast(version) : false
}

export const haptic = {
  impact(style: HapticImpact = 'light') {
    if (supports('6.1')) getWebApp()?.HapticFeedback?.impactOccurred(style)
  },
  notify(type: HapticNotification) {
    if (supports('6.1')) getWebApp()?.HapticFeedback?.notificationOccurred(type)
  },
  select() {
    if (supports('6.1')) getWebApp()?.HapticFeedback?.selectionChanged()
  },
}

/**
 * Downloads a file from our API. Inside Telegram (Bot API 8.0+) uses the native
 * download dialog, because WebViews often ignore <a download>.
 */
export async function downloadFromUrl(path: string, fileName: string) {
  const webApp = getWebApp()
  const absoluteUrl = new URL(path, window.location.origin).href

  if (webApp?.downloadFile && supports('8.0')) {
    webApp.downloadFile({ url: absoluteUrl, file_name: fileName })
    return
  }

  const response = await fetch(absoluteUrl)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
