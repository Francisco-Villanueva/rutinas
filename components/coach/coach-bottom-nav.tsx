"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { NAV_PROFESOR, itemActivo } from "@/components/coach/nav"
import { cn } from "@/lib/utils"

/** Barra inferior de mobile: el equivalente del sidebar abajo de lg. */
function CoachBottomNav() {
  const pathname = usePathname()
  const activo = itemActivo(pathname)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card px-1 pt-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden">
      {NAV_PROFESOR.map((item) => {
        const on = item.href === activo.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 px-0.5 py-1",
              on ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon aria-hidden className="size-[21px]" />
            <span
              className={cn(
                "text-[10.5px] tracking-label",
                on ? "font-bold" : "font-medium"
              )}
            >
              {item.labelCorto ?? item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export { CoachBottomNav }
