import {
  CalendarCheck,
  History,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react"

/** Navegación del alumno: los cuatro tabs inferiores del kit athlete-app. */
export type ItemNavAlumno = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ALUMNO: ItemNavAlumno[] = [
  { href: "/hoy", label: "Hoy", icon: CalendarCheck },
  { href: "/progreso", label: "Progreso", icon: TrendingUp },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/perfil", label: "Perfil", icon: User },
]

/** El item cuya sección contiene a `pathname`, o "Hoy" por defecto. */
export function itemActivoAlumno(pathname: string): ItemNavAlumno {
  return (
    NAV_ALUMNO.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? NAV_ALUMNO[0]
  )
}
