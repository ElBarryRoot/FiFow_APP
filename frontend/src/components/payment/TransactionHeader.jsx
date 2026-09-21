import { useNavigate } from 'react-router-dom'
import AppHeader from '../layout/AppHeader.jsx'

export default function TransactionHeader({ title, secure = true, backTo }) {
  const navigate = useNavigate()
  return (
    <AppHeader
      showBack
      title={title}
      onBack={() => backTo ? navigate(backTo) : navigate(-1)}
      showSearch={false}
      mobileSearch={false}
      showPublish={!secure}
    />
  )
}
