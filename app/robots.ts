import type { MetadataRoute } from "next";

/**
 * La app es privada: no hay nada público que indexar y la portada nombra al
 * gimnasio. Todo lo que hay detrás del login ya está protegido por los guards,
 * pero pedir que no se indexe evita que la URL del gimnasio aparezca en una
 * búsqueda.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
