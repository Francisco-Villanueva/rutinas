import "server-only";

import { getAlumnos } from "@/lib/data/alumnos";
import { ACTIVIDAD_DEMO, PRS_SEMANA_DEMO } from "@/lib/mock/coach";
import type { PanelProfesor } from "@/lib/data/tipos";

/**
 * Datos del panel. Los alumnos y su asignación activa son reales; la actividad
 * reciente y los PRs de la semana todavía no tienen query (ver lib/data/alumnos.ts).
 */
export async function getPanelProfesor(): Promise<PanelProfesor> {
  const { alumnos, esDemo } = await getAlumnos();

  return {
    alumnos,
    actividad: esDemo ? ACTIVIDAD_DEMO : [],
    prsSemana: esDemo ? PRS_SEMANA_DEMO : null,
    esDemo,
  };
}
