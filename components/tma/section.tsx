import { cn } from '@/lib/utils'

type SectionProps = {
  title?: string
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Section({ title, footer, className, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-2.5">
      {title && <h2 className="px-1 font-heading text-sm font-semibold text-foreground">{title}</h2>}
      <div className={cn('overflow-hidden rounded-3xl bg-card text-card-foreground shadow-soft', className)}>
        {children}
      </div>
      {footer && <div className="px-1 text-xs leading-relaxed text-muted-foreground">{footer}</div>}
    </section>
  )
}

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'tinted' | 'sun'
}

export function PrimaryButton({ className, variant = 'primary', ...props }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold transition-[opacity,transform,background-color,box-shadow] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-float hover:brightness-105',
        variant === 'tinted' && 'bg-sky text-secondary-foreground hover:bg-sky/70',
        variant === 'sun' && 'bg-sun text-sun-foreground',
        className,
      )}
      {...props}
    />
  )
}

type TabHeroProps = {
  eyebrow: string
  title: string
  description: string
  image: string
}

export function TabHero({ eyebrow, title, description, image }: TabHeroProps) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-sky p-5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="w-fit rounded-full bg-card px-2.5 py-1 text-xs font-bold text-primary">{eyebrow}</span>
        <h2 className="font-heading text-lg font-semibold leading-tight text-balance">{title}</h2>
        <p className="text-sm leading-relaxed text-foreground/70 text-pretty">{description}</p>
      </div>
      <div className="animate-float flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card shadow-float">
        <img src={image || '/placeholder.svg'} alt="" aria-hidden="true" className="size-full scale-125 object-cover" />
      </div>
    </div>
  )
}
