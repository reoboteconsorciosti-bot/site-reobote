'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
}

const navLinks = [
  { href: '#cotas-contempladas', label: 'Consultar Cotas Contempladas', highlight: true },
  { href: '#areas', label: 'Soluções' },
  { href: '#mapa', label: 'Vendas' },
  { href: '#depoimentos', label: 'Depoimentos' },
  { href: '#quem-somos', label: 'Quem somos' },
  { href: '#faq', label: 'FAQ' },
] as const

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const globalCss = `
    @media (max-width: 768px) {
      html, body {
        width: 100%;
        max-width: 100%;
        overflow-x: clip;
        background: #0d172e;
      }

      body {
        touch-action: pan-y;
        overscroll-behavior-x: none;
      }

      #__next, main, #topo {
        width: 100%;
        max-width: 100%;
        overflow-x: clip;
      }
    }
  `

  useEffect(() => {
    if (!open) return

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleResize = () => {
      if (window.innerWidth > 768) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [open, onClose])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      {open ? (
        <div className="fixed inset-0 z-[11000] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute right-0 top-0 h-full w-[84vw] max-w-[360px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-extrabold tracking-tight text-slate-900">Menu</div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
                aria-label="Fechar menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Navegação mobile">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={
                    'highlight' in link && link.highlight
                      ? 'rounded-xl px-4 py-3 text-[15px] font-bold text-[#009CDE] hover:bg-[#009CDE]/10 active:bg-[#009CDE]/15'
                      : 'rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-900 hover:bg-slate-100 active:bg-slate-200'
                  }
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="px-5 pb-6">
              <a
                href="#simulador"
                onClick={onClose}
                className="mb-3 block w-full rounded-2xl bg-[#0d172e] px-6 py-4 text-center text-sm font-extrabold text-white"
              >
                Simular Consórcio
              </a>
              <a
                href="https://wa.me/5567981156454"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block w-full rounded-2xl bg-[#009CDE] px-6 py-4 text-center text-sm font-extrabold text-white"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
