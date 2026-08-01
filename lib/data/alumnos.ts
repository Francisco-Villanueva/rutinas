import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { iniciales, nombreCompleto } from "@/lib/utils";
import {
  claveDeFecha,
  claveDeHoy,
  diasEntre,
  fechaLegible,
  sumarDias,
} from "@/lib/fechas";
import {
  calcularAdherencia,
  calcularRacha,
  diasSinEntrenar,
  ejercicioPrincipal,
  formatoVolumen,
  serieDeFuerza,
  ultimaSesionLegible,
  ultimasSemanas,
  volumenPorSemana,
  volumenTotal,
} from "@/lib/entrenamiento/metricas";
import type { SerieParaMetricas } from "@/lib/entrenamiento/metricas";
import type { AlumnoDetalle, AlumnoPanel, TonoAlerta } from "@/lib/data/tipos";

// ============================================================================
// Lectura de alumnos del profesor.
//
// Las métricas (adherencia, racha, volumen, 1RM) se calculan al leer con las
// funciones puras de lib/entrenamiento/metricas.ts. Las sesiones de todos los
// alumnos se traen en una sola query y se agregan en memoria: son decenas de
// alumnos con unos cientos de sesiones cada uno, no vale la pena una vista
// materializada ni un group by por alumno.
// ============================================================================

/** Ventana de historia que se mira para las métricas de la lista. */
const DIAS_DE_HISTORIA = 180;

/** Semanas que entran en los gráficos del detalle. */
const SEMANAS_DE_GRAFICO = 6;

const SELECT_ASIGNACION_ACTIVA = {
  where: { estado: "activa" },
  orderBy: { fechaInicio: "desc" },
  take: 1,
  select: {
    fechaInicio: true,
    rutina: {
      select: {
        nombre: true,
        objetivo: true,
        duracionSemanas: true,
        diasPorSemana: true,
      },
    },
  },
} as const;

type FilaAlumno = {
  id: string;
  nombre: string;
  apellido: string | null;
  activo: boolean;
  asignacionesComoAlumno: {
    fechaInicio: Date;
    rutina: {
      nombre: string;
      objetivo: string | null;
      duracionSemanas: number | null;
      diasPorSemana: number | null;
    };
  }[];
};

/** Sesiones completadas de un alumno, ya reducidas a lo que usan las métricas. */
type HistoriaDeAlumno = {
  claves: string[];
  ultima: string | null;
  completadas: number;
};

const SIN_HISTORIA: HistoriaDeAlumno = { claves: [], ultima: null, completadas: 0 };

/**
 * Sesiones completadas de varios alumnos en una sola query, agrupadas por
 * alumno.
 */
async function historiaDe(
  alumnoIds: string[],
  desde: string,
): Promise<Map<string, HistoriaDeAlumno>> {
  if (alumnoIds.length === 0) return new Map();

  const sesiones = await prisma.sesionEntrenamiento.findMany({
    where: {
      alumnoId: { in: alumnoIds },
      estado: "completada",
      fecha: { gte: new Date(`${desde}T00:00:00.000Z`) },
    },
    orderBy: { fecha: "desc" },
    select: { alumnoId: true, fecha: true },
  });

  const porAlumno = new Map<string, HistoriaDeAlumno>();

  for (const sesion of sesiones) {
    const clave = claveDeFecha(sesion.fecha);
    const actual = porAlumno.get(sesion.alumnoId);

    if (actual) {
      actual.claves.push(clave);
      actual.completadas++;
    } else {
      // Vienen ordenadas por fecha desc: la primera de cada alumno es la última
      // que entrenó.
      porAlumno.set(sesion.alumnoId, {
        claves: [clave],
        ultima: clave,
        completadas: 1,
      });
    }
  }

  return porAlumno;
}

function aAlumnoPanel(alumno: FilaAlumno, historia: HistoriaDeAlumno): AlumnoPanel {
  const hoy = claveDeHoy();
  const asignacion = alumno.asignacionesComoAlumno[0];
  const inicio = asignacion ? claveDeFecha(asignacion.fechaInicio) : null;

  const adherencia =
    asignacion && inicio
      ? calcularAdherencia({
          completadas: historia.completadas,
          inicio,
          diasPorSemana: asignacion.rutina.diasPorSemana,
          duracionSemanas: asignacion.rutina.duracionSemanas,
          hoy,
        })
      : null;

  const semana = inicio ? semanaEnCurso(inicio, hoy) : null;
  const semanas = asignacion?.rutina.duracionSemanas ?? null;
  const sinEntrenar = diasSinEntrenar(historia.ultima, hoy);

  return {
    id: alumno.id,
    nombre: nombreCompleto(alumno.nombre, alumno.apellido),
    iniciales: iniciales(alumno.nombre, alumno.apellido),
    objetivo: asignacion?.rutina.objetivo ?? null,
    estado: alumno.activo ? "activo" : "ausente",
    ultimaSesion: ultimaSesionLegible(historia.ultima, hoy),
    adherencia,
    racha: calcularRacha(historia.claves, hoy),
    alerta: calcularAlerta({
      tieneRutina: asignacion != null,
      sinEntrenar,
      adherencia,
      semana,
      semanas,
    }),
    plan: asignacion?.rutina.nombre ?? null,
    semana,
    semanas,
  };
}

/**
 * Qué destacar de un alumno, en orden de urgencia: primero que dejó de venir,
 * después que se le terminó el plan, y al final la adherencia floja.
 *
 * Solo una alerta por alumno: la lista sirve para decidir a quién llamar hoy, y
 * tres etiquetas por tarjeta no ayudan a decidir nada.
 */
function calcularAlerta({
  tieneRutina,
  sinEntrenar,
  adherencia,
  semana,
  semanas,
}: {
  tieneRutina: boolean;
  sinEntrenar: number | null;
  adherencia: number | null;
  semana: number | null;
  semanas: number | null;
}): { texto: string; tono: TonoAlerta } | null {
  if (!tieneRutina) {
    return { texto: "Sin rutina asignada", tono: "info" };
  }

  if (sinEntrenar == null) {
    return { texto: "Todavía no empezó", tono: "warning" };
  }

  if (sinEntrenar >= 7) {
    return { texto: `Inactivo ${sinEntrenar} días`, tono: "destructive" };
  }

  if (semana != null && semanas != null && semana > semanas) {
    return { texto: "Mesociclo completo", tono: "info" };
  }

  if (adherencia != null && adherencia < 60) {
    return { texto: `Adherencia ${adherencia}%`, tono: "warning" };
  }

  return null;
}

/** Los alumnos vinculados al profesor logueado, ordenados por nombre. */
export async function getAlumnos(): Promise<{ alumnos: AlumnoPanel[] }> {
  const profesor = await requireProfesor();

  const vinculos = await prisma.profesorAlumno.findMany({
    where: { profesorId: profesor.id, activo: true },
    orderBy: { alumno: { nombre: "asc" } },
    select: {
      alumno: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          activo: true,
          asignacionesComoAlumno: SELECT_ASIGNACION_ACTIVA,
        },
      },
    },
  });

  const historia = await historiaDe(
    vinculos.map((v) => v.alumno.id),
    sumarDias(claveDeHoy(), -DIAS_DE_HISTORIA),
  );

  return {
    alumnos: vinculos.map((v) =>
      aAlumnoPanel(v.alumno, historia.get(v.alumno.id) ?? SIN_HISTORIA),
    ),
  };
}

/**
 * Detalle de un alumno. Devuelve null si el alumno no está vinculado a este
 * profesor: la página lo traduce a notFound() para no filtrar ni siquiera la
 * existencia del id.
 */
export async function getAlumnoDetalle(alumnoId: string): Promise<AlumnoDetalle | null> {
  const profesor = await requireProfesor();

  const vinculo = await prisma.profesorAlumno.findFirst({
    where: { profesorId: profesor.id, alumnoId, activo: true },
    select: {
      alumno: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          activo: true,
          email: true,
          telefono: true,
          fechaNacimiento: true,
          asignacionesComoAlumno: SELECT_ASIGNACION_ACTIVA,
        },
      },
    },
  });

  if (!vinculo) return null;

  const { alumno } = vinculo;
  const hoy = claveDeHoy();
  const semanas = ultimasSemanas(SEMANAS_DE_GRAFICO, hoy);
  const desde = semanas[0].clave;

  const [historia, series, records, sesiones] = await Promise.all([
    historiaDe([alumnoId], sumarDias(hoy, -DIAS_DE_HISTORIA)),
    seriesDe(alumnoId, desde),
    prisma.recordPersonal.findMany({
      where: { alumnoId },
      orderBy: { rmEstimado: "desc" },
      select: {
        peso: true,
        repeticiones: true,
        rmEstimado: true,
        ejercicioId: true,
        ejercicio: { select: { nombre: true } },
        registroEjercicio: { select: { sesionId: true } },
      },
    }),
    prisma.sesionEntrenamiento.findMany({
      where: { alumnoId },
      orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
      take: 12,
      select: {
        id: true,
        fecha: true,
        rpeGeneral: true,
        estado: true,
        rutinaDia: { select: { nombre: true } },
        registros: {
          select: { peso: true, repeticiones: true, completado: true },
        },
      },
    }),
  ]);

  const panel = aAlumnoPanel(alumno, historia.get(alumnoId) ?? SIN_HISTORIA);
  const principal = ejercicioPrincipal(series);

  // Las sesiones que produjeron algún PR, para marcarlas en el historial.
  const sesionesConPr = new Set(
    records
      .map((r) => r.registroEjercicio?.sesionId)
      .filter((id): id is string => id != null),
  );

  return {
    alumno: panel,
    datos: {
      id: alumno.id,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      email: alumno.email,
      telefono: alumno.telefono,
      fechaNacimiento: alumno.fechaNacimiento
        ? claveDeFecha(alumno.fechaNacimiento)
        : null,
      activo: alumno.activo,
    },
    marcas: armarMarcas(records, series, semanas, panel.adherencia),
    fuerza: principal
      ? (() => {
          const serie = serieDeFuerza(series, principal.ejercicioId, semanas);
          // El gráfico necesita al menos dos puntos para dibujar una línea.
          return serie.length >= 2
            ? { ejercicio: principal.nombre, serie, unidad: "kg 1RM" }
            : null;
        })()
      : null,
    volumenSemanal: volumenPorSemana(series, semanas),
    historial: sesiones.map((sesion) => {
      const clave = claveDeFecha(sesion.fecha);
      const delSesion: SerieParaMetricas[] = sesion.registros.map((r) => ({
        clave,
        ejercicioId: "",
        ejercicio: "",
        peso: r.peso == null ? null : Number(r.peso),
        repeticiones: r.repeticiones,
        completado: r.completado,
      }));

      return {
        id: sesion.id,
        fecha: fechaLegible(clave),
        nombre: sesion.rutinaDia?.nombre ?? "Entrenamiento libre",
        volumen: formatoVolumen(volumenTotal(delSesion)) ?? "—",
        rpe: sesion.rpeGeneral,
        pr: sesionesConPr.has(sesion.id),
      };
    }),
  };
}

type RecordLeido = {
  peso: unknown;
  repeticiones: number;
  rmEstimado: unknown;
  ejercicioId: string;
  ejercicio: { nombre: string };
};

/**
 * Las tarjetas de arriba del detalle: los tres mejores 1RM estimados más la
 * adherencia.
 *
 * El delta compara el 1RM de la última semana con el de la primera del gráfico.
 * Se omite si no hay dos semanas con datos: un "+0 kg" sobre una sola medición
 * dice que no mejoró, cuando lo que pasa es que todavía no se sabe.
 */
function armarMarcas(
  records: RecordLeido[],
  series: SerieParaMetricas[],
  semanas: { clave: string; etiqueta: string }[],
  adherencia: number | null,
) {
  const porEjercicio = new Map<string, RecordLeido>();

  // Vienen ordenados por rmEstimado desc: el primero de cada ejercicio es el
  // mejor.
  for (const record of records) {
    if (!porEjercicio.has(record.ejercicioId)) {
      porEjercicio.set(record.ejercicioId, record);
    }
  }

  const marcas = [...porEjercicio.values()].slice(0, 3).map((record) => {
    const evolucion = serieDeFuerza(series, record.ejercicioId, semanas);
    const progreso =
      evolucion.length >= 2 ? evolucion[evolucion.length - 1] - evolucion[0] : null;

    const estimado = record.rmEstimado == null ? null : Number(record.rmEstimado);

    return {
      label: `1RM ${record.ejercicio.nombre}`,
      value: String(Math.round(estimado ?? Number(record.peso))),
      unit: "kg",
      delta:
        progreso != null && progreso !== 0
          ? `${progreso > 0 ? "+" : ""}${progreso} kg`
          : undefined,
    };
  });

  if (adherencia != null) {
    marcas.push({
      label: "Adherencia",
      value: String(adherencia),
      unit: "%",
      delta: undefined,
    });
  }

  return marcas;
}

/** Series confirmadas del alumno desde una fecha, con su día y su ejercicio. */
async function seriesDe(
  alumnoId: string,
  desde: string,
): Promise<SerieParaMetricas[]> {
  const registros = await prisma.registroEjercicio.findMany({
    where: {
      sesion: {
        alumnoId,
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
  });

  return registros.map((registro) => ({
    clave: claveDeFecha(registro.sesion.fecha),
    ejercicioId: registro.ejercicioId,
    ejercicio: registro.ejercicio.nombre,
    peso: registro.peso == null ? null : Number(registro.peso),
    repeticiones: registro.repeticiones,
    completado: registro.completado,
  }));
}

/** Semana en curso del mesociclo, 1-indexada. */
function semanaEnCurso(inicio: string, hoy: string) {
  return Math.floor(Math.max(0, diasEntre(inicio, hoy)) / 7) + 1;
}
