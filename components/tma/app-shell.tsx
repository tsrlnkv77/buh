'use client'

import { useState, useSyncExternalStore } from 'react'
import { BookOpenText, Calculator, ScanSearch, type LucideIcon } from 'lucide-react'
import { getWebApp, haptic } from '@/lib/telegram'
import { AuditorTab } from './auditor/auditor-tab'
import { ToolsTab } from './tools/tools-tab'
import { KnowledgeTab } from './knowledge/knowledge-tab'
import { BottomNav } from './bottom-nav'

export type TabId = 'auditor' | 'tools' | 'knowledge'

export type TabConfig = {
  id: TabId
  label: string
  icon: LucideIcon
}

const TABS: TabConfig[] = [
  { id: 'auditor', label: 'ИИ-Ревизор', icon: ScanSearch },
  { id: 'tools', label: 'Инструменты', icon: Calculator },
  { id: 'knowledge', label: 'База знаний', icon: BookOpenText },
]

const noopSubscribe = () => () => {}

function useTelegramFirstName() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (getWebApp() as { initDataUnsafe?: { user?: { first_name?: string } } } | undefined)?.initDataUnsafe?.user?.first_name ?? null,
    () => null,
  )
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('auditor')
  const firstName = useTelegramFirstName()

  const handleChange = (id: TabId) => {
    if (id === activeTab) return
    haptic.select()
    setActiveTab(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/85 px-4 pb-3 pt-4 backdrop-blur-xl">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-xs font-bold text-primary-foreground shadow-float">
          KZ
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs font-medium text-muted-foreground">Добрый день{firstName ? `, ${firstName}` : ''}!</p>
          <p className="truncate font-heading text-base font-semibold">Бухгалтер KZ</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-soft">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sun opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-sun" />
          </span>
          НК РК 2026
        </span>
      </header>

      <main className="flex-1 px-4 pb-32 pt-2">
        <div hidden={activeTab !== 'auditor'}>
          <AuditorTab />
        </div>
        <div hidden={activeTab !== 'tools'}>
          <ToolsTab />
        </div>
        <div hidden={activeTab !== 'knowledge'}>
          <KnowledgeTab />
        </div>
      </main>

      <BottomNav tabs={TABS} activeTab={activeTab} onChange={handleChange} />
    </div>
  )
}
