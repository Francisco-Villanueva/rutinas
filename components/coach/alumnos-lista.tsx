"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, ChevronRight, Search, UserPlus, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { AvatarAlumno, EmptyHint, Meta } from "@/components/coach/piezas"
import { cn } from "@/lib/utils"
import type { AlumnoPanel } from "@/lib/data/tipos"

const FILTROS = ["Todos", "Activos", "Inactivos", "Con alerta"] as const

type Filtro = (typeof FILTROS)[number]

/**
 * Grilla de alumnos con búsqueda y filtros. El filtrado es del lado del cliente
 * a propósito: la cartera de un profesor son decenas de alumnos, no miles, y
 * así el tipeo responde sin ida y vuelta al servidor.
 */
function AlumnosLista({ alumnos }: { alumnos: AlumnoPanel[] }) {
  const [q, setQ] = React.useState("")
  const [filtro, setFiltro] = React.useState<Filtro>("Todos")

  const lista = alumnos.filter((a) => {
    if (!a.nombre.toLowerCase().includes(q.trim().toLowerCase())) return false
    if (filtro === "Activos") return a.estado === "activo"
    if (filtro === "Inactivos") return a.estado !== "activo"
    if (filtro === "Con alerta") return a.alerta != null
    return true
  })

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {/* -mx-4 px-4: el scroll de chips llega al borde de la pantalla en mobile */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 lg:mx-0 lg:px-0">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={f === filtro}
              className={cn(
                "shrink-0 rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ease-out",
                f === filtro
                  ? "border-primary bg-accent-soft text-accent-soft-strong"
                  : "border-input bg-card text-body hover:bg-muted"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-60 lg:flex-none">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-faint"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar alumno…"
              aria-label="Buscar alumno"
              className="pl-10"
            />
          </div>
          {/* La invitación necesita su Server Action; todavía no existe. */}
          <Button disabled title="Próximamente: invitación por email">
            <UserPlus aria-hidden />
            <span className="hidden lg:inline">Invitar alumno</span>
          </Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyHint icon={<UserX aria-hidden />}>
            No hay alumnos que coincidan.
          </EmptyHint>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          {lista.map((a) => (
            <Link key={a.id} href={`/alumnos/${a.id}`} className="flex">
              <Card accent={a.alerta != null} interactive className="flex-1">
                <CardContent className="flex items-center gap-3">
                  <AvatarAlumno iniciales={a.iniciales} estado={a.estado} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-md font-semibold text-foreground">
                      {a.nombre}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[a.objetivo, a.plan].filter(Boolean).join(" · ") ||
                        "Sin rutina asignada"}
                    </div>
                  </div>
                  <ChevronRight aria-hidden className="size-[18px] shrink-0 text-faint" />
                </CardContent>

                {a.alerta ? (
                  <CardContent>
                    <Badge variant={a.alerta.tono} size="sm">
                      <AlertCircle aria-hidden />
                      {a.alerta.texto}
                    </Badge>
                  </CardContent>
                ) : null}

                <CardContent className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="eyebrow">Adherencia</span>
                    <span className="font-mono text-xs font-semibold text-body">
                      {a.adherencia != null ? `${a.adherencia}%` : "Sin datos"}
                    </span>
                  </div>
                  {a.adherencia != null ? (
                    <Progress
                      size="sm"
                      value={a.adherencia}
                      tone={
                        a.adherencia >= 80
                          ? "success"
                          : a.adherencia >= 60
                            ? "accent"
                            : "warning"
                      }
                    />
                  ) : null}
                </CardContent>

                <CardContent className="flex justify-between border-t border-border pt-(--card-spacing)">
                  <Meta
                    label="Mesociclo"
                    value={
                      a.semana != null && a.semanas != null
                        ? `Sem ${a.semana}/${a.semanas}`
                        : "—"
                    }
                  />
                  <Meta label="Última sesión" value={a.ultimaSesion ?? "—"} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export { AlumnosLista }
