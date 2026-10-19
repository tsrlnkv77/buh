'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { PROMPT_CATEGORIES, PROMPTS, type PromptCategory } from '@/lib/prompts'
import { haptic } from '@/lib/telegram'
import { cn } from '@/lib/utils'
import { TabHero } from '../section'
import { PromptCardItem } from './prompt-card'

export function KnowledgeTab() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PromptCategory | 'all'>('all')

  const normalized = query.trim().toLowerCase()
  const visible = PROMPTS.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (!normalized || `${p.title} ${p.description}`.toLowerCase().includes(normalized)),
  )

  const chips: (PromptCategory | 'all')[] = ['all', ...PROMPT_CATEGORIES]

  return (
    <div className="stagger flex flex-col gap-4">
      <TabHero
        eyebrow="База знаний"
        title="Промпты, которые экономят часы"
        description="Проверенные запросы к ИИ для ОСВ, ФНО и закрытия месяца."
        image="/illustrations/knowledge.png"
      />

      <label className="flex h-12 items-center gap-2 rounded-2xl bg-card px-4 shadow-soft transition-shadow focus-within:ring-2 focus-within:ring-primary/40">
        <Search className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Поиск промптов</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск промптов"
          className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Категории">
        {chips.map((chip) => {
          const active = category === chip
          return (
            <button
              key={chip}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                haptic.select()
                setCategory(chip)
              }}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-[colors,transform] active:scale-95',
                active ? 'bg-primary text-primary-foreground shadow-float' : 'bg-card text-foreground shadow-soft',
              )}
            >
              {chip === 'all' ? 'Все' : chip}
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Ничего не найдено</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((prompt) => (
            <li key={prompt.id}>
              <PromptCardItem prompt={prompt} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
