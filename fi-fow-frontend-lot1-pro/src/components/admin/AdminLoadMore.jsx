import Button from '../ui/Button.jsx'

export default function AdminLoadMore({ hasNextPage, loading, onClick }) {
  if (!hasNextPage) return null
  return (
    <div className="mt-4 flex justify-center">
      <Button type="button" variant="secondary" loading={loading} onClick={onClick}>Charger plus</Button>
    </div>
  )
}

