import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

const valueSize = {
  sm: "text-2xl",
  default: "text-3xl",
  lg: "text-5xl",
} as const

/**
 * Lectura grande de métrica (1RM, volumen, adherencia).
 * No existe en shadcn: es propio del DS y central en un producto de datos
 * de entrenamiento, así que vive en components/ y no en components/ui/.
 */
function Stat({
  label,
  value,
  unit,
  delta,
  deltaDir,
  size = "default",
  icon,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  value: React.ReactNode
  /** Unidad en mono, más chica, al lado del número: kg, %, t. */
  unit?: React.ReactNode
  delta?: React.ReactNode
  deltaDir?: "up" | "down"
  size?: keyof typeof valueSize
  icon?: React.ReactNode
}) {
  const dir =
    deltaDir ??
    (typeof delta === "string" && delta.trim().startsWith("-") ? "down" : "up")

  return (
    <div
      data-slot="stat"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <span className="flex items-center gap-2 text-xs font-semibold tracking-caps text-muted-foreground uppercase">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "flex items-baseline gap-1 font-heading font-bold leading-tight tracking-display text-foreground",
          valueSize[size]
        )}
      >
        <span className="tabular-nums">{value}</span>
        {unit ? (
          <span className="font-mono text-[0.4em] font-medium text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </span>
      {delta != null ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-semibold",
            dir === "down" ? "text-destructive-strong" : "text-success-strong"
          )}
        >
          <ArrowUpRight
            aria-hidden
            className={cn("size-3.5 stroke-[3]", dir === "down" && "rotate-90")}
          />
          {delta}
        </span>
      ) : null}
    </div>
  )
}

export { Stat }
