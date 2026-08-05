import { Link } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
        <section className="relative hidden overflow-hidden bg-[#ebe7ff] lg:block">
          <div className="absolute left-10 top-8 z-10"><Logo /></div>
          <img src="/assets/hero_guest.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-95" />
          <div className="absolute inset-x-10 bottom-10 rounded-lg bg-white/90 p-6 backdrop-blur-md">
            <p className="text-sm font-extrabold uppercase text-fifow-primary">Fi Fow Marketplace</p>
            <p className="mt-2 max-w-lg text-2xl font-black leading-tight text-fifow-dark">Achetez, vendez et échangez simplement avec votre communauté.</p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[480px]">
            <div className="mb-10 flex justify-center lg:hidden"><Logo /></div>
            <Link to="/" className="mb-7 hidden text-sm font-bold text-fifow-secondary transition hover:text-fifow-primary lg:inline-flex">Retour à la marketplace</Link>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-fifow-dark sm:text-4xl">{title}</h1>
              <p className="mt-3 text-base font-medium leading-7 text-fifow-secondary">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
