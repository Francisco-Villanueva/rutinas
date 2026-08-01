import * as React from "react"

/** Cabecera de sección del panel: ícono + título, contador opcional y acción. */
function SectionHead({
  icon,
  title,
  count,
  action,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 text-body [&>svg]:size-5">{icon}</span>
        <h2 className="truncate font-heading text-lg leading-snug font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {count != null ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-sm text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export { SectionHead }
