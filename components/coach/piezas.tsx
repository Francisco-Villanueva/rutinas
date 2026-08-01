import * as React from "react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { EstadoAlumno } from "@/lib/data/tipos"

/**
 * Piezas chicas compartidas por las pantallas del profesor. Están juntas a
 * propósito: son de dos o tres líneas y se usan cruzadas entre pantallas.
 */

function AvatarAlumno({
  iniciales,
  estado,
  size = "sm",
}: {
  iniciales: string
  estado: EstadoAlumno
  size?: React.ComponentProps<typeof Avatar>["size"]
}) {
  return (
    <Avatar size={size}>
      <AvatarFallback>{iniciales}</AvatarFallback>
      {estado === "activo" ? <AvatarBadge aria-label="Activo" /> : null}
    </Avatar>
  )
}

/** Barra + porcentaje. El tono cambia por tramo, como en el UI kit. */
function Adherencia({ valor }: { valor: number | null }) {
  if (valor == null) {
    return <span className="text-sm text-faint">Sin datos</span>
  }

  return (
    <>
      <Progress
        size="sm"
        className="flex-1"
        value={valor}
        tone={valor >= 80 ? "success" : valor >= 60 ? "accent" : "warning"}
      />
      <span className="w-9 shrink-0 text-right font-mono text-xs font-semibold text-body">
        {valor}%
      </span>
    </>
  )
}

/** Estado vacío con ícono, para listas filtradas y pantallas sin datos. */
function EmptyHint({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-5 py-12 text-center text-sm text-muted-foreground">
      <span className="text-faint [&>svg]:size-7">{icon}</span>
      {children}
    </div>
  )
}

/** Par etiqueta/valor de las tarjetas de alumno. */
function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-2xs tracking-caps text-faint uppercase">
        {label}
      </div>
      <div className="text-sm font-semibold text-body">{value}</div>
    </div>
  )
}

/** Celda en mono de las tablas de datos (series, reps, peso, RPE). */
function Celda({ children, className }: React.ComponentProps<"span">) {
  return (
    <span className={cn("font-mono text-sm text-body", className)}>{children}</span>
  )
}

/** Etiqueta de sección en caps, el tratamiento de eyebrow del DS. */
function Eyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("eyebrow", className)} {...props} />
}

export { Adherencia, AvatarAlumno, Celda, EmptyHint, Eyebrow, Meta }
