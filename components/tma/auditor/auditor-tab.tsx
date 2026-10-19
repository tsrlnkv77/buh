'use client'

import { useId, useRef, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, Loader2, ShieldAlert, Sparkles, Upload, X } from 'lucide-react'
import { analyzeOsvFile, SAMPLE_RESULT, type AnalysisResult, type Severity } from '@/lib/analyze-osv'
import { downloadFromUrl, haptic } from '@/lib/telegram'
import { cn } from '@/lib/utils'
import { PrimaryButton, Section, TabHero } from '../section'
import { FindingCard, SEVERITY_META } from './finding-card'

const MAX_SIZE = 10 * 1024 * 1024

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} КБ` : `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

export function AuditorTab() {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult>(SAMPLE_RESULT)

  const selectFile = (candidate: File | undefined) => {
    setError(null)
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.xlsx')) {
      setError('Поддерживаются только файлы .xlsx')
      haptic.notify('error')
      return
    }
    if (candidate.size > MAX_SIZE) {
      setError('Файл больше 10 МБ')
      haptic.notify('error')
      return
    }
    haptic.impact('light')
    setFile(candidate)
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const runAnalysis = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)
    haptic.impact('medium')
    try {
      const [analysis] = await Promise.all([analyzeOsvFile(file), new Promise((r) => setTimeout(r, 900))])
      if (analysis.accountsFound === 0) {
        setError('Не удалось найти счета (4-значные коды) в первой колонке. Проверьте структуру ОСВ.')
        haptic.notify('warning')
        return
      }
      setResult(analysis)
      haptic.notify(analysis.findings.length > 0 ? 'warning' : 'success')
      document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setError('Не удалось прочитать файл. Убедитесь, что это корректный .xlsx.')
      haptic.notify('error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const counts = result.findings.reduce<Record<Severity, number>>(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }),
    { critical: 0, warning: 0, info: 0 },
  )

  return (
    <div className="stagger flex flex-col gap-5">
      <TabHero
        eyebrow="ИИ-Ревизор"
        title="Найдём ошибки в ОСВ за секунды"
        description="Загрузите оборотно-сальдовую ведомость — проверим сальдо, подотчёт и расчёты."
        image="/illustrations/auditor.png"
      />

      <div role="note" className="flex gap-3 rounded-3xl bg-sun/20 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sun text-sun-foreground">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold">Конфиденциальность</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Загружайте только обезличенные данные без БИН, ИИН и ФИО. Файл обрабатывается локально на вашем устройстве.
          </p>
        </div>
      </div>

      <Section title="Файл отчёта">
        {file ? (
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky text-primary">
              <FileSpreadsheet className="size-6" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-base font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatSize(file.size)} · готов к анализу</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background"
              aria-label="Удалить файл"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              selectFile(e.dataTransfer.files[0])
            }}
            className={cn(
              'group m-2 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors',
              isDragging ? 'border-primary bg-sky' : 'border-primary/25 hover:border-primary/50 hover:bg-sky/50',
            )}
          >
            <span className="flex size-13 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float transition-transform group-hover:-translate-y-0.5 group-active:scale-95">
              <Upload className="size-6" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold">Выберите файл ОСВ</span>
              <span className="text-sm text-muted-foreground">Формат .xlsx, до 10 МБ</span>
            </span>
          </label>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => selectFile(e.target.files?.[0])}
        />
      </Section>

      <div className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="px-1 text-sm text-destructive">
            {error}
          </p>
        )}
        <PrimaryButton onClick={runAnalysis} disabled={!file || isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Анализирую…
            </>
          ) : (
            <>
              <Sparkles className="size-5" aria-hidden="true" />
              Запустить экспресс-анализ
            </>
          )}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => downloadFromUrl('/api/templates/demo-osv', 'Демо_ОСВ_для_анализа.xlsx')}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary"
        >
          <Download className="size-4" aria-hidden="true" />
          Нет файла? Скачать демо-ОСВ для теста
        </button>
      </div>

      <section id="analysis-results" aria-live="polite" className="flex scroll-mt-24 flex-col gap-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <div className="flex flex-col">
            <h2 className="font-heading text-lg font-semibold">
              {result.isSample ? 'Пример результата' : 'Результаты анализа'}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {result.fileName} · {result.accountsFound} счетов
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SEVERITY_META) as Severity[]).map((severity) => {
            const Icon = SEVERITY_META[severity].icon
            return (
              <div key={severity} className="flex flex-col gap-1 rounded-2xl bg-card p-3 shadow-soft">
                <span className={cn('flex size-7 items-center justify-center rounded-lg', SEVERITY_META[severity].chip)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="font-heading text-2xl font-semibold tabular-nums">{counts[severity]}</span>
                <span className="text-xs font-medium text-muted-foreground">{SEVERITY_META[severity].label}</span>
              </div>
            )
          })}
        </div>

        {result.findings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-6 text-center shadow-soft">
            <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
            <p className="text-base font-semibold">Аномалий не найдено</p>
            <p className="text-sm text-muted-foreground">Базовые проверки пройдены успешно.</p>
          </div>
        ) : (
          result.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
        )}
      </section>
    </div>
  )
}
