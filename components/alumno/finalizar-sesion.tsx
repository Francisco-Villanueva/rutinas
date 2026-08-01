"use client"

import * as React from "react"
import { useActionState } from "react"
import { CircleCheck, Trash2 } from "lucide-react"

import { descartarSesion, finalizarSesion } from "@/lib/actions/sesiones"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AvisoDeError,
  BotonEnviar,
  Campo,
  erroresDe,
  propsDeCampo,
  useCerrarAlExito,
} from "@/components/coach/form"
import { AccionSimple } from "@/components/coach/avisos"
import { SelectorRpe } from "@/components/alumno/piezas"
import type { SesionEnCurso } from "@/lib/data/alumno-tipos"

/**
 * Cierre del entrenamiento del día.
 *
 * Finalizar es lo que mueve el "hoy te toca" al día siguiente, así que si
 * quedaron ejercicios sin cargar se avisa antes: la mitad de las veces el
 * alumno se olvidó de guardar el último, no lo salteó.
 */
function FinalizarSesion({
  sesion,
  hechos,
  total,
}: {
  sesion: SesionEnCurso
  hechos: number
  total: number
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full">
          <CircleCheck aria-hidden />
          Finalizar entrenamiento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar entrenamiento</DialogTitle>
          <DialogDescription>
            {hechos < total
              ? `Cargaste ${hechos} de ${total} ejercicios. Los que falten quedan sin registrar.`
              : "Cargaste todos los ejercicios del día."}
          </DialogDescription>
        </DialogHeader>
        <FormularioDeCierre sesion={sesion} onExito={cerrar} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioDeCierre({
  sesion,
  onExito,
}: {
  sesion: SesionEnCurso
  onExito: () => void
}) {
  const [estado, accion] = useActionState(finalizarSesion, null)
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)

  return (
    <>
      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={sesion.id} />

        <AvisoDeError estado={estado} />

        <SelectorRpe
          name="rpeGeneral"
          valor={sesion.rpeGeneral}
          label="¿Cómo te fue? (RPE general)"
        />

        <Campo
          name="duracionMinutos"
          label="Duración (minutos)"
          error={errores.duracionMinutos}
          ayuda="Opcional."
        >
          <Input
            {...propsDeCampo("duracionMinutos", errores.duracionMinutos)}
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            defaultValue={sesion.duracionMinutos ?? ""}
            placeholder="55"
          />
        </Campo>

        <Campo name="notas" label="Notas" error={errores.notas} ayuda="Opcional.">
          <Textarea
            {...propsDeCampo("notas", errores.notas)}
            defaultValue={sesion.notas ?? ""}
            rows={3}
            maxLength={500}
            placeholder="Me sentí fuerte, subí 2.5 kg en press."
          />
        </Campo>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Seguir entrenando
            </Button>
          </DialogClose>
          <BotonEnviar>Finalizar</BotonEnviar>
        </DialogFooter>
      </form>

      {/* Fuera del form de arriba: es otra action y los form no se anidan. */}
      <div className="border-t border-border pt-4">
        <AccionSimple
          action={descartarSesion}
          campos={{ id: sesion.id }}
          confirmar="¿Descartar el entrenamiento de hoy? Si ya cargaste series, la sesión queda marcada como omitida."
          variant="ghost"
          size="sm"
          className="w-fit text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden />
          Descartar el día
        </AccionSimple>
      </div>
    </>
  )
}

export { FinalizarSesion }
