'use client'

import { useState } from 'react'
import { CalendarRange, Check, ChevronRight, ListChecks, Loader2, Users, type LucideIcon } from 'lucide-react'
import { TEMPLATE_FILES, type TemplateType } from '@/lib/excel-templates-meta'
import { downloadFromUrl, haptic } from '@/lib/telegram'
import { Section } from '../section'

const TEMPLATES: { type: TemplateType; title: string; description: string; icon: LucideIcon }[] = [
  { type: 'staffing', title: 'Штатное расписание', description: 'Должности, оклады, ФОТ с формулами', icon: Users },
  { type: 'payment-calendar', title: 'Платёжный календарь', description: 'Поступления, выплаты и налоговые сроки', icon: CalendarRange },
  { type: 'month-close', title: 'Чек-лист закрытия месяца', description: '15 шагов со статусами и счетами', icon: ListChecks },
]

type Status = 'idle' | 'loading' | 'done' | 'error'

export function TemplatesList() {
  const [statuses, setStatuses] = useState<Partial<Record<TemplateType, Status>>>({})

  const generate = async (type: TemplateType) => {
    haptic.impact('light')
    setStatuses((s) => ({ ...s, [type]: 'loading' }))
    try {
      await downloadFromUrl(`/api/templates/${type}`, TEMPLATE_FILES[type])
      setStatuses((s) => ({ ...s, [type]: 'done' }))
      haptic.notify('success')
    } catch {
      setStatuses((s) => ({ ...s, [type]: 'error' }))
      haptic.notify('error')
    }
  }

  return (
    <Section title="Excel-шаблоны" footer="Файлы формируются с формулами и готовы к заполнению.">
      <ul className="divide-y divide-border">
        {TEMPLATES.map(({ type, title, description, icon: Icon }) => {
          const status = statuses[type] ?? 'idle'
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => generate(type)}
                disabled={status === 'loading'}
                className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sky/40 active:bg-sky"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky text-primary transition-transform group-hover:rotate-[-6deg] group-active:scale-90">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-bold">{title}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {status === 'error' ? 'Ошибка, попробуйте ещё раз' : description}
                  </span>
                </span>
                {status === 'loading' ? (
                  <Loader2 className="size-5 animate-spin text-primary" aria-label="Генерация" />
                ) : status === 'done' ? (
                  <span className="flex size-7 animate-in zoom-in items-center justify-center rounded-full bg-sun text-sun-foreground">
                    <Check className="size-4" strokeWidth={3} aria-label="Скачано" />
                  </span>
                ) : (
                  <ChevronRight
                    className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
