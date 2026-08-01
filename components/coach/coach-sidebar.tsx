"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell } from "lucide-react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import { NAV_PROFESOR, itemActivo } from "@/components/coach/nav"
import { cn } from "@/lib/utils"

/** Sidebar fijo del profesor. Desde lg; abajo de eso manda CoachBottomNav. */
function CoachSidebar({
  nombre,
  iniciales,
}: {
  nombre: string
  iniciales: string
}) {
  const pathname = usePathname()
  const activo = itemActivo(pathname)

  return (
    <aside className="sticky top-0 hidden h-svh w-sidebar shrink-0 flex-col border-r border-border bg-card lg:flex">
      <Link
        href="/dashboard"
        className="flex h-topbar shrink-0 items-center gap-2.5 border-b border-border px-6"
      >
        <span className="flex size-8 items-center justify-center rounded-sm bg-primary shadow-accent">
          <Dumbbell aria-hidden className="size-[19px] text-primary-foreground" />
        </span>
        <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Rutinas
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 p-4">
        {NAV_PROFESOR.map((item) => {
          const on = item.href === activo.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-md transition-colors duration-[var(--dur-fast)] ease-out",
                on
                  ? "bg-accent-soft font-bold text-accent-soft-strong"
                  : "font-medium text-body hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon aria-hidden className="size-[19px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-border p-4">
        <Avatar size="sm">
          <AvatarFallback>{iniciales}</AvatarFallback>
          <AvatarBadge aria-label="Activo" />
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {nombre}
          </div>
          <div className="text-xs text-muted-foreground">Entrenador</div>
        </div>
      </div>
    </aside>
  )
}

export { CoachSidebar }
