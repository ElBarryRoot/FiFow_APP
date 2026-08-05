import { cn } from '../../lib/utils.js'

export default function BoostTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'h-16 rounded-3xl border text-base font-black transition sm:text-lg',
            activeTab === tab.id ? 'border-fifow-primary bg-fifow-primary text-white shadow-float' : 'border-fifow-border bg-white text-fifow-dark shadow-card hover:border-violet-200',
          )}
        >
          {tab.label} <span className={cn('ml-2 rounded-full px-2 py-0.5 text-sm', activeTab === tab.id ? 'bg-white text-fifow-primary' : 'bg-slate-100 text-fifow-secondary')}>{tab.count}</span>
        </button>
      ))}
    </div>
  )
}
