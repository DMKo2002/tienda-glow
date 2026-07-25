import { cookies } from 'next/headers'
import { createServerSupabase, TENANT_ID } from '@/lib/supabase-server'

// Siempre SSR fresco — sin esto Next.js cachea la página y los cambios del panel no se ven
export const dynamic = 'force-dynamic'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shop/ProductCard'
import BannerCarousel from '@/components/layout/BannerCarousel'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const COLLECTION_PALETTES = [
  { bg: '#E3E0DA', text: '#1A1A1A' },
  { bg: '#C3C2BB', text: '#1A1A1A' },
  { bg: '#A4A49C', text: '#1A1A1A' },
]

export default async function HomePage() {
  // cookies() debe llamarse ANTES de cualquier await
  const cookieStore = cookies()
  const isLoggedIn = cookieStore.getAll().some(c => c.name.includes('-auth-token') && c.value.length > 10)

  const supabase = await createServerSupabase()

  // Datos de la tienda
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, domain')
    .eq('id', TENANT_ID())
    .single()

  const { data: config } = await supabase
    .from('store_config')
    .select('logo_url, whatsapp_number, notification_email, instagram_url, facebook_url, tiktok_url, pickup_address, pickup_enabled, branches, price_visibility, collection_posts, collection_text_color')
    .eq('tenant_id', TENANT_ID())
    .single()

  // Imágenes configurables desde Panel Admin > Personalización (banners grandes)
  const { data: assetsRows } = await supabase
    .from('store_assets')
    .select('slot, url')
    .eq('tenant_id', TENANT_ID())

  const asset = (slot: string): string | null =>
    assetsRows?.find(a => a.slot === slot)?.url ?? null

  // Categorías para las 3 colecciones (mismo criterio que Atelier: si el tenant
  // no cargó título a mano, se usa el nombre de la categoría automáticamente)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('tenant_id', TENANT_ID())
    .eq('active', true)
    .order('sort_order')
    .limit(3)

  const PRODUCT_SELECT = 'id, name, slug, product_images(*), variants(color, size, price_rules(*))'

  // Catálogo grande de la home — 5 columnas × ~8 filas (mismo ancho que /tienda)
  const { data: catalog } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('tenant_id', TENANT_ID())
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(48)

  const storeName = tenant?.name ?? 'TIENDA'
  const priceVisibility = (config as any)?.price_visibility ?? 'all'
  const showPrices = priceVisibility === 'all' || (priceVisibility === 'logged_in' && isLoggedIn)

  function toCardProps(product: any, i: number) {
    const cover = product.product_images?.find((img: any) => img.is_cover) ?? product.product_images?.[0]
    const retailPrice = product.variants?.[0]?.price_rules?.find((p: any) => p.type === 'retail' && p.active)?.price
    const retailCompareAt = product.variants?.[0]?.price_rules?.find((p: any) => p.type === 'retail' && p.active)?.compare_at_price
    const wholesalePrice = product.variants?.[0]?.price_rules?.find((p: any) => p.type === 'wholesale' && p.active)?.price
    const colors = [...new Set((product.variants ?? []).map((v: any) => v.color).filter(Boolean))] as string[]
    const sizes = [...new Set((product.variants ?? []).map((v: any) => v.size).filter(Boolean))] as string[]
    return {
      key: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      coverUrl: cover?.url,
      retailPrice,
      retailCompareAt,
      wholesalePrice,
      showPrices,
      priceVisibility,
      colors,
      sizes,
      index: i,
    }
  }

  const banner1 = asset('banner_1')
  const banner2 = asset('banner_2')
  const banner3 = asset('banner_3')
  const bannerImages = [banner1, banner2, banner3].filter(Boolean) as string[]

  // Título y bajada de cada banner de colección: si el tenant los cargó a mano
  // en el panel, tienen prioridad sobre el nombre de categoría automático.
  const rawCollectionPosts = (config as any)?.collection_posts
  const collections = Array.from({ length: 3 }, (_, i) => ({
    name: rawCollectionPosts?.[i]?.title || (categories as any)?.[i]?.name || ['Nueva Colección', 'Accesorios', 'Ropa'][i],
    subtitle: rawCollectionPosts?.[i]?.subtitle || 'Piezas seleccionadas para esta temporada.',
    slug: (categories as any)?.[i]?.slug ?? ['nueva-coleccion', 'accesorios', 'ropa'][i],
    palette: COLLECTION_PALETTES[i],
  }))
  const collectionTextColor = (config as any)?.collection_text_color || null

  return (
    <>
      <Navbar storeName={storeName} logoUrl={config?.logo_url} />

      {/* El header flota transparente sobre el banner (como siempre), pero la barra de
          categorías fija nueva sí tiene fondo sólido y empuja el banner hacia abajo. */}
      <main className="pt-[124px]">

        {/* ── BANNERS (carrusel infinito de 3 imágenes) ─────────── */}
        {bannerImages.length > 0 ? (
          <BannerCarousel images={bannerImages} alt={storeName} />
        ) : (
          // Fallback simple mientras no se suben banners desde Personalización
          <section className="w-full py-24 px-6 bg-white text-center">
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--color-stone)] mb-3">{storeName}</p>
            <h1 className="font-display text-4xl md:text-6xl font-light text-[var(--color-charcoal)]">
              Cuidá tu piel, sentite bien
            </h1>
            <Link href="/tienda" className="inline-flex items-center gap-2 mt-6 text-xs tracking-[0.2em] uppercase border-b border-[var(--color-charcoal)] pb-1">
              Ver productos <ArrowRight size={13} />
            </Link>
          </section>
        )}

        {/* ── PRODUCTOS DESTACADOS ─────────────────────────────── */}
        <section className="w-full px-6 md:px-10 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)]">
              Productos destacados
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {catalog?.map((p: any, i: number) => <ProductCard {...toCardProps(p, i)} />)}

            {(!catalog || catalog.length === 0) && (
              <div className="col-span-full py-20 text-center">
                <p className="text-[var(--color-stone)] font-light">
                  Los productos se mostrarán aquí
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link href="/tienda" className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[var(--color-stone)]">
              Ver catálogo completo <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* ── FEATURES BAR ─────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Envío a todo el país', desc: 'En compras que superen el monto mínimo. Entrega rápida y segura a todo el país.' },
              { title: 'Compra Segura', desc: 'Garantizamos una experiencia de compra segura de principio a fin.' },
              { title: 'Atención al cliente', desc: 'Estamos disponibles para ayudarte en todo momento por WhatsApp e email.' },
            ].map((feat, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-11 h-11 bg-[var(--color-cream)] flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-charcoal)] mb-1.5">{feat.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--color-stone)]">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COLECCIONES ──────────────────────────────────────── */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collections.map((col, i) => {
              const colImg = asset(`collection_${i + 1}`)
              // Si el tenant eligió un color, se respeta siempre (con o sin imagen).
              // Si no, se mantiene el comportamiento anterior por defecto.
              const baseColor = collectionTextColor ?? (colImg ? '#ffffff' : '#1A1A1A')
              return (
                <Link
                  key={i}
                  href={`/tienda?cat=${col.slug}`}
                  className={`group relative overflow-hidden aspect-[4/5] block ${i === 1 ? 'md:translate-y-6' : ''}`}
                  style={{ backgroundColor: col.palette.bg }}
                >
                  {colImg && (
                    <img
                      src={colImg}
                      alt={col.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-2xl font-bold mb-1" style={{ color: baseColor }}>
                      {col.name}
                    </h2>
                    <p className="text-xs mb-4 leading-relaxed" style={{ color: baseColor + 'B3' }}>
                      {col.subtitle}
                    </p>
                    <span
                      className="text-xs font-bold tracking-[0.15em] uppercase border-b-2 pb-0.5 group-hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)] transition-colors"
                      style={{ color: baseColor, borderColor: baseColor }}
                    >
                      DISCOVER MORE
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

      </main>

      {/* ── WHATSAPP FLOTANTE ─────────────────────────────────── */}
      {config?.whatsapp_number && (
        <a
          href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="fixed bottom-12 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 21l3.98-.927A9.945 9.945 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.5a8.46 8.46 0 0 1-4.337-1.195l-.31-.184-3.22.75.77-3.12-.202-.32A8.5 8.5 0 1 1 12 20.5z"/>
          </svg>
        </a>
      )}

      <Footer
        storeName={storeName}
        logoUrl={asset('logo') ?? config?.logo_url ?? undefined}
        whatsapp={config?.whatsapp_number ?? ''}
        email={config?.notification_email ?? ''}
        instagramUrl={(config as any)?.instagram_url ?? undefined}
        facebookUrl={(config as any)?.facebook_url ?? undefined}
        tiktokUrl={(config as any)?.tiktok_url ?? undefined}
        branches={(config as any)?.branches ?? []}
      />
    </>
  )
}
