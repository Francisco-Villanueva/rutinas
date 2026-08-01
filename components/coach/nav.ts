import {
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Send,
  Users,
  type LucideIcon,
} from "lucide-react"

/**
 * Navegación del profesor. Es la misma lista para el sidebar (desktop) y la
 * barra inferior (mobile), y de acá salen también el título y el subtítulo del
 * topbar: una sola fuente de verdad por sección.
 *
 * Solo /dashboard está implementado; el resto son las pantallas siguientes del
 * UI kit (Alumnos, Rutinas, Ejercicios, Asignaciones).
 */
export type ItemNav = {
  href: string
  label: string
  /** Label de la barra inferior, donde no entra el largo. */
  labelCorto?: string
  icon: LucideIcon
  titulo: string
  subtitulo: string
}

export const NAV_PROFESOR: ItemNav[] = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
    titulo: "Panel",
    subtitulo: "Resumen de tu gimnasio hoy",
  },
  {
    href: "/alumnos",
    label: "Alumnos",
    icon: Users,
    titulo: "Alumnos",
    subtitulo: "Tu cartera de alumnos",
  },
  {
    href: "/rutinas",
    label: "Rutinas",
    icon: ClipboardList,
    titulo: "Rutinas",
    subtitulo: "Constructor y plantillas",
  },
  {
    href: "/ejercicios",
    label: "Ejercicios",
    icon: Dumbbell,
    titulo: "Ejercicios",
    subtitulo: "Biblioteca de ejercicios",
  },
  {
    href: "/asignaciones",
    label: "Asignaciones",
    labelCorto: "Asignar",
    icon: Send,
    titulo: "Asignaciones",
    subtitulo: "Asigná rutinas a tus alumnos",
  },
]

/** El item cuya sección contiene a `pathname`, o el Panel por defecto. */
export function itemActivo(pathname: string): ItemNav {
  return (
    NAV_PROFESOR.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? NAV_PROFESOR[0]
  )
}
