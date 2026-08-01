"use client"

import * as React from "react"
import { useActionState } from "react"

import { asignarRutina } from "@/lib/actions/asignaciones"
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
  SelectNativo,
  useCerrarAlExito,
} from "@/components/coach/form"
import type { OpcionAlumno, OpcionRutina } from "@/lib/data/tipos"

/**
 * Asignación de una rutina a un alumno.
 *
 * `alumnoId` y `rutinaId` pueden venir preseleccionados: se llega acá desde el
 * detalle del alumno ("Asignar rutina") y desde el constructor ("Asignar a
 * alumnos"), y en los dos casos ya se sabe la mitad del par.
 */
function AsignacionDialog({
  alumnos,
  rutinas,
  alumnoPorDefecto,
  rutinaPorDefecto,
  children,
}: {
  alumnos: OpcionAlumno[]
  rutinas: OpcionRutina[]
  alumnoPorDefecto?: string
  rutinaPorDefecto?: string
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar rutina</DialogTitle>
          <DialogDescription>
            Desde la fecha de inicio, el alumno ve esta rutina en &quot;hoy te
            toca&quot;.
          </DialogDescription>
        </DialogHeader>
        <FormularioAsignacion
          alumnos={alumnos}
          rutinas={rutinas}
          alumnoPorDefecto={alumnoPorDefecto}
          rutinaPorDefecto={rutinaPorDefecto}
          onExito={cerrar}
        />
      </DialogContent>
    </Dialog>
  )
}

function FormularioAsignacion({
  alumnos,
  rutinas,
  alumnoPorDefecto,
  rutinaPorDefecto,
  onExito,
}: {
  alumnos: OpcionAlumno[]
  rutinas: OpcionRutina[]
  alumnoPorDefecto?: string
  rutinaPorDefecto?: string
  onExito: () => void
}) {
  const [estado, accion] = useActionState(asignarRutina, null)
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)
  const plantillas = rutinas.filter((r) => r.esPlantilla)
  const propias = rutinas.filter((r) => !r.esPlantilla)

  return (
    <form action={accion} className="flex flex-col gap-4">
      <AvisoDeError estado={estado} />

      <Campo name="alumnoId" label="Alumno" error={errores.alumnoId}>
        <SelectNativo
          {...propsDeCampo("alumnoId", errores.alumnoId)}
          defaultValue={alumnoPorDefecto ?? ""}
          required
        >
          <option value="" disabled>
            Elegí un alumno…
          </option>
          {alumnos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </SelectNativo>
      </Campo>

      <Campo name="rutinaId" label="Rutina" error={errores.rutinaId}>
        <SelectNativo
          {...propsDeCampo("rutinaId", errores.rutinaId)}
          defaultValue={rutinaPorDefecto ?? ""}
          required
        >
          <option value="" disabled>
            Elegí una rutina…
          </option>
          {plantillas.length > 0 ? (
            <optgroup label="Plantillas">
              {plantillas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </optgroup>
          ) : null}
          {propias.length > 0 ? (
            <optgroup label="Rutinas">
              {propias.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </optgroup>
          ) : null}
        </SelectNativo>
      </Campo>

      <div className="grid gap-4 lg:grid-cols-2">
        <Campo name="fechaInicio" label="Desde" error={errores.fechaInicio}>
          <Input
            {...propsDeCampo("fechaInicio", errores.fechaInicio)}
            type="date"
            defaultValue={hoyISO()}
            required
          />
        </Campo>
        <Campo
          name="fechaFin"
          label="Hasta"
          error={errores.fechaFin}
          ayuda="Opcional: se completa al finalizarla."
        >
          <Input {...propsDeCampo("fechaFin", errores.fechaFin)} type="date" />
        </Campo>
      </div>

      <Campo
        name="notas"
        label="Notas"
        error={errores.notas}
        ayuda="Opcional: ajustes para este alumno en particular."
      >
        <Textarea
          {...propsDeCampo("notas", errores.notas)}
          rows={3}
          maxLength={500}
        />
      </Campo>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnviar>Asignar</BotonEnviar>
      </DialogFooter>
    </form>
  )
}

/** Hoy en formato del input date, en hora local: es la fecha que ve el profesor. */
function hoyISO() {
  const hoy = new Date()
  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-")
}

export { AsignacionDialog }
