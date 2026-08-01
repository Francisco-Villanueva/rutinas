"use server";

// ============================================================================
// Sesiones de entrenamiento del alumno.
//
// Es el único módulo de actions que escribe con el alumno como dueño del dato.
// Todo entra por assertEsSesionDelAlumno / assertEsAsignacionDelAlumno: el
// alumno manda ids de su propia pantalla, pero un POST directo podría mandar
// cualquier otro.
//
// Del cliente se acepta lo que el alumno efectivamente cargó (peso, reps, RPE,
// notas). Todo lo demás —qué ejercicio es, cuántas series tiene, qué número le
// toca a cada una— se relee del plan. Ver el comentario de `numeroDeSerie`.
// ============================================================================

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import {
  assertEsAsignacionDelAlumno,
  assertEsSesionDelAlumno,
} from "@/lib/auth/guards";
import { ejecutar, fallo, ok, validar, validarObjeto } from "@/lib/actions/resultado";
import type { ResultadoAction } from "@/lib/actions/resultado";
import { hoyEnGimnasio, rangoDelDia, claveDeHoy } from "@/lib/fechas";
import { actualizarRecords } from "@/lib/entrenamiento/records";
import type { RecordNuevo, SerieParaRecord } from "@/lib/entrenamiento/records";
import { BLOQUE_DE_SERIES } from "@/lib/data/alumno-tipos";
import {
  empezarSesionSchema,
  finalizarSesionSchema,
  guardarEjercicioSchema,
  idSesionSchema,
} from "@/lib/validaciones/sesiones";

function revalidarEntrenamiento(sesionId?: string) {
  revalidatePath("/hoy");
  revalidatePath("/historial");
  if (sesionId) revalidatePath(`/historial/${sesionId}`);
  // El profesor ve el historial y la actividad de sus alumnos.
  revalidatePath("/dashboard");
  revalidatePath("/alumnos");
}

/**
 * Abre la sesión de hoy.
 *
 * Es idempotente: si ya hay una sesión para hoy devuelve esa. Dos toques
 * seguidos en "Empezar" —o dos pestañas abiertas— no tienen que dejar dos
 * sesiones del mismo día compitiendo por los mismos registros.
 */
export async function empezarSesion(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(empezarSesionSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { asignacionId, rutinaDiaId } = validacion.datos;
    const { alumno } = await assertEsAsignacionDelAlumno(asignacionId);

    // El día tiene que ser de la rutina de esa asignación.
    const dia = await prisma.rutinaDia.findFirst({
      where: { id: rutinaDiaId, rutina: { asignaciones: { some: { id: asignacionId } } } },
      select: { id: true },
    });

    if (!dia) {
      return fallo("Ese día no pertenece a la rutina que tenés asignada.");
    }

    const existente = await prisma.sesionEntrenamiento.findFirst({
      where: { alumnoId: alumno.id, fecha: rangoDelDia(claveDeHoy()) },
      orderBy: { creadoEn: "desc" },
      select: { id: true, rutinaDiaId: true, _count: { select: { registros: true } } },
    });

    if (existente) {
      // La sesión de hoy quedó apuntando a otro día: pasa cuando el profesor
      // reasigna la rutina con la sesión ya abierta. Si todavía no se cargó
      // nada, se la reapunta en vez de dejar al alumno con una sesión contra un
      // día que ya no es el suyo.
      if (existente.rutinaDiaId !== rutinaDiaId && existente._count.registros === 0) {
        await prisma.sesionEntrenamiento.update({
          where: { id: existente.id },
          data: { asignacionId, rutinaDiaId, actualizadoEn: new Date() },
        });
      }

      revalidarEntrenamiento(existente.id);
      return ok({ id: existente.id });
    }

    const sesion = await prisma.sesionEntrenamiento.create({
      data: {
        alumnoId: alumno.id,
        asignacionId,
        rutinaDiaId,
        fecha: hoyEnGimnasio(),
        estado: "planificada",
      },
      select: { id: true },
    });

    revalidarEntrenamiento(sesion.id);

    return ok({ id: sesion.id }, "¡A entrenar!");
  });
}

/**
 * Guarda todas las series de un ejercicio de la sesión.
 *
 * Es un upsert por serie dentro de una transacción: el alumno vuelve a esta
 * pantalla varias veces (carga dos series, descansa, sigue), y cada guardado
 * tiene que pisar lo anterior sin duplicar filas.
 */
export async function guardarEjercicio(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validarObjeto(guardarEjercicioSchema, objetoConSeries(formData));
    if (!validacion.ok) return validacion.resultado;

    const { sesionId, rutinaEjercicioId, rpe, notas, series } = validacion.datos;
    const sesion = await assertEsSesionDelAlumno(sesionId);

    if (sesion.estado === "omitida") {
      return fallo("Esta sesión está marcada como omitida.");
    }

    if (!sesion.rutinaDiaId) {
      return fallo("Esta sesión no tiene un día de rutina asociado.");
    }

    // Todas las filas del día, en orden: de acá salen el ejercicio real y el
    // desplazamiento del bloque. Nada de esto se le cree al cliente.
    const filasDelDia = await prisma.rutinaEjercicio.findMany({
      where: { rutinaDiaId: sesion.rutinaDiaId },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        ejercicioId: true,
        series: true,
        ejercicio: { select: { nombre: true } },
      },
    });

    const indice = filasDelDia.findIndex((f) => f.id === rutinaEjercicioId);
    if (indice === -1) {
      return fallo("Ese ejercicio no es parte del entrenamiento de hoy.");
    }

    const fila = filasDelDia[indice];
    const desplazamiento =
      filasDelDia
        .slice(0, indice)
        .filter((f) => f.ejercicioId === fila.ejercicioId).length * BLOQUE_DE_SERIES;

    if (series.length > BLOQUE_DE_SERIES) {
      return fallo("Demasiadas series para un mismo ejercicio.");
    }

    const records = await prisma.$transaction(async (tx) => {
      const guardadas: SerieParaRecord[] = [];

      for (const [posicion, serie] of series.entries()) {
        const numeroSerie = desplazamiento + posicion + 1;

        const registro = await tx.registroEjercicio.upsert({
          where: {
            sesionId_ejercicioId_numeroSerie: {
              sesionId,
              ejercicioId: fila.ejercicioId,
              numeroSerie,
            },
          },
          create: {
            sesionId,
            ejercicioId: fila.ejercicioId,
            rutinaEjercicioId: fila.id,
            numeroSerie,
            peso: serie.peso,
            repeticiones: serie.repeticiones,
            rpe,
            notas,
            completado: serie.completado,
          },
          update: {
            rutinaEjercicioId: fila.id,
            peso: serie.peso,
            repeticiones: serie.repeticiones,
            rpe,
            notas,
            completado: serie.completado,
          },
          select: { id: true },
        });

        guardadas.push({
          ejercicioId: fila.ejercicioId,
          registroEjercicioId: registro.id,
          peso: serie.peso,
          repeticiones: serie.repeticiones,
          completado: serie.completado,
        });
      }

      // Series que sobran de un guardado anterior: si el alumno bajó de 4 a 3,
      // la cuarta tiene que desaparecer y no quedar colgada del ejercicio.
      await tx.registroEjercicio.deleteMany({
        where: {
          sesionId,
          ejercicioId: fila.ejercicioId,
          numeroSerie: {
            gt: desplazamiento + series.length,
            lte: desplazamiento + BLOQUE_DE_SERIES,
          },
        },
      });

      await tx.sesionEntrenamiento.update({
        where: { id: sesionId },
        data: { actualizadoEn: new Date() },
      });

      // En la misma transacción que las series: un PR sin su serie, o una serie
      // que debería haber generado un PR y no lo generó, no se detectan nunca.
      return actualizarRecords(tx, {
        alumnoId: sesion.alumno.id,
        fecha: sesion.fecha,
        series: guardadas,
      });
    });

    revalidarEntrenamiento(sesionId);

    return ok(
      { id: sesionId },
      records.length > 0
        ? `¡Nuevo PR en ${fila.ejercicio.nombre}! ${mejorDe(records)}`
        : "Ejercicio guardado.",
    );
  });
}

/**
 * Cierra la sesión.
 *
 * Recién acá pasa a `completada`, que es lo que mueve el "hoy te toca" al día
 * siguiente. Una sesión abierta a la que el alumno le cargó dos series y se fue
 * no adelanta la rutina.
 */
export async function finalizarSesion(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(finalizarSesionSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, ...datos } = validacion.datos;
    await assertEsSesionDelAlumno(id);

    const registros = await prisma.registroEjercicio.count({ where: { sesionId: id } });

    if (registros === 0) {
      return fallo(
        "Todavía no cargaste ninguna serie. Cargá al menos un ejercicio antes de finalizar.",
      );
    }

    await prisma.sesionEntrenamiento.update({
      where: { id },
      data: { ...datos, estado: "completada", actualizadoEn: new Date() },
    });

    revalidarEntrenamiento(id);

    return ok({ id }, "¡Entrenamiento completado!");
  });
}

/** Vuelve a abrir una sesión finalizada por error. */
export async function reabrirSesion(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idSesionSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    await assertEsSesionDelAlumno(id);

    await prisma.sesionEntrenamiento.update({
      where: { id },
      data: { estado: "planificada", actualizadoEn: new Date() },
    });

    revalidarEntrenamiento(id);

    return ok({ id }, "Sesión reabierta.");
  });
}

/**
 * Descarta la sesión del día.
 *
 * Con series cargadas no se borra: se marca `omitida`. Borrar sería tirar lo
 * que el alumno levantó, y el profesor necesita ver que ese día se abandonó.
 */
export async function descartarSesion(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idSesionSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    await assertEsSesionDelAlumno(id);

    const registros = await prisma.registroEjercicio.count({ where: { sesionId: id } });

    if (registros === 0) {
      await prisma.sesionEntrenamiento.delete({ where: { id } });
      revalidarEntrenamiento();
      return ok({ id }, "Sesión descartada.");
    }

    await prisma.sesionEntrenamiento.update({
      where: { id },
      data: { estado: "omitida", actualizadoEn: new Date() },
    });

    revalidarEntrenamiento(id);

    return ok({ id }, "Sesión marcada como omitida.");
  });
}

/** "102 kg × 5" del PR más pesado, para el aviso. */
function mejorDe(records: RecordNuevo[]) {
  const mejor = records.reduce((a, b) => (b.peso > a.peso ? b : a));
  return `${mejor.peso} kg × ${mejor.repeticiones}`;
}

/**
 * Arma el objeto del formulario de carga, con su lista de series.
 *
 * El FormData trae los campos indexados (`serie-1-peso`, `serie-1-reps`,
 * `serie-1-hecho`, …) porque un objeto plano no puede representar una lista:
 * `objetoDeFormData` se quedaría con la última serie nada más.
 */
function objetoConSeries(formData: FormData) {
  const texto = (clave: string) => {
    const valor = formData.get(clave);
    if (typeof valor !== "string") return undefined;
    const limpio = valor.trim();
    return limpio === "" ? undefined : limpio;
  };

  const cantidad = Number(texto("cantidadSeries") ?? 0);
  const series = [];

  for (let i = 1; i <= cantidad && i <= BLOQUE_DE_SERIES; i++) {
    series.push({
      peso: texto(`serie-${i}-peso`),
      repeticiones: texto(`serie-${i}-reps`),
      // Un checkbox sin tildar no manda nada.
      completado: formData.get(`serie-${i}-hecho`) != null,
    });
  }

  return {
    sesionId: texto("sesionId"),
    rutinaEjercicioId: texto("rutinaEjercicioId"),
    rpe: texto("rpe"),
    notas: texto("notas"),
    series,
  };
}
