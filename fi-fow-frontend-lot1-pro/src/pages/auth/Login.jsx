import AuthLayout from '../../components/auth/AuthLayout.jsx'
import LoginForm from '../../components/auth/LoginForm.jsx'

export default function Login() {
  return (
    <AuthLayout title="Connexion" subtitle="Entrez votre email et votre mot de passe pour accéder à Fi Fow.">
      <LoginForm />
    </AuthLayout>
  )
}
