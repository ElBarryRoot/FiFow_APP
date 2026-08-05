export default function HumanSectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.18em] text-fifow-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-fifow-dark sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-fifow-secondary sm:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
