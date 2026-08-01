"use server";

// ============================================================================
// Constructor de rutinas: rutina -> días -> ejercicios del día.
//
// Cada action vuelve a leer la fila filtrando por el profesor logueado (los
// assert* de lib/auth/guards.ts). El id que manda el cliente sirve para saber
// *sobre qué* operar, nunca como prueba de que le corresponda.
// ============================================================================

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import {
  assertEsProfesorDeDia,
  assertEsProfesorDeRutina,
  assertEsProfesorDeRutinaEjercicio,
  requireProfesor,
} from "@/lib/auth/guards";
import { ejecutar, fallo, ok, validar } from "@/lib/actions/resultado";
import type { ResultadoAction } from "@/lib/actions/resultado";
import {
  agregarEjercicioSchema,
  crearDiaSchema,
  crearRutinaSchema,
  editarDiaSchema,
  editarEjercicioDeDiaSchema,
  editarRutinaSchema,
  idDiaSchema,
  idEjercicioDeDiaSchema,
  idRutinaSchema,
  moverEjercicioSchema,
} from "@/lib/validaciones/rutinas";

/**
 * El nombre y el estado de una rutina se ven en cuatro pantallas: el
 * constructor, las plantillas de asignaciones, la tarjeta de cada alumno y el
 * panel. Todas son dinámicas, así que revalidarlas juntas no cuesta nada.
 */
function revalidarRutinas() {
  revalidatePath("/rutinas");
  revalidatePath("/asignaciones");
  revalidatePath("/alumnos");
  revalidatePath("/dashboard");
}

/** Marca la rutina como tocada: el constructor abre la más reciente. */
async function marcarActualizada(rutinaId: string) {
  await prisma.rutina.update({
    where: { id: rutinaId },
    data: { actualizadoEn: new Date() },
  });
}

// ----------------------------------------------------------------------------
// Rutina
// ----------------------------------------------------------------------------

export async function crearRutina(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const profesor = await requireProfesor();

    const validacion = validar(crearRutinaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const rutina = await prisma.rutina.create({
      data: { ...validacion.datos, profesorId: profesor.id },
      select: { id: true },
    });

    revalidarRutinas();

    return ok({ id: rutina.id }, "Rutina creada.");
  });
}

export async function editarRutina(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(editarRutinaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, ...datos } = validacion.datos;
    await assertEsProfesorDeRutina(id);

    await prisma.rutina.update({
      where: { id },
      data: { ...datos, actualizadoEn: new Date() },
    });

    revalidarRutinas();

    return ok({ id }, "Rutina actualizada.");
  });
}

/**
 * Baja lógica de la rutina.
 *
 * Un DELETE cascadea a `asignaciones_rutina`, y al desaparecer la asignación,
 * las sesiones que colgaban de ella quedan con `asignacion_id` en NULL: el
 * historial del alumno pierde contra qué plan entrenó. Por eso `activo = false`.
 */
export async function eliminarRutina(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idRutinaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    await assertEsProfesorDeRutina(id);

    const asignacionesActivas = await prisma.asignacionRutina.count({
      where: { rutinaId: id, estado: "activa" },
    });

    if (asignacionesActivas > 0) {
      return fallo(
        `No podés archivar esta rutina: la están usando ${asignacionesActivas} ${
          asignacionesActivas === 1 ? "alumno" : "alumnos"
        }. Finalizá esas asignaciones primero.`,
      );
    }

    await prisma.rutina.update({
      where: { id },
      data: { activo: false, actualizadoEn: new Date() },
    });

    revalidarRutinas();

    return ok({ id }, "Rutina archivada.");
  });
}

/**
 * Clona una rutina completa (días y ejercicios incluidos) en una nueva.
 *
 * Es el uso real de las plantillas: el profesor arma un plan base y lo adapta
 * por alumno. La copia nunca nace como plantilla, o cada adaptación ensuciaría
 * la lista de plantillas.
 */
export async function duplicarRutina(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idRutinaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { profesor } = await assertEsProfesorDeRutina(validacion.datos.id);

    const original = await prisma.rutina.findUniqueOrThrow({
      where: { id: validacion.datos.id },
      select: {
        nombre: true,
        descripcion: true,
        objetivo: true,
        duracionSemanas: true,
        diasPorSemana: true,
        dias: {
          orderBy: { numeroDia: "asc" },
          select: {
            numeroDia: true,
            nombre: true,
            notas: true,
            ejercicios: {
              orderBy: { orden: "asc" },
              select: {
                ejercicioId: true,
                orden: true,
                series: true,
                repeticionesMin: true,
                repeticionesMax: true,
                pesoSugerido: true,
                descansoSegundos: true,
                tempo: true,
                notas: true,
              },
            },
          },
        },
      },
    });

    const { dias, nombre, ...cabecera } = original;

    // Un create anidado: Prisma lo resuelve en una sola transacción, así que no
    // puede quedar una rutina a medio copiar.
    const copia = await prisma.rutina.create({
      data: {
        ...cabecera,
        nombre: nombreDeCopia(nombre),
        profesorId: profesor.id,
        esPlantilla: false,
        dias: {
          create: dias.map((dia) => ({
            numeroDia: dia.numeroDia,
            nombre: dia.nombre,
            notas: dia.notas,
            ejercicios: { create: dia.ejercicios },
          })),
        },
      },
      select: { id: true },
    });

    revalidarRutinas();

    return ok({ id: copia.id }, "Rutina duplicada.");
  });
}

/** "Fuerza 4 días" -> "Fuerza 4 días (copia)", respetando el largo máximo. */
function nombreDeCopia(nombre: string) {
  const sufijo = " (copia)";
  return `${nombre.slice(0, 120 - sufijo.length)}${sufijo}`;
}

// ----------------------------------------------------------------------------
// Días
// ----------------------------------------------------------------------------

export async function crearDia(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(crearDiaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { rutinaId, ...datos } = validacion.datos;
    await assertEsProfesorDeRutina(rutinaId);

    // uq_rutina_dia es (rutina_id, numero_dia): el número lo pone el servidor.
    const ultimo = await prisma.rutinaDia.aggregate({
      where: { rutinaId },
      _max: { numeroDia: true },
    });

    const dia = await prisma.rutinaDia.create({
      data: { ...datos, rutinaId, numeroDia: (ultimo._max.numeroDia ?? 0) + 1 },
      select: { id: true },
    });

    await marcarActualizada(rutinaId);
    revalidarRutinas();

    return ok({ id: dia.id }, "Día agregado.");
  });
}

export async function editarDia(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(editarDiaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, ...datos } = validacion.datos;
    const { rutinaId } = await assertEsProfesorDeDia(id);

    await prisma.rutinaDia.update({ where: { id }, data: datos });

    await marcarActualizada(rutinaId);
    revalidarRutinas();

    return ok({ id }, "Día actualizado.");
  });
}

/**
 * Borrado real del día: `rutina_ejercicios` cae por CASCADE y las sesiones que
 * apuntaban a él quedan con `rutina_dia_id` en NULL (ON DELETE SET NULL). El
 * historial de lo que el alumno levantó vive en `registros_ejercicio` y no se
 * toca.
 */
export async function eliminarDia(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idDiaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    const { rutinaId } = await assertEsProfesorDeDia(id);

    await prisma.$transaction(async (tx) => {
      await tx.rutinaDia.delete({ where: { id } });

      // Renumerar para que no queden huecos ("Día 1, Día 3") ni choque el
      // próximo alta contra uq_rutina_dia.
      const restantes = await tx.rutinaDia.findMany({
        where: { rutinaId },
        orderBy: { numeroDia: "asc" },
        select: { id: true, numeroDia: true },
      });

      for (const [indice, dia] of restantes.entries()) {
        if (dia.numeroDia !== indice + 1) {
          await tx.rutinaDia.update({
            where: { id: dia.id },
            data: { numeroDia: indice + 1 },
          });
        }
      }
    });

    await marcarActualizada(rutinaId);
    revalidarRutinas();

    return ok({ id }, "Día eliminado.");
  });
}

// ----------------------------------------------------------------------------
// Ejercicios del día
// ----------------------------------------------------------------------------

export async function agregarEjercicioADia(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(agregarEjercicioSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { rutinaDiaId, ejercicioId, ...datos } = validacion.datos;
    const { profesor, rutinaId } = await assertEsProfesorDeDia(rutinaDiaId);

    // El ejercicio tiene que ser visible para este profesor: del catálogo
    // público o de su gimnasio. Sin esto se podría colar el ejercicio privado
    // de otro gimnasio mandando su id.
    const visible = await prisma.ejercicio.findFirst({
      where: {
        id: ejercicioId,
        activo: true,
        OR: [{ esPublico: true }, { gimnasioId: profesor.gimnasioId }],
      },
      select: { id: true },
    });

    if (!visible) {
      return fallo("Ese ejercicio no está disponible.", {
        ejercicioId: ["Elegí un ejercicio de la biblioteca."],
      });
    }

    const ultimo = await prisma.rutinaEjercicio.aggregate({
      where: { rutinaDiaId },
      _max: { orden: true },
    });

    const fila = await prisma.rutinaEjercicio.create({
      data: {
        ...datos,
        rutinaDiaId,
        ejercicioId,
        orden: (ultimo._max.orden ?? -1) + 1,
      },
      select: { id: true },
    });

    await marcarActualizada(rutinaId);
    revalidarRutinas();

    return ok({ id: fila.id }, "Ejercicio agregado al día.");
  });
}

export async function editarEjercicioDeDia(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(editarEjercicioDeDiaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, ejercicioId, ...datos } = validacion.datos;
    const { profesor, rutinaDiaId } = await assertEsProfesorDeRutinaEjercicio(id);

    const visible = await prisma.ejercicio.findFirst({
      where: {
        id: ejercicioId,
        activo: true,
        OR: [{ esPublico: true }, { gimnasioId: profesor.gimnasioId }],
      },
      select: { id: true },
    });

    if (!visible) {
      return fallo("Ese ejercicio no está disponible.", {
        ejercicioId: ["Elegí un ejercicio de la biblioteca."],
      });
    }

    await prisma.rutinaEjercicio.update({
      where: { id },
      data: { ...datos, ejercicioId },
    });

    const dia = await prisma.rutinaDia.findUniqueOrThrow({
      where: { id: rutinaDiaId },
      select: { rutinaId: true },
    });

    await marcarActualizada(dia.rutinaId);
    revalidarRutinas();

    return ok({ id }, "Ejercicio actualizado.");
  });
}

/**
 * Saca el ejercicio del día. Es un DELETE real: los registros que el alumno ya
 * cargó apuntan a esta fila con ON DELETE SET NULL, así que conservan el peso y
 * las repeticiones reales aunque el plan haya cambiado.
 */
export async function quitarEjercicioDeDia(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idEjercicioDeDiaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    const { rutinaDiaId } = await assertEsProfesorDeRutinaEjercicio(id);

    await prisma.rutinaEjercicio.delete({ where: { id } });
    await renumerarDia(rutinaDiaId);

    const dia = await prisma.rutinaDia.findUniqueOrThrow({
      where: { id: rutinaDiaId },
      select: { rutinaId: true },
    });

    await marcarActualizada(dia.rutinaId);
    revalidarRutinas();

    return ok({ id }, "Ejercicio quitado del día.");
  });
}

/** Sube o baja un ejercicio una posición dentro de su día. */
export async function moverEjercicio(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(moverEjercicioSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, direccion } = validacion.datos;
    const { rutinaDiaId } = await assertEsProfesorDeRutinaEjercicio(id);

    const filas = await prisma.rutinaEjercicio.findMany({
      where: { rutinaDiaId },
      orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
      select: { id: true },
    });

    const actual = filas.findIndex((f) => f.id === id);
    const destino = direccion === "arriba" ? actual - 1 : actual + 1;

    // Ya está en la punta: no es un error, simplemente no hay nada que mover.
    if (destino < 0 || destino >= filas.length) return ok({ id });

    const orden = filas.map((f) => f.id);
    [orden[actual], orden[destino]] = [orden[destino], orden[actual]];

    // Se reescribe el orden entero en vez de intercambiar dos valores: si dos
    // filas quedaron con el mismo `orden` (el default de la columna es 0), un
    // swap las deja igual de empatadas.
    await prisma.$transaction(
      orden.map((filaId, indice) =>
        prisma.rutinaEjercicio.update({
          where: { id: filaId },
          data: { orden: indice },
        }),
      ),
    );

    const dia = await prisma.rutinaDia.findUniqueOrThrow({
      where: { id: rutinaDiaId },
      select: { rutinaId: true },
    });

    await marcarActualizada(dia.rutinaId);
    revalidarRutinas();

    return ok({ id });
  });
}

/** Deja el `orden` del día como 0..n-1, sin huecos ni empates. */
async function renumerarDia(rutinaDiaId: string) {
  const filas = await prisma.rutinaEjercicio.findMany({
    where: { rutinaDiaId },
    orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
    select: { id: true, orden: true },
  });

  const desordenadas = filas.filter((fila, indice) => fila.orden !== indice);
  if (desordenadas.length === 0) return;

  await prisma.$transaction(
    filas.map((fila, indice) =>
      prisma.rutinaEjercicio.update({
        where: { id: fila.id },
        data: { orden: indice },
      }),
    ),
  );
}
