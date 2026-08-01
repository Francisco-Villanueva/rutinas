// ============================================================================
// Repetición máxima estimada.
//
// Fórmula de Epley: 1RM = peso × (1 + reps / 30).
//
// Se elige una sola y se usa en todos lados. Brzycki da números apenas
// distintos, y mezclarlas haría que el 1RM que el alumno ve mientras carga la
// serie no coincida con el PR que le queda guardado — que es exactamente el
// tipo de diferencia que hace desconfiar de una app de entrenamiento.
//
// Sin "server-only": lo usa la pantalla de carga en el cliente y el motor de
// PRs en el servidor.
// ============================================================================

/**
 * 1RM estimado a partir de una serie. `null` si la serie no sirve para estimar
 * (sin peso, sin repeticiones, o peso corporal cargado como 0).
 *
 * Por encima de 12 repeticiones la fórmula se va de rango: sobrestima tanto que
 * un 20×40 kg daría más que un 5×100 kg. En ese caso no se estima nada.
 */
export const MAXIMO_REPS_ESTIMABLES = 12;

export function rmEstimado(
  peso: number | null | undefined,
  repeticiones: number | null | undefined,
): number | null {
  if (peso == null || repeticiones == null) return null;
  if (peso <= 0 || repeticiones <= 0) return null;
  if (repeticiones > MAXIMO_REPS_ESTIMABLES) return null;

  return redondear(peso * (1 + repeticiones / 30));
}

/** El mejor 1RM estimado de un conjunto de series. */
export function mejorRmEstimado(
  series: { peso: number | null; repeticiones: number | null }[],
): number | null {
  const estimados = series
    .map((s) => rmEstimado(s.peso, s.repeticiones))
    .filter((v): v is number => v != null);

  return estimados.length > 0 ? Math.max(...estimados) : null;
}

/** Dos decimales: es lo que entra en DECIMAL(6,2). */
function redondear(valor: number) {
  return Math.round(valor * 100) / 100;
}
