import "server-only";

import { prisma } from "@/lib/db";
import { requireAlumno } from "@/lib/auth/guards";
import { claveDeFecha, cuandoLegible } from "@/lib/fechas";
import type {
  DetalleDeSesion,
  RegistroDeSesion,
  SerieCargada,
  SesionDeHistorial,
} from "@/lib/data/alumno-tipos";

// ============================================================================
// Historial del alumno.
//
// El volumen se calcula acá y no se guarda: es peso × repeticiones sumado sobre
// las series confirmadas, y guardarlo obligaría a recalcularlo cada vez que se
// corrige una serie. Con las cantidades de una app de gimnasio, sumar al leer
// sale gratis.
// ============================================================================

/** Cuántas sesiones trae la lista. Un año de entrenamiento intenso entra. */
const MAXIMO = 200;

type RegistroLeido = {
  ejercicioId: string;
  numeroSerie: number;
  peso: unknown;
  repeticiones: number | null;
  rpe: number | null;
  completado: boolean;
  ejercicio: { nombre: string };
};

export async function getHistorial(): Promise<SesionDeHistorial[]> {
  const alumno = await requireAlumno();

  const sesiones = await prisma.sesionEntrenamiento.findMany({
    where: { alumnoId: alumno.id },
    orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
    take: MAXIMO,
    select: {
      id: true,
      fecha: true,
      estado: true,
      rpeGeneral: true,
      rutinaDia: { select: { nombre: true, numeroDia: true } },
      registros: {
        select: { peso: true, repeticiones: true, completado: true },
      },
    },
  });

  return sesiones.map((sesion) => {
    const clave = claveDeFecha(sesion.fecha);
    const hechas = sesion.registros.filter((r) => r.completado);

    return {
      id: sesion.id,
      clave,
      cuando: cuandoLegible(clave),
      dia: sesion.rutinaDia?.nombre ?? "Entrenamiento libre",
      estado: sesion.estado,
      volumen: formatoVolumen(volumenDe(hechas)),
      rpe: sesion.rpeGeneral,
      series: hechas.length,
    };
  });
}

export async function getSesion(sesionId: string): Promise<DetalleDeSesion | null> {
  const alumno = await requireAlumno();

  // El filtro por alumnoId es la autorización: una sesión ajena devuelve null y
  // la página lo traduce a notFound(), sin distinguir "no existe" de "no es tuya".
  const sesion = await prisma.sesionEntrenamiento.findFirst({
    where: { id: sesionId, alumnoId: alumno.id },
    select: {
      id: true,
      fecha: true,
      estado: true,
      duracionMinutos: true,
      rpeGeneral: true,
      notas: true,
      rutinaDia: { select: { nombre: true } },
      asignacion: { select: { rutina: { select: { nombre: true } } } },
      registros: {
        orderBy: { numeroSerie: "asc" },
        select: {
          ejercicioId: true,
          numeroSerie: true,
          peso: true,
          repeticiones: true,
          rpe: true,
          completado: true,
          ejercicio: { select: { nombre: true } },
        },
      },
    },
  });

  if (!sesion) return null;

  const clave = claveDeFecha(sesion.fecha);

  return {
    id: sesion.id,
    clave,
    cuando: cuandoLegible(clave),
    dia: sesion.rutinaDia?.nombre ?? "Entrenamiento libre",
    rutina: sesion.asignacion?.rutina.nombre ?? null,
    estado: sesion.estado,
    duracionMinutos: sesion.duracionMinutos,
    rpeGeneral: sesion.rpeGeneral,
    notas: sesion.notas,
    ejercicios: agruparPorEjercicio(sesion.registros),
    volumen: formatoVolumen(
      volumenDe(sesion.registros.filter((r) => r.completado)),
    ),
  };
}

function agruparPorEjercicio(registros: RegistroLeido[]): RegistroDeSesion[] {
  const porEjercicio = new Map<string, RegistroDeSesion>();

  for (const registro of registros) {
    const serie: SerieCargada = {
      numeroSerie: registro.numeroSerie,
      peso: registro.peso == null ? null : Number(registro.peso),
      repeticiones: registro.repeticiones,
      rpe: registro.rpe,
      completado: registro.completado,
    };

    const actual = porEjercicio.get(registro.ejercicioId);

    if (actual) {
      actual.series.push(serie);
      if (registro.completado) actual.volumen += (serie.peso ?? 0) * (serie.repeticiones ?? 0);
    } else {
      porEjercicio.set(registro.ejercicioId, {
        ejercicio: registro.ejercicio.nombre,
        series: [serie],
        volumen: registro.completado
          ? (serie.peso ?? 0) * (serie.repeticiones ?? 0)
          : 0,
      });
    }
  }

  return [...porEjercicio.values()];
}

function volumenDe(registros: { peso: unknown; repeticiones: number | null }[]) {
  return registros.reduce(
    (total, r) => total + Number(r.peso ?? 0) * (r.repeticiones ?? 0),
    0,
  );
}

/** 8200 -> "8.2 t"; 620 -> "620 kg"; 0 -> null (no se cargó nada). */
function formatoVolumen(kilos: number): string | null {
  if (kilos <= 0) return null;
  if (kilos < 1000) return `${Math.round(kilos)} kg`;
  return `${(kilos / 1000).toFixed(1)} t`;
}
