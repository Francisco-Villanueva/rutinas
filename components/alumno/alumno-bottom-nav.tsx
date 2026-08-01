"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { NAV_ALUMNO, itemActivoAlumno } from "@/components/alumno/nav"
import { cn } from "@/lib/utils"

/**
 * Tabs inferiores del alumno.
 *
 * A diferencia de la del profesor, esta no se esconde en desktop: la app del
 * alumno es una app de celular en cualquier ancho. El contenido se centra con
 * max-w y la barra queda abajo siempre.
 */
function AlumnoBottomNav() {
  const pathname = usePathname()
  const activo = itemActivoAlumno(pathname)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
      <div className="mx-auto flex max-w-md px-1 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {NAV_ALUMNO.map((item) => {
          const on = item.href === activo.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-0.5 py-1",
                on ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon aria-hidden className="size-[21px]" />
              <span
                className={cn(
                  "text-[10.5px] tracking-label",
                  on ? "font-bold" : "font-medium",
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export { AlumnoBottomNav }
