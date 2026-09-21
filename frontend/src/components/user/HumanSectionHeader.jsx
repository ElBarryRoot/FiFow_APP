export default function HumanSectionHeader({ eyebrow, title, description, action, compact = false }) {
  return (
    <div className={`${compact ? 'mb-3' : 'mb-4'} flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`}>
      <div>
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className={compact ? 'mt-1 text-sm font-extrabold text-fifow-dark' : 'mt-1 text-xl font-extrabold text-fifow-dark sm:text-[1.375rem]'}>{title}</h2> : null}
        {description ? <p className={`max-w-2xl text-sm font-medium leading-6 text-fifow-secondary ${title || eyebrow ? 'mt-1' : ''}`}>{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
