import "server-only";

// ============================================================================
// Récords personales.
//
// `records_personales` tiene un único por (alumno, ejercicio, repeticiones): es
// una tabla de rep-maxes, no un historial. Cada fila responde "cuál es el peso
// más alto que levantó para esa cantidad de repeticiones", y se pisa cuando lo
// mejora. El historial completo vive en `registros_ejercicio`, así que no se
// pierde nada.
//
// Se recalcula al guardar el ejercicio, dentro de la misma transacción: si se
// hiciera después, una caída entre medio dejaría series cargadas sin su PR y
// nadie volvería a mirarlas.
// ============================================================================

import type { Prisma } from "@/generated/prisma/client";
import { rmEstimado } from "@/lib/entrenamiento/rm";

export type SerieParaRecord = {
  ejercicioId: string;
  registroEjercicioId?: string | null;
  peso: number | null;
  repeticiones: number | null;
  completado: boolean;
};

export type RecordNuevo = {
  ejercicioId: string;
  peso: number;
  repeticiones: number;
  rmEstimado: number | null;
};

/**
 * Guarda los PRs que correspondan y devuelve los que efectivamente son nuevos.
 *
 * Solo miran las series confirmadas: una serie tildada es una serie que pasó,
 * y una que quedó sin tildar es justamente la que no pudo con el peso.
 *
 * `fecha` es la de la sesión y no la de hoy: si el alumno carga el lunes lo que
 * hizo el sábado, el PR es del sábado.
 */
export async function actualizarRecords(
  tx: Prisma.TransactionClient,
  {
    alumnoId,
    fecha,
    series,
  }: { alumnoId: string; fecha: Date; series: SerieParaRecord[] },
): Promise<RecordNuevo[]> {
  const candidatas = series.filter(
    (s) =>
      s.completado &&
      s.peso != null &&
      s.peso > 0 &&
      s.repeticiones != null &&
      s.repeticiones > 0,
  );

  if (candidatas.length === 0) return [];

  // Si el alumno hizo 3×8 con pesos distintos, para 8 repeticiones solo compite
  // la más pesada: quedarse con el máximo por (ejercicio, reps) evita tres
  // escrituras sobre la misma fila.
  const mejores = new Map<string, SerieParaRecord>();

  for (const serie of candidatas) {
    const clave = `${serie.ejercicioId}:${serie.repeticiones}`;
    const actual = mejores.get(clave);
    if (!actual || serie.peso! > actual.peso!) mejores.set(clave, serie);
  }

  const nuevos: RecordNuevo[] = [];

  for (const serie of mejores.values()) {
    const peso = serie.peso!;
    const repeticiones = serie.repeticiones!;

    const previo = await tx.recordPersonal.findUnique({
      where: {
        alumnoId_ejercicioId_repeticiones: {
          alumnoId,
          ejercicioId: serie.ejercicioId,
          repeticiones,
        },
      },
      select: { peso: true },
    });

    // Empatar no es superar: el PR se mantiene con su fecha original.
    if (previo && Number(previo.peso) >= peso) continue;

    const estimado = rmEstimado(peso, repeticiones);

    await tx.recordPersonal.upsert({
      where: {
        alumnoId_ejercicioId_repeticiones: {
          alumnoId,
          ejercicioId: serie.ejercicioId,
          repeticiones,
        },
      },
      create: {
        alumnoId,
        ejercicioId: serie.ejercicioId,
        registroEjercicioId: serie.registroEjercicioId ?? null,
        peso,
        repeticiones,
        rmEstimado: estimado,
        fecha,
      },
      update: {
        registroEjercicioId: serie.registroEjercicioId ?? null,
        peso,
        rmEstimado: estimado,
        fecha,
      },
    });

    nuevos.push({
      ejercicioId: serie.ejercicioId,
      peso,
      repeticiones,
      rmEstimado: estimado,
    });
  }

  return nuevos;
}
