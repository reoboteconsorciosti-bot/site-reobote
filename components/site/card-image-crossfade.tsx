'use client'

import { useEffect, useState } from 'react'

interface CardImageCrossfadeProps {
  images: string[]
  alt: string
  className?: string
  // Tempo que cada imagem fica totalmente visível antes do crossfade (ms).
  slideDuration?: number
  // Duração do próprio crossfade entre uma imagem e a próxima (ms).
  transitionDuration?: number
}

/**
 * Crossfade de imagens de fundo para os cards de categoria (mesma lógica do
 * HeroBackgroundCarousel, generalizada para aceitar qualquer lista de
 * imagens). Usado quando uma categoria precisa exibir mais de uma foto —
 * por ex. carro e moto no card "Automóvel" — sem remover nenhuma delas.
 *
 * O transition-property é definido inline cobrindo `opacity` (crossfade) e
 * `transform` (zoom no hover do card) juntos: como as duas animações
 * concorrem pela mesma propriedade CSS no elemento, elas precisam ser
 * declaradas numa única `transition` para não se sobrescreverem.
 */
export function CardImageCrossfade({
  images,
  alt,
  className = '',
  slideDuration = 4000,
  transitionDuration = 1200,
}: CardImageCrossfadeProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imagesReady, setImagesReady] = useState(false)

  // Preload de todas as imagens antes de liberar o ciclo automático.
  useEffect(() => {
    if (images.length === 0) return

    let cancelled = false
    let loadedCount = 0

    images.forEach((src) => {
      const img = new window.Image()
      img.src = src
      img.onload = img.onerror = () => {
        loadedCount += 1
        if (!cancelled && loadedCount === images.length) {
          setImagesReady(true)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [images])

  // Avança para a próxima imagem em loop infinito.
  useEffect(() => {
    if (!imagesReady || images.length < 2) return

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, slideDuration)

    return () => window.clearTimeout(timeoutId)
  }, [activeIndex, imagesReady, images, slideDuration])

  return (
    <>
      {images.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={index === 0 ? alt : ''}
          className={className}
          style={{
            opacity: imagesReady && index === activeIndex ? 1 : 0,
            transitionProperty: 'opacity, transform',
            transitionDuration: `${transitionDuration}ms, 700ms`,
            transitionTimingFunction: 'ease, ease-out',
          }}
        />
      ))}
    </>
  )
}
