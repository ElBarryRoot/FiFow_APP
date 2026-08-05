import Card from '../ui/Card.jsx'

export default function ReviewTextarea({ value, onChange, maxLength = 500 }) {
  return (
    <div>
      <label className="text-lg font-black text-fifow-dark">Votre commentaire <span className="font-semibold text-fifow-secondary">(optionnel)</span></label>
      <Card className="mt-3 p-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
          placeholder="Partagez les détails de votre expérience..."
          className="min-h-28 w-full resize-none border-0 bg-transparent text-base font-semibold text-fifow-dark outline-none placeholder:text-fifow-muted"
        />
        <p className="text-right text-sm font-bold text-fifow-secondary">{value.length}/{maxLength}</p>
      </Card>
    </div>
  )
}
