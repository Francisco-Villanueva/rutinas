"use client"

// ============================================================================
// Piezas compartidas por los formularios del panel.
//
// Todos siguen el mismo patrón: <form action={accionDeUseActionState}>, errores
// por campo debajo del control y mensaje general arriba del pie. El estado del
// formulario es el ResultadoAction que devuelve la action (ver
// lib/actions/resultado.ts).
// ============================================================================

import * as React from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { EstadoForm } from "@/lib/actions/resultado"

/**
 * Label + control + error del campo.
 *
 * `error` es el arreglo que devuelve la action para ese campo; se muestra el
 * primero. `htmlFor`/`id` se derivan del name para no repetirlos en cada uso.
 */
function Campo({
  name,
  label,
  error,
  ayuda,
  children,
  className,
}: {
  name: string
  label: string
  error?: string[]
  ayuda?: string
  children: React.ReactNode
  className?: string
}) {
  const mensaje = error?.[0]

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {mensaje ? (
        <p id={`${name}-error`} className="text-xs font-medium text-destructive">
          {mensaje}
        </p>
      ) : ayuda ? (
        <p className="text-xs text-muted-foreground">{ayuda}</p>
      ) : null}
    </div>
  )
}

/**
 * Props que van en el control de un Campo para que quede accesible: id, y el
 * marcado de inválido que engancha con los estilos aria-invalid del DS.
 */
function propsDeCampo(name: string, error?: string[]) {
  return {
    id: name,
    name,
    "aria-invalid": error != null ? true : undefined,
    "aria-describedby": error != null ? `${name}-error` : undefined,
  }
}

/**
 * Select nativo con el cuerpo de Input del DS.
 *
 * Nativo a propósito: en el celular abre el selector del sistema operativo, que
 * con 60+ ejercicios se maneja muchísimo mejor que una lista flotante, y manda
 * su valor en el FormData sin JavaScript de por medio.
 */
function SelectNativo({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full min-w-0 appearance-none rounded-md border border-input bg-card bg-[length:18px] bg-[right_0.6rem_center] bg-no-repeat px-3 pr-9 text-md shadow-xs transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        // Chevron como background: un <select> nativo no admite hijos que no
        // sean <option>, así que el ícono no puede ir adentro.
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23737373%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        className
      )}
      {...props}
    />
  )
}

/** Mensaje general de la action: lo que no corresponde a un campo puntual. */
function AvisoDeError({ estado }: { estado: EstadoForm<unknown> }) {
  if (!estado || estado.ok) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{estado.mensaje}</span>
    </div>
  )
}

/**
 * Botón de submit con el pendiente del form.
 *
 * Usa useFormStatus en vez del `pending` de useActionState porque así el botón
 * no necesita que se lo pasen por prop desde el componente que tiene el estado.
 */
function BotonEnviar({
  children = "Guardar",
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
      {children}
    </Button>
  )
}

/**
 * Cierra el dialog cuando la action terminó bien.
 *
 * El efecto depende de la identidad de `estado`: useActionState devuelve un
 * objeto nuevo por cada submit, así que dos altas seguidas disparan el cierre
 * las dos veces. `onExito` tiene que ser estable (useCallback o un setState).
 */
function useCerrarAlExito(estado: EstadoForm<unknown>, onExito: () => void) {
  React.useEffect(() => {
    if (estado?.ok) onExito()
  }, [estado, onExito])
}

/** Errores por campo del estado actual, o vacío si todavía no se envió. */
function erroresDe(estado: EstadoForm<unknown>) {
  return estado && !estado.ok ? (estado.errores ?? {}) : {}
}

export {
  AvisoDeError,
  BotonEnviar,
  Campo,
  erroresDe,
  propsDeCampo,
  SelectNativo,
  useCerrarAlExito,
}
