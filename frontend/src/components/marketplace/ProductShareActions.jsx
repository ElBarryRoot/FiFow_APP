import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils.js'
import { FacebookIcon, TikTokIcon, WhatsAppIcon } from './ShareBrandIcon.jsx'

function shareText(title) {
  return `${title} sur Fi Fow`
}

function openExternal(url) {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup) popup.opener = null
}

async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('Clipboard unavailable')
}

export default function ProductShareActions({ title, onFeedback, className }) {
  const [copying, setCopying] = useState(false)

  const url = window.location.href
  const text = shareText(title)

  async function copyForTikTok() {
    try {
      setCopying(true)
      await copyToClipboard(url)
      onFeedback?.('Lien copié. Vous pouvez le publier sur TikTok.')
    } catch {
      onFeedback?.('Le lien ne peut pas être copié.', 'error')
    } finally {
      window.setTimeout(() => setCopying(false), 1_200)
    }
  }

  async function shareNatively() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await copyToClipboard(url)
      onFeedback?.('Lien copié.')
    } catch (error) {
      if (error?.name !== 'AbortError') onFeedback?.('Le partage ne peut pas être ouvert.', 'error')
    }
  }

  return (
    <div className={cn('flex shrink-0 items-center gap-1.5 sm:gap-2', className)} role="group" aria-label="Partager cette annonce">
      <ShareButton label="Partager sur Facebook" tone="facebook" onClick={() => openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}>
        <FacebookIcon />
      </ShareButton>
      <ShareButton label="Partager sur WhatsApp" tone="whatsapp" onClick={() => openExternal(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}>
        <WhatsAppIcon />
      </ShareButton>
      <ShareButton label="Copier le lien pour TikTok" tone="tiktok" onClick={copyForTikTok} pressed={copying}>
        <TikTokIcon />
      </ShareButton>
      <ShareButton label="Partager avec une autre application" tone="native" onClick={shareNatively}>
        <Share2 className="h-5 w-5" aria-hidden="true" />
      </ShareButton>
    </div>
  )
}

function ShareButton({ label, tone, pressed = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed || undefined}
      title={label}
      className={cn(
        'grid h-12 w-12 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifow-primary focus-visible:ring-offset-2 active:scale-95 sm:h-14 sm:w-14',
        tone === 'facebook' && 'border-[#1877f2] bg-[#1877f2] text-white hover:bg-[#166fe5]',
        tone === 'whatsapp' && 'border-[#25d366] bg-[#25d366] text-white hover:bg-[#20bd5b]',
        tone === 'tiktok' && 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
        tone === 'native' && 'border-fifow-primary bg-white text-fifow-primary hover:bg-fifow-lavender',
      )}
    >
      {children}
    </button>
  )
}
