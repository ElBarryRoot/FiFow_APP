export default function ReviewTextarea({ value, onChange, maxLength = 1000, error }) {
  return (
    <div>
      <label htmlFor="review-comment" className="text-base font-black text-fifow-dark">Votre commentaire</label>
      <textarea id="review-comment" value={value} onChange={(event) => onChange(event.target.value.slice(0, maxLength))} placeholder="Décrivez la communication, l’état du produit et la remise…" minLength={3} maxLength={maxLength} required aria-invalid={Boolean(error)} aria-describedby={error ? 'review-comment-error' : 'review-comment-count'} className="mt-3 min-h-32 w-full resize-none rounded-lg border border-fifow-border bg-white p-4 text-base font-semibold text-fifow-dark outline-none placeholder:text-fifow-muted focus:border-fifow-primary focus:ring-4 focus:ring-violet-100" />
      <div className="mt-1 flex justify-between gap-3 text-xs font-bold"><span id="review-comment-error" className="text-fifow-red">{error}</span><span id="review-comment-count" className="ml-auto text-fifow-muted">{value.length}/{maxLength}</span></div>
    </div>
  )
}
