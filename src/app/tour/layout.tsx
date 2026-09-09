import type { Metadata } from 'next'

// /tour/page.tsx es 'use client' -- ver nota igual en contacto/layout.tsx.
export const metadata: Metadata = {
  title: 'Tour',
  alternates: { canonical: '/tour' },
}

export default function TourLayout({ children }: { children: React.ReactNode }) {
  return children
}
