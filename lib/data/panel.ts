import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { getAlumnos } from "@/lib/data/alumnos";
import { claveDeFecha, claveDeHoy, cuandoLegible, semanaDe } from "@/lib/fechas";
import { formatoVolumen } from "@/lib/entrenamiento/metricas";
import type { EventoActividad, PanelProfesor } from "@/lib/data/tipos";

/** Cuántos eventos entran en la columna de actividad. */
const EVENTOS = 8;

/**
 * Datos del panel: los alumnos con sus métricas más la actividad reciente.
 *
 * La actividad se arma con dos queries (PRs y sesiones completadas) y se
 * mezclan en memoria. Es la alternativa razonable a una tabla de eventos:
 * mantener un feed materializado obliga a escribir en él desde cada action y a
 * limpiarlo, para un panel que muestra ocho líneas.
 */
export async function getPanelProfesor(): Promise<PanelProfesor> {
  // getAlumnos ya exige el rol; se repite acá para que este módulo no dependa
  // de que su colaborador lo haga.
  await requireProfesor();
  const { alumnos } = await getAlumnos();

  const alumnoIds = alumnos.map((a) => a.id);

  if (alumnoIds.length === 0) {
    return { alumnos, actividad: [], prsSemana: 0 };
  }

  const hoy = claveDeHoy();
  const lunes = new Date(`${semanaDe(hoy)[0]}T00:00:00.000Z`);
  const nombrePorId = new Map(alumnos.map((a) => [a.id, a.nombre]));

  const [records, sesiones, prsSemana] = await Promise.all([
    prisma.recordPersonal.findMany({
      where: { alumnoId: { in: alumnoIds } },
      orderBy: { creadoEn: "desc" },
      take: EVENTOS,
      select: {
        id: true,
        alumnoId: true,
        peso: true,
        repeticiones: true,
        rmEstimado: true,
        fecha: true,
        creadoEn: true,
        ejercicio: { select: { nombre: true } },
      },
    }),
    prisma.sesionEntrenamiento.findMany({
      where: { alumnoId: { in: alumnoIds }, estado: "completada" },
      orderBy: [{ fecha: "desc" }, { actualizadoEn: "desc" }],
      take: EVENTOS,
      select: {
        id: true,
        alumnoId: true,
        fecha: true,
        actualizadoEn: true,
        rpeGeneral: true,
        rutinaDia: { select: { nombre: true } },
        registros: { select: { peso: true, repeticiones: true, completado: true } },
      },
    }),
    prisma.recordPersonal.count({
      where: { alumnoId: { in: alumnoIds }, creadoEn: { gte: lunes } },
    }),
  ]);

  const deRecords: (EventoActividad & { orden: number })[] = records.map((record) => {
    const estimado = record.rmEstimado == null ? null : Number(record.rmEstimado);

    return {
      id: `pr-${record.id}`,
      alumno: nombrePorId.get(record.alumnoId) ?? "",
      tipo: "pr" as const,
      texto: `Nuevo PR en ${record.ejercicio.nombre}`,
      detalle: [
        `${Number(record.peso)} kg × ${record.repeticiones}`,
        estimado != null ? `1RM est. ${Math.round(estimado)} kg` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      cuando: cuandoLegible(claveDeFecha(record.fecha), hoy),
      orden: record.creadoEn.getTime(),
    };
  });

  const deSesiones: (EventoActividad & { orden: number })[] = sesiones.map((sesion) => {
    const volumen = sesion.registros.reduce(
      (total, r) =>
        total + (r.completado ? Number(r.peso ?? 0) * (r.repeticiones ?? 0) : 0),
      0,
    );

    return {
      id: `sesion-${sesion.id}`,
      alumno: nombrePorId.get(sesion.alumnoId) ?? "",
      tipo: "sesion" as const,
      texto: `Completó ${sesion.rutinaDia?.nombre ?? "un entrenamiento"}`,
      detalle:
        [
          formatoVolumen(volumen),
          sesion.rpeGeneral != null ? `RPE ${sesion.rpeGeneral}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Sin series cargadas",
      cuando: cuandoLegible(claveDeFecha(sesion.fecha), hoy),
      orden: sesion.actualizadoEn.getTime(),
    };
  });

  const actividad: EventoActividad[] = [...deRecords, ...deSesiones]
    .sort((a, b) => b.orden - a.orden)
    .slice(0, EVENTOS)
    // `orden` es un timestamp que solo sirve para mezclar las dos listas acá;
    // al cliente le llega el texto ya formateado en `cuando`.
    .map((evento) => ({
      id: evento.id,
      alumno: evento.alumno,
      tipo: evento.tipo,
      texto: evento.texto,
      detalle: evento.detalle,
      cuando: evento.cuando,
    }));

  return { alumnos, actividad, prsSemana };
}
