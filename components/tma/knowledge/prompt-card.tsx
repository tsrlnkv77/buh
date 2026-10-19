'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import type { PromptCard } from '@/lib/prompts'
import { haptic } from '@/lib/telegram'
import { cn } from '@/lib/utils'
import { PrimaryButton } from '../section'

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Some Telegram WebViews block the Clipboard API — fall back to execCommand.
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  }
}

export function PromptCardItem({ prompt }: { prompt: PromptCard }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleCopy = async () => {
    const ok = await copyText(prompt.prompt)
    haptic.notify(ok ? 'success' : 'error')
    if (!ok) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-1.5">
        <span className="w-fit rounded-full bg-sky px-2.5 py-1 text-xs font-bold text-secondary-foreground">
          {prompt.category}
        </span>
        <h3 className="text-base font-bold leading-snug text-pretty">{prompt.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{prompt.description}</p>
      </div>

      <div className="rounded-2xl bg-muted p-3">
        <p
          className={cn(
            'whitespace-pre-line font-mono text-sm leading-relaxed text-foreground/85',
            !expanded && 'line-clamp-3',
          )}
        >
          {prompt.prompt}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          {expanded ? 'Свернуть' : 'Показать полностью'}
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>

      <PrimaryButton variant={copied ? 'sun' : 'tinted'} onClick={handleCopy} className="h-11 text-sm">
        {copied ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            Скопировано
          </>
        ) : (
          <>
            <Copy className="size-4" aria-hidden="true" />
            Скопировать промпт
          </>
        )}
      </PrimaryButton>
    </article>
  )
}
