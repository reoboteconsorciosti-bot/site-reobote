'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Menu, X, MessageCircle } from 'lucide-react'
import { navLinks, whatsappLink } from '@/lib/site-config'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-background/85 backdrop-blur-md'
          : 'border-b border-transparent bg-background/0',
      )}
    >
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:h-20 lg:px-8">
        <a href="#inicio" className="flex items-center" aria-label="Reobote Consórcios — início">
          <Image
            src="/images/logos/LOGO-BRANCA.png"
            alt="Reobote Consórcios"
            width={170}
            height={70}
            priority
            className="h-16 w-auto sm:h-20"
          />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/90 hover:text-white',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#simulador"
            className={cn(
              'text-sm font-semibold transition-colors',
              scrolled ? 'text-slate-800 hover:text-primary' : 'text-white hover:text-blue-300',
            )}
          >
            Simular
          </a>
          <a
            href={whatsappLink('Olá! Gostaria de saber mais sobre os consórcios da Reobote.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
          >
            <MessageCircle className="size-4" />
            Falar com consultor
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-md text-foreground lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Menu mobile */}
      <div
        className={cn(
          'overflow-hidden border-t border-border bg-background lg:hidden',
          open ? 'max-h-[520px]' : 'max-h-0 border-t-0',
          'transition-all duration-300',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Navegação mobile">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {link.label}
            </a>
          ))}
          <a
            href={whatsappLink('Olá! Gostaria de saber mais sobre os consórcios da Reobote.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            <MessageCircle className="size-4" />
            Falar com consultor
          </a>
        </nav>
      </div>
    </header>
  )
}
