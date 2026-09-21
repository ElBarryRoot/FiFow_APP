import { Check, Link2, Share2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/utils.js'
import { FacebookIcon, TikTokIcon, WhatsAppIcon } from './ShareBrandIcon.jsx'

const channels = [
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon, className: 'border-[#1877f2] bg-[#1877f2] text-white hover:bg-[#166fe5]' },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon, className: 'border-[#25d366] bg-[#25d366] text-white hover:bg-[#20bd5b]' },
  { id: 'tiktok', label: 'TikTok', Icon: TikTokIcon, className: 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800' },
]

function currentProductUrl() {
  return window.location.href
}

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

export default function ProductShareMenu({ title, onFeedback }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)
  const copiedTimeoutRef = useRef(null)
  const menuId = useId()

  useEffect(() => () => {
    if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

  async function handleNativeShare() {
    const url = currentProductUrl()
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText(title), url })
        setOpen(false)
        return
      }
      await handleCopyLink()
    } catch (error) {
      if (error?.name !== 'AbortError') onFeedback?.('Le partage ne peut pas être ouvert.', 'error')
    }
  }

  async function handleCopyLink() {
    try {
      await copyToClipboard(currentProductUrl())
      setCopied(true)
      onFeedback?.('Lien copié.')
      if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      onFeedback?.('Le lien ne peut pas être copié.', 'error')
    }
  }

  async function handleChannel(channel) {
    const url = currentProductUrl()
    const text = shareText(title)

    if (channel === 'facebook') {
      openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
      setOpen(false)
      return
    }

    if (channel === 'whatsapp') {
      openExternal(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)
      setOpen(false)
      return
    }

    await handleCopyLink()
    onFeedback?.('Lien copié. Vous pouvez maintenant le publier sur TikTok.')
  }

  return (
    <div ref={menuRef} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls={menuId} aria-label="Partager cette annonce" className={cn('flex h-12 w-full min-w-0 items-center justify-center gap-1 rounded-lg border bg-white px-2 text-xs font-extrabold transition-colors sm:text-sm', open ? 'border-fifow-primary bg-fifow-lavender text-fifow-primary' : 'border-fifow-border text-fifow-primary hover:border-violet-200 hover:bg-fifow-lavender')}>
        <Share2 className="h-5 w-5 shrink-0" />
        <span className="hidden xl:inline">Partager</span>
      </button>

      {open ? (
        <div id={menuId} role="dialog" aria-label="Partager cette annonce" className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-fifow-border bg-white p-3 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-fifow-dark">Partager l'annonce</p>
              <p className="mt-0.5 text-xs font-medium leading-5 text-fifow-secondary">Choisissez votre application ou copiez le lien.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le partage" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-fifow-secondary hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {channels.map((channel) => (
              <button key={channel.id} type="button" onClick={() => handleChannel(channel.id)} aria-label={`Partager sur ${channel.label}`} title={`Partager sur ${channel.label}`} className={cn('grid h-11 w-11 place-items-center rounded-lg border transition active:scale-95', channel.className)}>
                <channel.Icon />
              </button>
            ))}
            <button type="button" onClick={handleNativeShare} aria-label="Partager avec une autre application" title="Partager avec une autre application" className="grid h-11 w-11 place-items-center rounded-lg border border-fifow-primary bg-white text-fifow-primary transition hover:bg-fifow-lavender active:scale-95">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          <button type="button" onClick={handleCopyLink} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-fifow-border text-sm font-extrabold text-fifow-dark transition hover:bg-slate-50">
            {copied ? <Check className="h-4 w-4 text-fifow-green" /> : <Link2 className="h-4 w-4 text-fifow-primary" />}
            {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
