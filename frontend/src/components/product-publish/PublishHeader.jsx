import { useNavigate } from 'react-router-dom'
import AppHeader from '../layout/AppHeader.jsx'

export default function PublishHeader({ title = 'Publier une annonce', backTo = '/profile/listings' }) {
  const navigate = useNavigate()
  return <AppHeader showBack title={title} onBack={() => navigate(backTo)} showSearch={false} mobileSearch={false} showPublish={false} />
}

