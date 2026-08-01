import "server-only";

import { prisma } from "@/lib/db";
import { requireAlumno } from "@/lib/auth/guards";
import {
  claveDeFecha,
  claveDeHoy,
  cuandoLegible,
  diasEntre,
  sumarDias,
} from "@/lib/fechas";
import {
  calcularAdherencia,
  calcularRacha,
  ejercicioPrincipal,
  serieDeFuerza,
  ultimasSemanas,
  volumenPorSemana,
} from "@/lib/entrenamiento/metricas";
import type { SerieParaMetricas } from "@/lib/entrenamiento/metricas";

// ============================================================================
// Progreso del alumno: sus PRs y su evolución.
//
// Es la contracara de lo que ve el profesor en el detalle del alumno, con los
// mismos cálculos (lib/entrenamiento/metricas.ts) para que los dos vean el
// mismo número. Sin métricas corporales: quedaron postergadas.
// ============================================================================

const SEMANAS_DE_GRAFICO = 6;

export type PrDelAlumno = {
  id: string;
  ejercicio: string;
  peso: number;
  repeticiones: number;
  rmEstimado: number | null;
  cuando: string;
  /** Conseguido en los últimos siete días. */
  esReciente: boolean;
};

export type PantallaProgreso = {
  racha: number;
  entrenamientos: number;
  adherencia: number | null;
  mesociclo: { rutina: string; semana: number; semanas: number | null } | null;
  prs: PrDelAlumno[];
  fuerza: { ejercicio: string; serie: number[] } | null;
  volumenSemanal: { label: string; valor: number }[];
};

export async function getProgreso(): Promise<PantallaProgreso> {
  const alumno = await requireAlumno();
  const hoy = claveDeHoy();
  const semanas = ultimasSemanas(SEMANAS_DE_GRAFICO, hoy);
  const desde = semanas[0].clave;

  const [asignacion, completadas, records, registros] = await Promise.all([
    prisma.asignacionRutina.findFirst({
      where: { alumnoId: alumno.id, estado: "activa" },
      orderBy: { fechaInicio: "desc" },
      select: {
        fechaInicio: true,
        rutina: {
          select: { nombre: true, duracionSemanas: true, diasPorSemana: true },
        },
      },
    }),
    prisma.sesionEntrenamiento.findMany({
      where: { alumnoId: alumno.id, estado: "completada" },
      orderBy: { fecha: "desc" },
      select: { fecha: true },
    }),
    prisma.recordPersonal.findMany({
      where: { alumnoId: alumno.id },
      orderBy: [{ fecha: "desc" }, { rmEstimado: "desc" }],
      take: 12,
      select: {
        id: true,
        peso: true,
        repeticiones: true,
        rmEstimado: true,
        fecha: true,
        ejercicio: { select: { nombre: true } },
      },
    }),
    prisma.registroEjercicio.findMany({
      where: {
        sesion: {
          alumnoId: alumno.id,
          fecha: { gte: new Date(`${desde}T00:00:00.000Z`) },
        },
      },
      select: {
        peso: true,
        repeticiones: true,
        completado: true,
        ejercicioId: true,
        ejercicio: { select: { nombre: true } },
        sesion: { select: { fecha: true } },
      },
    }),
  ]);

  const claves = completadas.map((s) => claveDeFecha(s.fecha));
  const series: SerieParaMetricas[] = registros.map((registro) => ({
    clave: claveDeFecha(registro.sesion.fecha),
    ejercicioId: registro.ejercicioId,
    ejercicio: registro.ejercicio.nombre,
    peso: registro.peso == null ? null : Number(registro.peso),
    repeticiones: registro.repeticiones,
    completado: registro.completado,
  }));

  const inicio = asignacion ? claveDeFecha(asignacion.fechaInicio) : null;
  const principal = ejercicioPrincipal(series);
  const haceUnaSemana = sumarDias(hoy, -7);

  const fuerza = principal
    ? serieDeFuerza(series, principal.ejercicioId, semanas)
    : [];

  return {
    racha: calcularRacha(claves, hoy),
    entrenamientos: completadas.length,
    adherencia:
      asignacion && inicio
        ? calcularAdherencia({
            completadas: completadas.length,
            inicio,
            diasPorSemana: asignacion.rutina.diasPorSemana,
            duracionSemanas: asignacion.rutina.duracionSemanas,
            hoy,
          })
        : null,
    mesociclo:
      asignacion && inicio
        ? {
            rutina: asignacion.rutina.nombre,
            semana: semanaEnCurso(inicio, hoy),
            semanas: asignacion.rutina.duracionSemanas,
          }
        : null,
    prs: records.map((record) => {
      const clave = claveDeFecha(record.fecha);

      return {
        id: record.id,
        ejercicio: record.ejercicio.nombre,
        peso: Number(record.peso),
        repeticiones: record.repeticiones,
        rmEstimado:
          record.rmEstimado == null ? null : Math.round(Number(record.rmEstimado)),
        cuando: cuandoLegible(clave, hoy),
        esReciente: clave >= haceUnaSemana,
      };
    }),
    // Con un solo punto no hay evolución que mostrar.
    fuerza:
      principal && fuerza.length >= 2
        ? { ejercicio: principal.nombre, serie: fuerza }
        : null,
    volumenSemanal: volumenPorSemana(series, semanas),
  };
}

function semanaEnCurso(inicio: string, hoy: string) {
  return Math.floor(Math.max(0, diasEntre(inicio, hoy)) / 7) + 1;
}
