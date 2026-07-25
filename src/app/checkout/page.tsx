'use client'

import CheckoutPage from '@creart/tienda-core/CheckoutPage'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function Page() {
  // CheckoutPage (paquete compartido) trae varios <main className="pt-28"> hardcodeados,
  // pensados para un solo header. Con la barra de categorías fija nueva, el contenido
  // queda tapado — este wrapper fuerza el padding correcto sin forkear el componente.
  return (
    <div className="[&_main]:!pt-[164px]">
      <CheckoutPage Navbar={Navbar} Footer={Footer} />
    </div>
  )
}
