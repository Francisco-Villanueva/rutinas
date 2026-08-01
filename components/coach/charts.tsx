/**
 * Data-viz mínima en SVG inline (no es iconografía y no es una librería).
 * Portado de design-system/project/ui_kits/coach-dashboard/Chart.jsx.
 * Los colores salen de los tokens vía utilidades de Tailwind, no hardcodeados.
 */

/** Evolución de una serie: área tenue + línea, con punto en el último dato. */
function LineChart({
  data,
  height = 150,
  label,
}: {
  data: number[]
  height?: number
  /** Descripción accesible: el gráfico es decorativo sin esto. */
  label: string
}) {
  if (data.length < 2) return null

  const ancho = 520
  const pad = 8
  const max = Math.max(...data)
  const min = Math.min(...data)
  const rango = max - min || 1

  const puntos = data.map((valor, i) => {
    const x = pad + (i / (data.length - 1)) * (ancho - pad * 2)
    const y = pad + (1 - (valor - min) / rango) * (height - pad * 2)
    return [x, y] as const
  })

  const linea = puntos
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")
  const ultimo = puntos[puntos.length - 1]
  const area = `${linea} L${ultimo[0].toFixed(1)},${height - pad} L${puntos[0][0].toFixed(1)},${height - pad} Z`

  return (
    <svg
      viewBox={`0 0 ${ancho} ${height}`}
      style={{ height }}
      className="w-full text-primary"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path d={area} className="fill-accent-soft opacity-50" />
      <path
        d={linea}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultimo[0]} cy={ultimo[1]} r="5" fill="currentColor" />
    </svg>
  )
}

/** Barras verticales con etiqueta abajo; la última se resalta en accent. */
function BarChart({
  data,
  height = 150,
}: {
  data: { label: string; valor: number }[]
  height?: number
}) {
  if (data.length === 0) return null

  const max = Math.max(...data.map((d) => d.valor)) || 1

  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={d.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
        >
          <div
            className={
              i === data.length - 1
                ? "w-full max-w-[34px] rounded-t-xs bg-primary"
                : "w-full max-w-[34px] rounded-t-xs bg-input"
            }
            style={{ height: `${Math.max((d.valor / max) * 100, 3)}%` }}
          />
          <span className="font-mono text-2xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export { BarChart, LineChart }
