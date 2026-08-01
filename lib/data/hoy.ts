import "server-only";

import { prisma } from "@/lib/db";
import { requireAlumno } from "@/lib/auth/guards";
import {
  claveDeFecha,
  claveDeHoy,
  diasEntre,
  inicialDelDia,
  rangoDelDia,
  semanaDe,
  sumarDias,
} from "@/lib/fechas";
import {
  BLOQUE_DE_SERIES,
  type DiaDeLaSemana,
  type EjercicioDeHoy,
  type PantallaHoy,
  type SerieCargada,
} from "@/lib/data/alumno-tipos";

// ============================================================================
// "Hoy te toca".
//
// Regla del día: le toca el siguiente al último que completó, ciclando al
// principio cuando llega al final. No hay calendario de por medio — si falta un
// martes, el martes no se pierde: sigue estando primero en la fila.
//
// Si ya empezó una sesión hoy, esa manda: el día lo fija la sesión y no el
// cálculo, para que recargar la pantalla a mitad del entrenamiento no cambie lo
// que está haciendo.
// ============================================================================

/** Cuántos días para atrás se miran para la racha. */
const DIAS_DE_RACHA = 120;

const SELECT_EJERCICIOS_DEL_DIA = {
  orderBy: { orden: "asc" },
  select: {
    id: true,
    ejercicioId: true,
    series: true,
    repeticionesMin: true,
    repeticionesMax: true,
    pesoSugerido: true,
    descansoSegundos: true,
    notas: true,
    ejercicio: { select: { nombre: true, grupoMuscular: true } },
  },
} as const;

export async function getHoy(): Promise<PantallaHoy> {
  const alumno = await requireAlumno();
  const hoy = claveDeHoy();

  const [asignacion, sesionDeHoy, fechasCompletadas] = await Promise.all([
    prisma.asignacionRutina.findFirst({
      where: { alumnoId: alumno.id, estado: "activa" },
      orderBy: { fechaInicio: "desc" },
      select: {
        id: true,
        fechaInicio: true,
        notas: true,
        rutina: {
          select: {
            nombre: true,
            duracionSemanas: true,
            dias: {
              orderBy: { numeroDia: "asc" },
              select: {
                id: true,
                numeroDia: true,
                nombre: true,
                notas: true,
                ejercicios: SELECT_EJERCICIOS_DEL_DIA,
              },
            },
          },
        },
      },
    }),
    prisma.sesionEntrenamiento.findFirst({
      where: { alumnoId: alumno.id, fecha: rangoDelDia(hoy) },
      orderBy: { creadoEn: "desc" },
      select: {
        id: true,
        estado: true,
        rutinaDiaId: true,
        duracionMinutos: true,
        rpeGeneral: true,
        notas: true,
        registros: {
          select: {
            ejercicioId: true,
            numeroSerie: true,
            peso: true,
            repeticiones: true,
            rpe: true,
            completado: true,
          },
        },
      },
    }),
    prisma.sesionEntrenamiento.findMany({
      where: {
        alumnoId: alumno.id,
        estado: "completada",
        fecha: { gte: new Date(`${sumarDias(hoy, -DIAS_DE_RACHA)}T00:00:00.000Z`) },
      },
      orderBy: { fecha: "desc" },
      select: { fecha: true },
    }),
  ]);

  const diasEntrenados = new Set(fechasCompletadas.map((s) => claveDeFecha(s.fecha)));

  const base = {
    nombre: alumno.nombre.split(" ")[0],
    racha: calcularRacha(diasEntrenados, hoy),
    semana: armarSemana(diasEntrenados, hoy),
  };

  if (!asignacion) {
    return {
      ...base,
      plan: null,
      dia: null,
      ejercicios: [],
      sesion: null,
      hechos: 0,
      estimadoMinutos: null,
    };
  }

  const dias = asignacion.rutina.dias;

  // La sesión de hoy manda sobre el cálculo; si no hay, toca el siguiente al
  // último completado.
  //
  // El `??` cubre un caso que sí pasa: el profesor le cambió la rutina mientras
  // tenía la sesión del día abierta, y el día de esa sesión ya no existe en la
  // asignación activa. Sin la caída al cálculo, la pantalla se quedaba sin día
  // y sin forma de salir.
  const diaDeLaSesion = sesionDeHoy?.rutinaDiaId
    ? dias.find((d) => d.id === sesionDeHoy.rutinaDiaId)
    : undefined;

  const dia = diaDeLaSesion ?? (await siguienteDia(alumno.id, asignacion.id, dias));

  const registrosPorEjercicio = agruparRegistros(sesionDeHoy?.registros ?? []);
  const ejercicios = (dia?.ejercicios ?? []).map(
    aEjercicioDeHoy(registrosPorEjercicio),
  );

  return {
    ...base,
    plan: {
      asignacionId: asignacion.id,
      rutina: asignacion.rutina.nombre,
      semana: semanaEnCurso(claveDeFecha(asignacion.fechaInicio), hoy),
      semanas: asignacion.rutina.duracionSemanas,
      notasDelProfesor: asignacion.notas,
    },
    dia: dia
      ? { id: dia.id, numeroDia: dia.numeroDia, nombre: dia.nombre, notas: dia.notas }
      : null,
    ejercicios,
    sesion: sesionDeHoy
      ? {
          id: sesionDeHoy.id,
          estado: sesionDeHoy.estado,
          duracionMinutos: sesionDeHoy.duracionMinutos,
          rpeGeneral: sesionDeHoy.rpeGeneral,
          notas: sesionDeHoy.notas,
        }
      : null,
    hechos: ejercicios.filter((e) => e.hecho).length,
    estimadoMinutos: estimarMinutos(ejercicios),
  };
}

/**
 * Lo que necesita la pantalla de carga de un ejercicio.
 *
 * Se apoya en `getHoy()` en vez de tener su propia query: la regla del día vive
 * en un solo lugar, y si esta pantalla la calculara aparte podría terminar
 * cargando series contra un día distinto del que muestra "hoy te toca".
 */
export async function getCargaDeEjercicio(rutinaEjercicioId: string): Promise<{
  ejercicio: EjercicioDeHoy;
  dia: string;
  sesionId: string;
  /** Para saltar directo al siguiente sin volver a la lista. */
  siguienteId: string | null;
} | null> {
  const hoy = await getHoy();

  const indice = hoy.ejercicios.findIndex(
    (e) => e.rutinaEjercicioId === rutinaEjercicioId,
  );

  // Sin sesión abierta no hay dónde guardar; sin día, el id no es de hoy.
  if (indice === -1 || !hoy.sesion || !hoy.dia) return null;

  const siguiente =
    hoy.ejercicios.slice(indice + 1).find((e) => !e.hecho) ??
    hoy.ejercicios.find((e, i) => i !== indice && !e.hecho) ??
    null;

  return {
    ejercicio: hoy.ejercicios[indice],
    dia: hoy.dia.nombre,
    sesionId: hoy.sesion.id,
    siguienteId: siguiente?.rutinaEjercicioId ?? null,
  };
}

type DiaConEjercicios = {
  id: string;
  numeroDia: number;
  nombre: string;
  notas: string | null;
  ejercicios: FilaDelPlan[];
};

type FilaDelPlan = {
  id: string;
  ejercicioId: string;
  series: number;
  repeticionesMin: number | null;
  repeticionesMax: number | null;
  pesoSugerido: unknown;
  descansoSegundos: number | null;
  notas: string | null;
  ejercicio: { nombre: string; grupoMuscular: string };
};

/**
 * El día siguiente al último completado, ciclando.
 *
 * Se mira la última sesión *completada* y no la última a secas: una sesión
 * abandonada a mitad de camino no debería empujar al alumno al día siguiente.
 */
async function siguienteDia(
  alumnoId: string,
  asignacionId: string,
  dias: DiaConEjercicios[],
): Promise<DiaConEjercicios | null> {
  if (dias.length === 0) return null;

  const ultima = await prisma.sesionEntrenamiento.findFirst({
    where: { alumnoId, asignacionId, estado: "completada" },
    orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
    select: { rutinaDiaId: true },
  });

  // Sin sesiones completadas, o el día de la última ya no existe (el profesor
  // lo borró): se arranca de nuevo por el primero.
  const indiceUltimo = ultima?.rutinaDiaId
    ? dias.findIndex((d) => d.id === ultima.rutinaDiaId)
    : -1;

  return dias[indiceUltimo === -1 ? 0 : (indiceUltimo + 1) % dias.length];
}

type RegistroLeido = {
  ejercicioId: string;
  numeroSerie: number;
  peso: unknown;
  repeticiones: number | null;
  rpe: number | null;
  completado: boolean;
};

function agruparRegistros(registros: RegistroLeido[]) {
  const porEjercicio = new Map<string, SerieCargada[]>();

  for (const registro of registros) {
    const serie: SerieCargada = {
      numeroSerie: registro.numeroSerie,
      peso: registro.peso == null ? null : Number(registro.peso),
      repeticiones: registro.repeticiones,
      rpe: registro.rpe,
      completado: registro.completado,
    };

    const actuales = porEjercicio.get(registro.ejercicioId);
    if (actuales) actuales.push(serie);
    else porEjercicio.set(registro.ejercicioId, [serie]);
  }

  return porEjercicio;
}

/**
 * Arma la fila de pantalla y resuelve el desplazamiento de numeración cuando el
 * mismo ejercicio aparece más de una vez en el día (ver `desplazamiento` en
 * lib/data/alumno-tipos.ts).
 */
function aEjercicioDeHoy(registrosPorEjercicio: Map<string, SerieCargada[]>) {
  const ocurrencias = new Map<string, number>();

  return (fila: FilaDelPlan): EjercicioDeHoy => {
    const ocurrencia = ocurrencias.get(fila.ejercicioId) ?? 0;
    ocurrencias.set(fila.ejercicioId, ocurrencia + 1);
    const desplazamiento = ocurrencia * BLOQUE_DE_SERIES;

    const todas = registrosPorEjercicio.get(fila.ejercicioId) ?? [];
    const cargadas = todas
      .filter(
        (s) =>
          s.numeroSerie > desplazamiento &&
          s.numeroSerie <= desplazamiento + BLOQUE_DE_SERIES,
      )
      .sort((a, b) => a.numeroSerie - b.numeroSerie);

    const peso = fila.pesoSugerido == null ? null : Number(fila.pesoSugerido);

    return {
      rutinaEjercicioId: fila.id,
      ejercicioId: fila.ejercicioId,
      nombre: fila.ejercicio.nombre,
      grupo: fila.ejercicio.grupoMuscular,
      series: fila.series,
      repeticionesMin: fila.repeticionesMin,
      repeticionesMax: fila.repeticionesMax,
      pesoSugerido: peso,
      descansoSegundos: fila.descansoSegundos,
      notas: fila.notas,
      reps: formatoReps(fila.repeticionesMin, fila.repeticionesMax),
      peso: peso == null ? "—" : `${peso} kg`,
      descanso: formatoDescanso(fila.descansoSegundos),
      desplazamiento,
      cargadas,
      hecho:
        cargadas.length >= fila.series && cargadas.every((s) => s.completado),
    };
  };
}

/** Días seguidos entrenando. Hoy sin entrenar todavía no corta la racha. */
function calcularRacha(diasEntrenados: Set<string>, hoy: string): number {
  if (diasEntrenados.size === 0) return 0;

  let clave = diasEntrenados.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;

  while (diasEntrenados.has(clave) && racha < DIAS_DE_RACHA) {
    racha++;
    clave = sumarDias(clave, -1);
  }

  return racha;
}

function armarSemana(diasEntrenados: Set<string>, hoy: string): DiaDeLaSemana[] {
  return semanaDe(hoy).map((clave) => ({
    clave,
    inicial: inicialDelDia(clave),
    estado: diasEntrenados.has(clave)
      ? ("hecho" as const)
      : clave === hoy
        ? ("hoy" as const)
        : ("pendiente" as const),
  }));
}

/** Semana del mesociclo, 1-indexada. */
function semanaEnCurso(inicio: string, hoy: string) {
  return Math.max(1, Math.floor(diasEntre(inicio, hoy) / 7) + 1);
}

/**
 * Estimación de duración: el descanso de todas las series más 45 segundos de
 * trabajo por serie. Es una cuenta gruesa a propósito — sirve para que el
 * alumno sepa si le entra antes de una reunión, no para cronometrar.
 */
function estimarMinutos(ejercicios: EjercicioDeHoy[]): number | null {
  if (ejercicios.length === 0) return null;

  const segundos = ejercicios.reduce(
    (total, e) => total + e.series * ((e.descansoSegundos ?? 90) + 45),
    0,
  );

  return Math.max(5, Math.round(segundos / 60 / 5) * 5);
}

/** 150 -> "2:30". */
function formatoDescanso(segundos: number | null) {
  if (segundos == null) return "—";
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

/** 8 y 12 -> "8-12"; solo mínimo -> "8"; ninguno -> "—". */
function formatoReps(min: number | null, max: number | null) {
  if (min != null && max != null && min !== max) return `${min}-${max}`;
  const uno = min ?? max;
  return uno != null ? String(uno) : "—";
}
