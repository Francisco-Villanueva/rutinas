"use client"

import * as React from "react"
import { useActionState } from "react"

import { editarAlumno, invitarAlumno } from "@/lib/actions/alumnos"
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
import {
  AvisoDeError,
  BotonEnviar,
  Campo,
  erroresDe,
  propsDeCampo,
  useCerrarAlExito,
} from "@/components/coach/form"
import type { DatosAlumno } from "@/lib/data/tipos"

/**
 * Alta de un alumno.
 *
 * Le crea la cuenta y lo vincula a este profesor en un solo paso: no existe
 * pantalla de registro público. Ver lib/actions/alumnos.ts.
 */
function InvitarAlumnoDialog({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar alumno</DialogTitle>
          <DialogDescription>
            Se le crea la cuenta con este email. Para entrar, pide un código
            desde la pantalla de ingreso y le llega por mail.
          </DialogDescription>
        </DialogHeader>
        <FormularioInvitacion onExito={cerrar} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioInvitacion({ onExito }: { onExito: () => void }) {
  const [estado, accion] = useActionState(invitarAlumno, null)
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)

  return (
    <form action={accion} className="flex flex-col gap-4">
      <AvisoDeError estado={estado} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Campo name="nombre" label="Nombre" error={errores.nombre}>
          <Input
            {...propsDeCampo("nombre", errores.nombre)}
            maxLength={80}
            required
            autoFocus
            autoComplete="given-name"
          />
        </Campo>
        <Campo name="apellido" label="Apellido" error={errores.apellido}>
          <Input
            {...propsDeCampo("apellido", errores.apellido)}
            maxLength={80}
            autoComplete="family-name"
          />
        </Campo>
      </div>

      <Campo
        name="email"
        label="Email"
        error={errores.email}
        ayuda="Con este email va a entrar a la app."
      >
        <Input
          {...propsDeCampo("email", errores.email)}
          type="email"
          inputMode="email"
          maxLength={160}
          required
          autoComplete="email"
          placeholder="alumno@mail.com"
        />
      </Campo>

      <div className="grid gap-4 lg:grid-cols-2">
        <Campo name="telefono" label="Teléfono" error={errores.telefono} ayuda="Opcional.">
          <Input
            {...propsDeCampo("telefono", errores.telefono)}
            type="tel"
            inputMode="tel"
            maxLength={40}
            autoComplete="tel"
          />
        </Campo>
        <Campo
          name="fechaNacimiento"
          label="Fecha de nacimiento"
          error={errores.fechaNacimiento}
          ayuda="Opcional."
        >
          <Input
            {...propsDeCampo("fechaNacimiento", errores.fechaNacimiento)}
            type="date"
          />
        </Campo>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnviar>Crear cuenta</BotonEnviar>
      </DialogFooter>
    </form>
  )
}

/** Edición de los datos del alumno. El email no se toca: lo maneja Clerk. */
function EditarAlumnoDialog({
  alumno,
  children,
}: {
  alumno: DatosAlumno
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar alumno</DialogTitle>
          <DialogDescription>
            El email ({alumno.email}) es su identidad de acceso y se cambia desde
            Clerk.
          </DialogDescription>
        </DialogHeader>
        <FormularioEdicion alumno={alumno} onExito={cerrar} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioEdicion({
  alumno,
  onExito,
}: {
  alumno: DatosAlumno
  onExito: () => void
}) {
  const [estado, accion] = useActionState(editarAlumno, null)
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={alumno.id} />

      <AvisoDeError estado={estado} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Campo name="nombre" label="Nombre" error={errores.nombre}>
          <Input
            {...propsDeCampo("nombre", errores.nombre)}
            defaultValue={alumno.nombre}
            maxLength={80}
            required
            autoFocus
          />
        </Campo>
        <Campo name="apellido" label="Apellido" error={errores.apellido}>
          <Input
            {...propsDeCampo("apellido", errores.apellido)}
            defaultValue={alumno.apellido ?? ""}
            maxLength={80}
          />
        </Campo>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Campo name="telefono" label="Teléfono" error={errores.telefono}>
          <Input
            {...propsDeCampo("telefono", errores.telefono)}
            defaultValue={alumno.telefono ?? ""}
            type="tel"
            inputMode="tel"
            maxLength={40}
          />
        </Campo>
        <Campo
          name="fechaNacimiento"
          label="Fecha de nacimiento"
          error={errores.fechaNacimiento}
        >
          <Input
            {...propsDeCampo("fechaNacimiento", errores.fechaNacimiento)}
            type="date"
            defaultValue={alumno.fechaNacimiento ?? ""}
          />
        </Campo>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnviar>Guardar cambios</BotonEnviar>
      </DialogFooter>
    </form>
  )
}

export { EditarAlumnoDialog, InvitarAlumnoDialog }
