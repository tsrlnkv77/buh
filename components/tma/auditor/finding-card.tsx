import { AlertOctagon, AlertTriangle, Info, Lightbulb } from 'lucide-react'
import type { Finding, Severity } from '@/lib/analyze-osv'
import { cn } from '@/lib/utils'

export const SEVERITY_META: Record<Severity, { label: string; icon: typeof Info; tone: string; chip: string }> = {
  critical: { label: 'Критично', icon: AlertOctagon, tone: 'text-destructive', chip: 'bg-destructive/12 text-destructive' },
  warning: { label: 'Внимание', icon: AlertTriangle, tone: 'text-warning', chip: 'bg-sun/25 text-warning' },
  info: { label: 'Инфо', icon: Info, tone: 'text-primary', chip: 'bg-sky text-primary' },
}

export function FindingCard({ finding }: { finding: Finding }) {
  const meta = SEVERITY_META[finding.severity]
  const Icon = meta.icon

  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', meta.chip)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', meta.chip)}>{meta.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {finding.account}
            </span>
          </div>
          <h3 className="text-base font-bold leading-snug text-pretty">{finding.title}</h3>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground/80">{finding.description}</p>
      <div className="flex gap-2.5 rounded-2xl bg-sky p-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-secondary-foreground">{finding.recommendation}</p>
      </div>
    </article>
  )
}
