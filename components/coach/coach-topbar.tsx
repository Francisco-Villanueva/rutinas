"use client"

import { usePathname } from "next/navigation"
import { SignOutButton } from "@clerk/nextjs"
import { Dumbbell, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { itemActivo } from "@/components/coach/nav"

/**
 * Topbar del profesor. El título sale de la sección activa (components/coach/nav.ts).
 * En mobile reemplaza al sidebar como cabecera de marca; en desktop es solo
 * título + subtítulo.
 *
 * El kit trae acá búsqueda, notificaciones y switch de tema. Ninguno de los tres
 * existe todavía (y el DS es solo modo claro por ahora), así que el único
 * control real es cerrar sesión.
 */
function CoachTopbar() {
  const pathname = usePathname()
  const { titulo, subtitulo } = itemActivo(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 lg:h-topbar lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xs bg-primary lg:hidden">
          <Dumbbell aria-hidden className="size-4 text-primary-foreground" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-xl leading-tight font-bold tracking-tight text-foreground lg:text-2xl">
            {titulo}
          </h1>
          <p className="hidden text-sm text-muted-foreground lg:block">
            {subtitulo}
          </p>
        </div>
      </div>

      <SignOutButton redirectUrl="/sign-in">
        <Button variant="ghost" size="icon" aria-label="Cerrar sesión">
          <LogOut aria-hidden />
        </Button>
      </SignOutButton>
    </header>
  )
}

export { CoachTopbar }
