'use client'

import { cn } from '@/lib/utils'
import type { TabConfig, TabId } from './app-shell'

type BottomNavProps = {
  tabs: TabConfig[]
  activeTab: TabId
  onChange: (id: TabId) => void
}

export function BottomNav({ tabs, activeTab, onChange }: BottomNavProps) {
  const activeIndex = tabs.findIndex((t) => t.id === activeTab)

  return (
    <nav
      aria-label="Основная навигация"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--tg-safe-area-inset-bottom, 0px), 12px)' }}
    >
      <ul className="pointer-events-auto relative mx-auto grid max-w-md grid-cols-3 rounded-3xl bg-card/95 p-1.5 shadow-float backdrop-blur-xl">
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 rounded-2xl bg-primary transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{ width: 'calc((100% - 0.75rem) / 3)', transform: `translateX(${activeIndex * 100}%)` }}
        />
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeTab
          return (
            <li key={id} className="relative">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold transition-colors duration-300',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  className={cn('size-5 transition-transform duration-300', isActive && 'scale-110')}
                  strokeWidth={isActive ? 2.4 : 2}
                  aria-hidden="true"
                />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
