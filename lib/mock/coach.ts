import type {
  AlumnoDetalle,
  AlumnoPanel,
  EjercicioDeDia,
  EventoActividad,
  PantallaAsignaciones,
  RutinaBuilder,
} from "@/lib/data/tipos";

// ============================================================================
// Dataset de ejemplo del UI kit (design-system/project/ui_kits/coach-dashboard/data.js).
// Solo se sirve en dev y solo cuando la query real no devuelve nada, para poder
// revisar las pantallas con la base vacía (el seed carga ejercicios, no usuarios).
// La UI lo cartelea con "Datos de ejemplo" en todas las pantallas.
// Se borra cuando existan las queries de adherencia / racha / actividad / 1RM.
// ============================================================================

export const ALUMNOS_DEMO: AlumnoPanel[] = [
  {
    id: "demo-1",
    nombre: "Lucía Fernández",
    iniciales: "LF",
    objetivo: "Fuerza",
    estado: "activo",
    ultimaSesion: "Hoy",
    adherencia: 92,
    racha: 12,
    alerta: null,
    plan: "Fuerza 4 días",
    semana: 3,
    semanas: 8,
  },
  {
    id: "demo-2",
    nombre: "Marco Díaz",
    iniciales: "MD",
    objetivo: "Hipertrofia",
    estado: "activo",
    ultimaSesion: "Ayer",
    adherencia: 78,
    racha: 4,
    alerta: null,
    plan: "Volumen alto",
    semana: 5,
    semanas: 6,
  },
  {
    id: "demo-3",
    nombre: "Ana Ruiz",
    iniciales: "AR",
    objetivo: "Recomposición",
    estado: "ausente",
    ultimaSesion: "hace 8 días",
    adherencia: 41,
    racha: 0,
    alerta: { texto: "Inactiva 8 días", tono: "destructive" },
    plan: "Full body 3 días",
    semana: 2,
    semanas: 8,
  },
  {
    id: "demo-4",
    nombre: "Julián Costa",
    iniciales: "JC",
    objetivo: "Fuerza",
    estado: "activo",
    ultimaSesion: "Hoy",
    adherencia: 88,
    racha: 21,
    alerta: null,
    plan: "Powerlifting",
    semana: 7,
    semanas: 8,
  },
  {
    id: "demo-5",
    nombre: "Sofía Molina",
    iniciales: "SM",
    objetivo: "Hipertrofia",
    estado: "activo",
    ultimaSesion: "hace 2 días",
    adherencia: 64,
    racha: 2,
    alerta: { texto: "Estancada en press", tono: "warning" },
    plan: "Push/Pull/Legs",
    semana: 4,
    semanas: 6,
  },
  {
    id: "demo-6",
    nombre: "Tomás Vega",
    iniciales: "TV",
    objetivo: "Resistencia",
    estado: "ausente",
    ultimaSesion: "hace 4 días",
    adherencia: 55,
    racha: 0,
    alerta: { texto: "Mesociclo completo", tono: "info" },
    plan: "Metcon 5 días",
    semana: 6,
    semanas: 6,
  },
];

export const ACTIVIDAD_DEMO: EventoActividad[] = [
  {
    id: "demo-act-1",
    alumno: "Julián Costa",
    tipo: "pr",
    texto: "Nuevo PR en Sentadilla",
    detalle: "130 kg · 1RM est. 146 kg",
    cuando: "hace 1 h",
  },
  {
    id: "demo-act-2",
    alumno: "Lucía Fernández",
    tipo: "sesion",
    texto: "Completó Empuje — Pecho / Hombros",
    detalle: "8.2 t · RPE 8",
    cuando: "hace 3 h",
  },
  {
    id: "demo-act-3",
    alumno: "Marco Díaz",
    tipo: "metrica",
    texto: "Cargó métricas corporales",
    detalle: "Peso 82.1 kg · % grasa 15",
    cuando: "Ayer",
  },
  {
    id: "demo-act-4",
    alumno: "Sofía Molina",
    tipo: "sesion",
    texto: "Completó Push / Pull / Legs — Día 2",
    detalle: "6.4 t · RPE 9",
    cuando: "Ayer",
  },
  {
    id: "demo-act-5",
    alumno: "Lucía Fernández",
    tipo: "pr",
    texto: "Nuevo PR en Press banca",
    detalle: "102 kg · 1RM est. 118 kg",
    cuando: "Ayer",
  },
];

export const PRS_SEMANA_DEMO = 4;

// `datos` queda afuera: son los campos editables de la fila real, y el alumno de
// ejemplo no tiene fila. La pantalla de detalle esconde la edición si es null.
export const DETALLE_DEMO: Omit<AlumnoDetalle, "alumno" | "esDemo" | "datos"> = {
  marcas: [
    { label: "1RM Sentadilla", value: "128", unit: "kg", delta: "+6 kg" },
    { label: "1RM Press banca", value: "84", unit: "kg", delta: "+2 kg" },
    { label: "1RM Peso muerto", value: "150", unit: "kg", delta: "+8 kg" },
    { label: "Adherencia", value: "92", unit: "%", delta: "+4%" },
  ],
  fuerza: {
    ejercicio: "Press banca",
    serie: [72, 74, 78, 80, 79, 84, 88, 92, 96, 102],
    unidad: "kg 1RM",
  },
  volumenSemanal: [
    { label: "S1", valor: 12 },
    { label: "S2", valor: 14 },
    { label: "S3", valor: 15 },
    { label: "S4", valor: 13 },
    { label: "S5", valor: 17 },
    { label: "S6", valor: 18 },
  ],
  historial: [
    {
      id: "demo-s1",
      fecha: "Lun 21 Jul",
      nombre: "Empuje — Pecho/Hombros",
      volumen: "8.2 t",
      rpe: 8,
      pr: true,
    },
    {
      id: "demo-s2",
      fecha: "Sáb 19 Jul",
      nombre: "Pierna — Cuádriceps",
      volumen: "11.4 t",
      rpe: 9,
      pr: false,
    },
    {
      id: "demo-s3",
      fecha: "Jue 17 Jul",
      nombre: "Tirón — Espalda/Bíceps",
      volumen: "7.6 t",
      rpe: 7,
      pr: false,
    },
    {
      id: "demo-s4",
      fecha: "Mar 15 Jul",
      nombre: "Empuje — Pecho/Hombros",
      volumen: "7.9 t",
      rpe: 8,
      pr: true,
    },
  ],
};

/**
 * Fila del constructor a partir de los valores crudos. El constructor muestra
 * los dos: los crudos precargan el formulario de edición y los formateados van
 * en la tabla. En el dataset de ejemplo la edición está deshabilitada, pero el
 * tipo es el mismo que el de la query real.
 */
function ejercicioDemo(
  id: string,
  nombre: string,
  series: number,
  repeticiones: number,
  peso: number | null,
  descansoSegundos: number,
): EjercicioDeDia {
  return {
    id,
    ejercicioId: `${id}-ejercicio`,
    nombre,
    series,
    repeticionesMin: repeticiones,
    repeticionesMax: repeticiones,
    pesoSugerido: peso,
    descansoSegundos,
    notas: null,
    reps: String(repeticiones),
    peso: peso == null ? "—" : `${peso} kg`,
    descanso: `${Math.floor(descansoSegundos / 60)}:${String(descansoSegundos % 60).padStart(2, "0")}`,
    rpe: "—",
  };
}

export const RUTINA_DEMO: RutinaBuilder = {
  id: "demo-rutina",
  nombre: "Fuerza 4 días — Mesociclo 2",
  objetivo: "Fuerza",
  descripcion: null,
  semanas: 8,
  diasPorSemana: 4,
  esPlantilla: false,
  dias: [
    {
      id: "demo-d1",
      numeroDia: 1,
      dia: "Lun",
      foco: "Empuje",
      notas: null,
      ejercicios: [
        ejercicioDemo("demo-e1", "Press banca", 4, 6, 80, 150),
        ejercicioDemo("demo-e2", "Press militar", 3, 8, 45, 120),
        ejercicioDemo("demo-e3", "Fondos lastrados", 3, 10, 15, 90),
        ejercicioDemo("demo-e4", "Extensión tríceps", 3, 12, 25, 60),
      ],
    },
    {
      id: "demo-d2",
      numeroDia: 2,
      dia: "Mié",
      foco: "Tirón",
      notas: null,
      ejercicios: [
        ejercicioDemo("demo-e5", "Peso muerto", 4, 5, 120, 180),
        ejercicioDemo("demo-e6", "Dominadas", 4, 8, null, 120),
        ejercicioDemo("demo-e7", "Remo con barra", 3, 10, 60, 90),
      ],
    },
    {
      id: "demo-d3",
      numeroDia: 3,
      dia: "Vie",
      foco: "Pierna",
      notas: null,
      ejercicios: [
        ejercicioDemo("demo-e8", "Sentadilla", 5, 5, 100, 180),
        ejercicioDemo("demo-e9", "Prensa", 3, 12, 180, 120),
        ejercicioDemo("demo-e10", "Curl femoral", 3, 12, 40, 60),
      ],
    },
    {
      id: "demo-d4",
      numeroDia: 4,
      dia: "Sáb",
      foco: "Full",
      notas: null,
      ejercicios: [
        ejercicioDemo("demo-e11", "Hip thrust", 4, 8, 90, 120),
        ejercicioDemo("demo-e12", "Press inclinado", 3, 10, 55, 90),
      ],
    },
  ],
  plantillas: [
    { id: "demo-p1", nombre: "Fuerza 4 días" },
    { id: "demo-p2", nombre: "Hipertrofia PPL" },
    { id: "demo-p3", nombre: "Full body 3 días" },
    { id: "demo-p4", nombre: "Powerlifting peaking" },
    { id: "demo-p5", nombre: "Metcon acondicionamiento" },
  ],
  esDemo: true,
};

// `alumnos` y `rutinas` los completa la query con los reales: son las opciones
// del formulario de alta, y ahí no puede haber nada inventado.
export const ASIGNACIONES_DEMO: Omit<
  PantallaAsignaciones,
  "alumnos" | "rutinas"
> = {
  plantillas: [
    { id: "demo-p1", nombre: "Fuerza 4 días", objetivo: "Fuerza", dias: 4, semanas: 8, asignadas: 5 },
    { id: "demo-p2", nombre: "Hipertrofia PPL", objetivo: "Hipertrofia", dias: 6, semanas: 6, asignadas: 3 },
    { id: "demo-p3", nombre: "Full body 3 días", objetivo: "Recomposición", dias: 3, semanas: 8, asignadas: 2 },
    { id: "demo-p4", nombre: "Powerlifting peaking", objetivo: "Fuerza", dias: 4, semanas: 4, asignadas: 1 },
  ],
  filas: [
    { id: "demo-a1", alumnoId: "demo-1", alumno: "Lucía Fernández", iniciales: "LF", estadoAlumno: "activo", rutinaId: "demo-p1", rutina: "Fuerza 4 días", desde: "12 jul", semana: 3, semanas: 8, estado: "activa", finalizada: false },
    { id: "demo-a2", alumnoId: "demo-2", alumno: "Marco Díaz", iniciales: "MD", estadoAlumno: "activo", rutinaId: "demo-p2", rutina: "Volumen alto", desde: "28 jun", semana: 5, semanas: 6, estado: "activa", finalizada: false },
    { id: "demo-a3", alumnoId: "demo-3", alumno: "Ana Ruiz", iniciales: "AR", estadoAlumno: "ausente", rutinaId: "demo-p3", rutina: "Full body 3 días", desde: "05 jul", semana: 2, semanas: 8, estado: "activa", finalizada: false },
    { id: "demo-a4", alumnoId: "demo-4", alumno: "Julián Costa", iniciales: "JC", estadoAlumno: "activo", rutinaId: "demo-p4", rutina: "Powerlifting", desde: "01 jun", semana: 7, semanas: 8, estado: "activa", finalizada: false },
    { id: "demo-a5", alumnoId: "demo-5", alumno: "Sofía Molina", iniciales: "SM", estadoAlumno: "activo", rutinaId: "demo-p2", rutina: "Push/Pull/Legs", desde: "18 jun", semana: 4, semanas: 6, estado: "activa", finalizada: false },
    { id: "demo-a6", alumnoId: "demo-6", alumno: "Tomás Vega", iniciales: "TV", estadoAlumno: "ausente", rutinaId: "demo-p1", rutina: "Metcon 5 días", desde: "10 jun", semana: 6, semanas: 6, estado: "completada", finalizada: true },
  ],
  esDemo: true,
};
