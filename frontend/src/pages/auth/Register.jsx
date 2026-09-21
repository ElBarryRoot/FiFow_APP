import AuthLayout from '../../components/auth/AuthLayout.jsx'
import RegisterForm from '../../components/auth/RegisterForm.jsx'

export default function Register() {
  return (
    <AuthLayout visual="seller" title="Inscription" subtitle="Créez votre compte pour acheter, vendre et discuter en toute confiance.">
      <RegisterForm />
    </AuthLayout>
  )
}
