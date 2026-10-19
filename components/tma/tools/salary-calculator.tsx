'use client'

import { useId, useState } from 'react'
import { calculatePayroll, formatTenge, MRP_2026, MZP_2026, type PayrollLine } from '@/lib/payroll'
import { haptic } from '@/lib/telegram'
import { cn } from '@/lib/utils'
import { Section } from '../section'

const PRESETS = [
  { label: 'МЗП', value: MZP_2026 },
  { label: '250 000', value: 250_000 },
  { label: '500 000', value: 500_000 },
  { label: '1 000 000', value: 1_000_000 },
]

const numberFormat = new Intl.NumberFormat('ru-RU')

function LineRow({ line }: { line: PayrollLine }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 text-base font-bold">
          {line.shortLabel}
          <span className="rounded-full bg-sky px-2 py-0.5 text-xs font-bold text-secondary-foreground">{line.rate}</span>
        </span>
        <span className="truncate text-sm text-muted-foreground">{line.label}</span>
      </div>
      <span className="shrink-0 text-base font-semibold tabular-nums">{formatTenge(line.amount)}</span>
    </li>
  )
}

export function SalaryCalculator() {
  const inputId = useId()
  const [rawSalary, setRawSalary] = useState('350000')
  const [applyDeduction, setApplyDeduction] = useState(true)

  const salary = Number(rawSalary) || 0
  const result = calculatePayroll(salary, { applyDeduction })

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Калькулятор зарплаты 2026"
        footer={`МРП ${numberFormat.format(MRP_2026)} тг · МЗП ${numberFormat.format(MZP_2026)} тг. Расчёт для резидента РК по трудовому договору.`}
      >
        <div className="flex flex-col gap-3 p-4">
          <label htmlFor={inputId} className="text-sm text-muted-foreground">
            Оклад (начислено), тг
          </label>
          <input
            id={inputId}
            inputMode="numeric"
            autoComplete="off"
            value={rawSalary ? numberFormat.format(Number(rawSalary)) : ''}
            onChange={(e) => setRawSalary(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="0"
            className="w-full bg-transparent font-heading text-3xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50"
          />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  haptic.select()
                  setRawSalary(String(preset.value))
                }}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-bold transition-[colors,transform] active:scale-95',
                  salary === preset.value ? 'bg-sun text-sun-foreground' : 'bg-sky text-secondary-foreground',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <div className="flex flex-col">
            <span className="text-base font-medium">Базовый вычет 30 МРП</span>
            <span className="text-sm text-muted-foreground">
              {numberFormat.format(30 * MRP_2026)} тг при наличии заявления
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={applyDeduction}
            aria-label="Применять базовый вычет"
            onClick={() => {
              haptic.select()
              setApplyDeduction((v) => !v)
            }}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              applyDeduction ? 'bg-primary' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'absolute left-0.5 top-0.5 size-6 rounded-full bg-card shadow-sm transition-transform',
                applyDeduction && 'translate-x-5',
              )}
            />
          </button>
        </div>
      </Section>

      <div className="flex flex-col gap-3 rounded-3xl bg-primary p-5 text-primary-foreground shadow-float">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium opacity-85">Сотрудник получит на руки</span>
          <span key={result.net} className="animate-in fade-in zoom-in-95 font-heading text-3xl font-semibold tabular-nums duration-300">
            {formatTenge(result.net)}
          </span>
        </div>
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-primary-foreground/20"
          role="img"
          aria-label={`На руки ${Math.round(salary ? (result.net / result.totalCost) * 100 : 0)}% от расходов работодателя`}
        >
          <span
            className="h-full rounded-full bg-sun transition-[width] duration-500"
            style={{ width: `${result.totalCost ? (result.net / result.totalCost) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm opacity-90">
          Расходы работодателя всего: <span className="font-bold tabular-nums">{formatTenge(result.totalCost)}</span>
        </span>
      </div>

      <Section title="Удерживается из зарплаты">
        <ul className="divide-y divide-border">
          {result.employeeLines.map((line) => (
            <LineRow key={line.key} line={line} />
          ))}
          <li className="flex items-center justify-between px-4 py-3">
            <span className="text-base font-semibold">Итого удержания</span>
            <span className="text-base font-bold tabular-nums">{formatTenge(result.employeeTotal)}</span>
          </li>
        </ul>
      </Section>

      <Section
        title="За счёт работодателя"
        footer="Ставки и лимиты вынесены в lib/payroll.ts. Перед сдачей отчётности сверяйте расчёт с актуальной редакцией НК РК."
      >
        <ul className="divide-y divide-border">
          {result.employerLines.map((line) => (
            <LineRow key={line.key} line={line} />
          ))}
          <li className="flex items-center justify-between px-4 py-3">
            <span className="text-base font-semibold">Итого отчисления</span>
            <span className="text-base font-bold tabular-nums">{formatTenge(result.employerTotal)}</span>
          </li>
        </ul>
      </Section>
    </div>
  )
}
