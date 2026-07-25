'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface BannerCarouselProps {
  /** URLs de las imágenes (banner_1, banner_2, banner_3 desde Personalización) */
  images: string[]
  href?: string
  alt?: string
  /** Tiempo entre rotaciones automáticas, en ms */
  intervalMs?: number
}

export default function BannerCarousel({
  images,
  href = '/tienda',
  alt = '',
  intervalMs = 2000,
}: BannerCarouselProps) {
  const slides = images.filter(Boolean)
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const start = () => {
    stop()
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length)
      }, intervalMs)
    }
  }

  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, intervalMs])

  if (slides.length === 0) return null

  const goTo = (i: number) => {
    setIndex(i)
    start() // reinicia el temporizador al interactuar manualmente
  }

  return (
    <section
      className="relative w-full aspect-[16/6] overflow-hidden bg-white"
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      {slides.map((src, i) => (
        <Link
          key={src + i}
          href={href}
          className="absolute inset-0 block transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
        >
          <Image
            src={src.split('?')[0]}
            alt={alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </Link>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
