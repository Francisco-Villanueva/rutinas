import { z } from "zod";

import {
  fechaOpcional,
  idSchema,
  textoOpcional,
  textoRequerido,
} from "@/lib/validaciones/comunes";

/**
 * Alta de un alumno por parte de su profesor.
 *
 * No hay registro público: el email es la identidad con la que Clerk crea la
 * cuenta, así que se normaliza a minúsculas antes de tocar la base (la columna
 * `usuarios.email` es UNIQUE y Postgres distingue mayúsculas).
 */
export const invitarAlumnoSchema = z.object({
  nombre: textoRequerido("el nombre", 80),
  apellido: textoOpcional("el apellido", 80),
  email: z
    .email("Ingresá un email válido.")
    .max(160, "El email no puede superar los 160 caracteres.")
    .transform((valor) => valor.toLowerCase()),
  telefono: textoOpcional("el teléfono", 40),
  fechaNacimiento: fechaOpcional,
});

/** Datos del alumno que edita el profesor. El email no: lo maneja Clerk. */
export const editarAlumnoSchema = z.object({
  id: idSchema,
  nombre: textoRequerido("el nombre", 80),
  apellido: textoOpcional("el apellido", 80),
  telefono: textoOpcional("el teléfono", 40),
  fechaNacimiento: fechaOpcional,
});

export const cambiarEstadoAlumnoSchema = z.object({
  id: idSchema,
  activo: z.enum(["true", "false"], "Estado inválido.").transform((v) => v === "true"),
});
