'use client'

import CarritoPage from '@creart/tienda-core/CarritoPage'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function Page() {
  // CarritoPage (paquete compartido) trae su propio "pt-28" hardcodeado en el <main>,
  // pensado para un solo header. Con la barra de categorías fija nueva, el contenido
  // queda tapado — este wrapper fuerza el padding correcto sin forkear el componente.
  return (
    <div className="[&_main]:!pt-[164px]">
      <CarritoPage Navbar={Navbar} Footer={Footer} />
    </div>
  )
}
