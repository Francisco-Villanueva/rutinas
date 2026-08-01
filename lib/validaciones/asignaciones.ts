import { z } from "zod";

import {
  fechaOpcional,
  fechaSchema,
  idSchema,
  textoOpcional,
} from "@/lib/validaciones/comunes";

/**
 * Asignación de una rutina a un alumno.
 *
 * `profesorId` no viaja en el form: sale de la sesión. Los otros dos ids sí,
 * pero la action vuelve a leer ambos filtrando por el profesor logueado antes de
 * insertar.
 */
export const asignarRutinaSchema = z
  .object({
    rutinaId: idSchema,
    alumnoId: idSchema,
    fechaInicio: fechaSchema,
    fechaFin: fechaOpcional,
    notas: textoOpcional("las notas", 500),
  })
  .refine(
    (datos) => datos.fechaFin == null || datos.fechaFin >= datos.fechaInicio,
    {
      error: "La fecha de fin no puede ser anterior a la de inicio.",
      path: ["fechaFin"],
    },
  );

export const cambiarEstadoAsignacionSchema = z.object({
  id: idSchema,
  estado: z.enum(["activa", "completada", "cancelada"], "Estado inválido."),
});

export const idAsignacionSchema = z.object({ id: idSchema });
