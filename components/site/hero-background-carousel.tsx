'use client'

import { useEffect, useState } from 'react'

// ─── Configuração de tempo do carrossel ─────────────────────────────────────
// Tempo que cada imagem fica totalmente visível antes de iniciar a próxima transição (ms).
export const SLIDE_DURATION = 7000
// Duração do crossfade entre uma imagem e a próxima (ms).
export const TRANSITION_DURATION = 1800

// ─── Imagens do carrossel do Hero ───────────────────────────────────────────
// Adicione/remova entradas aqui para mudar o carrossel — o componente se adapta
// automaticamente a qualquer quantidade de imagens (mínimo 1).
const HERO_BACKGROUND_IMAGES = [
  '/images/background/DSC_5156.jpg.jpeg',
  '/images/background/homem-em-car-em-dealership_23-2148130179.avif',
  '/images/background/36327310-ai-gerado-feliz-casal-casa-os-proprietarios-dentro-frente-do-casa-elas-comprado-conceito-do-casa-propriedade-e-felicidade-foto.jpg',
  '/images/background/Gemini_Generated_Image_ol1n0wol1n0wol1n.png',
]

/**
 * Carrossel de fundo cinematográfico do Hero.
 *
 * Renderiza todas as imagens sobrepostas (position absolute) e alterna a
 * opacidade da imagem ativa via CSS transition, produzindo um crossfade
 * suave entre elas. Um zoom sutil e contínuo (via CSS, ver .hero-carousel-slide
 * em globals.css) dá a sensação de movimento cinematográfico sem depender de
 * sincronização por JS — evitando saltos de escala ao trocar de slide.
 */
export function HeroBackgroundCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imagesReady, setImagesReady] = useState(false)

  // Preload de todas as imagens antes de liberar a exibição/ciclo automático,
  // evitando flash em branco ou atraso perceptível na primeira troca.
  useEffect(() => {
    if (HERO_BACKGROUND_IMAGES.length === 0) return

    let cancelled = false
    let loadedCount = 0

    HERO_BACKGROUND_IMAGES.forEach((src) => {
      const img = new window.Image()
      img.src = src
      img.onload = img.onerror = () => {
        loadedCount += 1
        if (!cancelled && loadedCount === HERO_BACKGROUND_IMAGES.length) {
          setImagesReady(true)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Avança para a próxima imagem em loop infinito. Usa um único setTimeout
  // recriado a cada troca (em vez de setInterval), garantindo que nunca haja
  // mais de um timer ativo simultaneamente e que ele seja sempre limpo no
  // unmount ou antes de ser recriado.
  useEffect(() => {
    if (!imagesReady || HERO_BACKGROUND_IMAGES.length < 2) return

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % HERO_BACKGROUND_IMAGES.length)
    }, SLIDE_DURATION)

    return () => window.clearTimeout(timeoutId)
  }, [activeIndex, imagesReady])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {HERO_BACKGROUND_IMAGES.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="hero-carousel-slide absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: imagesReady && index === activeIndex ? 1 : 0,
            transitionDuration: `${TRANSITION_DURATION}ms`,
            animationDuration: `${SLIDE_DURATION + TRANSITION_DURATION}ms`,
          }}
        />
      ))}
    </div>
  )
}
