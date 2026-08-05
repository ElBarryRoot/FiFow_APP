import { Check } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const steps = [
  { label: 'Détails', description: 'Décrivez votre article' },
  { label: 'Photos', description: 'Ajoutez des images nettes' },
  { label: 'Prix et remise', description: 'Fixez vos conditions' },
  { label: 'Aperçu', description: 'Vérifiez puis publiez' },
]

export default function PublishStepper({ currentStep, maxStep = currentStep, onStepClick, orientation = 'horizontal' }) {
  if (orientation === 'vertical') {
    return (
      <nav aria-label="Étapes de publication">
        <p className="mb-5 text-xs font-extrabold uppercase text-fifow-muted">Votre progression</p>
        <ol className="space-y-1">
          {steps.map(({ label, description }, index) => {
            const step = index + 1
            const isDone = currentStep > step
            const isActive = currentStep === step
            const isAvailable = step <= maxStep

            return (
              <li key={label} className="relative">
                {step < steps.length ? (
                  <span className={cn('absolute left-[17px] top-10 h-[calc(100%-24px)] w-px', isDone ? 'bg-fifow-primary' : 'bg-fifow-border')} />
                ) : null}
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onStepClick?.(step)}
                  className={cn(
                    'relative flex w-full items-start gap-3 rounded-lg px-1 py-3 text-left transition',
                    isActive ? 'bg-fifow-lavender px-3' : 'hover:bg-white',
                    !isAvailable && 'cursor-not-allowed opacity-55',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className={cn(
                    'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-extrabold',
                    isDone || isActive
                      ? 'border-fifow-primary bg-fifow-primary text-white'
                      : 'border-fifow-border bg-white text-fifow-secondary',
                  )}>
                    {isDone ? <Check className="h-4 w-4" /> : step}
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className={cn('block text-sm font-extrabold', isActive ? 'text-fifow-primary' : 'text-fifow-dark')}>{label}</span>
                    <span className="mt-0.5 block text-xs font-medium leading-5 text-fifow-secondary">{description}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  return (
    <div className="premium-scrollbar overflow-x-auto px-1 py-2">
      <ol className="flex min-w-[620px] items-start justify-between gap-2 md:min-w-0">
        {steps.map(({ label }, index) => {
          const step = index + 1
          const isDone = currentStep > step
          const isActive = currentStep === step
          const isAvailable = step <= maxStep
          return (
            <li key={label} className="flex flex-1 items-start">
              <button type="button" disabled={!isAvailable} onClick={() => onStepClick?.(step)} className="group flex flex-col items-center gap-2 outline-none disabled:cursor-not-allowed disabled:opacity-55">
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full border text-sm font-extrabold transition-all',
                    isDone || isActive
                      ? 'border-fifow-primary bg-fifow-primary text-white'
                      : 'border-fifow-border bg-white text-fifow-secondary',
                  )}
                >
                  {isDone ? <Check className="h-5 w-5" /> : step}
                </span>
                <span className={cn('text-sm font-extrabold', isActive ? 'text-fifow-primary' : 'text-fifow-secondary')}>
                  {label}
                </span>
              </button>
              {step < steps.length ? (
                <span className={cn('mx-3 mt-5 h-[2px] flex-1 rounded-full', currentStep > step ? 'bg-fifow-primary' : 'bg-fifow-border')} />
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
