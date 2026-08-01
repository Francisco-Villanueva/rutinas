"use client"

// ============================================================================
// Avisos flotantes para las acciones que no abren un formulario.
//
// Un dialog puede mostrar el error adentro; un botón de fila (subir, quitar,
// duplicar) no tiene dónde. Sin esto, una action que falla no deja rastro: el
// profesor toca "Quitar", no pasa nada y no sabe si se guardó.
//
// Es deliberadamente mínimo — un contenedor fijo con un par de mensajes que se
// borran solos. Cuando el proyecto sume un toast del DS, esto se reemplaza por
// aquel sin tocar los llamadores.
// ============================================================================

import * as React from "react"
import { useActionState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EstadoForm } from "@/lib/actions/resultado"

type Aviso = { id: number; tono: "ok" | "error"; texto: string }

const AvisosContext = React.createContext<((aviso: Omit<Aviso, "id">) => void) | null>(
  null
)

const DURACION_MS = 4000

function ProveedorDeAvisos({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = React.useState<Aviso[]>([])

  const mostrar = React.useCallback((aviso: Omit<Aviso, "id">) => {
    const id = Date.now() + Math.random()
    setAvisos((previos) => [...previos, { ...aviso, id }])
    setTimeout(() => {
      setAvisos((previos) => previos.filter((a) => a.id !== id))
    }, DURACION_MS)
  }, [])

  return (
    <AvisosContext.Provider value={mostrar}>
      {children}
      {/* bottom-24 en mobile: la barra de navegación inferior es fija. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            role={aviso.tono === "error" ? "alert" : undefined}
            className={cn(
              "flex max-w-md items-start gap-2 rounded-md border px-3.5 py-2.5 text-sm shadow-lg",
              aviso.tono === "error"
                ? "border-destructive/30 bg-destructive text-white"
                : "border-border bg-card text-body"
            )}
          >
            {aviso.tono === "error" ? (
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            )}
            <span>{aviso.texto}</span>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

/** Devuelve la función para publicar un aviso. Sin proveedor, no hace nada. */
function useAvisos() {
  const mostrar = React.useContext(AvisosContext)

  return React.useCallback(
    (aviso: Omit<Aviso, "id">) => {
      if (mostrar) mostrar(aviso)
      else if (aviso.tono === "error") console.error("[aviso]", aviso.texto)
    },
    [mostrar]
  )
}

/** Publica en la barra de avisos el resultado de una action. */
function useAvisarResultado(estado: EstadoForm<unknown>, silenciarExito = false) {
  const avisar = useAvisos()

  React.useEffect(() => {
    if (!estado) return
    if (estado.ok) {
      if (!silenciarExito && estado.mensaje) {
        avisar({ tono: "ok", texto: estado.mensaje })
      }
    } else {
      avisar({ tono: "error", texto: estado.mensaje })
    }
  }, [estado, avisar, silenciarExito])
}

/**
 * Botón que dispara una Server Action de un solo paso.
 *
 * Es un <form> y no un onClick con startTransition: así el navegador manda los
 * campos ocultos sin que haya que armar el FormData a mano, y anda igual si el
 * JS todavía no hidrató.
 */
function AccionSimple({
  action,
  campos,
  children,
  confirmar,
  silenciarExito,
  className,
  ...props
}: {
  action: (estado: unknown, formData: FormData) => Promise<EstadoForm<unknown>>
  /** Campos ocultos del form: ids y demás datos que no edita el usuario. */
  campos: Record<string, string>
  /** Texto de confirmación. Sin esto, la action se dispara de una. */
  confirmar?: string
  silenciarExito?: boolean
} & React.ComponentProps<typeof Button>) {
  const [estado, accion, pendiente] = useActionState(action, null)
  useAvisarResultado(estado, silenciarExito)

  function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    if (confirmar && !window.confirm(confirmar)) evento.preventDefault()
  }

  return (
    <form action={accion} onSubmit={alEnviar} className="contents">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <Button type="submit" disabled={pendiente} className={className} {...props}>
        {pendiente ? <Loader2 aria-hidden className="animate-spin" /> : null}
        {children}
      </Button>
    </form>
  )
}

export { AccionSimple, ProveedorDeAvisos, useAvisarResultado, useAvisos }
