import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const tones = {
  success: 'border-emerald-100 bg-white text-fifow-dark [&_svg]:text-fifow-green',
  error: 'border-red-100 bg-white text-fifow-dark [&_svg]:text-fifow-red',
  info: 'border-fifow-border bg-white text-fifow-dark [&_svg]:text-fifow-primary',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, options = {}) => {
    const id = ++counter.current
    const type = options.type ?? 'success'
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), options.duration ?? 2800)
  }, [dismiss])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] ?? CheckCircle2
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-soft motion-safe:animate-[toast-in_0.25s_ease-out] ${tones[toast.type] ?? tones.success}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <p className="text-sm font-bold leading-5">{toast.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToast = useContext(ToastContext)
  if (!showToast) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return showToast
}
