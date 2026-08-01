import type { MetadataRoute } from "next";

/**
 * Manifest de instalación.
 *
 * El alumno carga los datos con el celular en la mano entre serie y serie: la
 * app tiene que poder agregarse a la pantalla de inicio y abrirse sin la barra
 * del navegador comiéndose 60px de pantalla. Eso es todo lo que se busca acá —
 * no hay service worker ni modo offline, y no hacen falta para el MVP.
 *
 * `start_url` apunta a /post-login y no a /: esa ruta lee el rol en la tabla
 * `usuarios` y manda al alumno a "hoy te toca" y al profesor a su panel. Abrir
 * el ícono cae directo en la pantalla que corresponde.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rutinas — entrenamiento y progreso",
    short_name: "Rutinas",
    description:
      "Tu rutina del día, la carga de tus entrenamientos y tu progreso.",
    start_url: "/post-login",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    background_color: "#fafaf9",
    theme_color: "#16714c",
    categories: ["health", "fitness"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
