import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Chip categórico (grupo muscular, equipamiento, etiqueta), opcionalmente
 * removible. Es distinto del Badge de shadcn: el Badge comunica estado y es
 * una pastilla; el Tag es una etiqueta seleccionable de esquina blanda.
 * shadcn no tiene una primitiva equivalente, por eso vive en components/.
 */
function Tag({
  className,
  active = false,
  onRemove,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  active?: boolean
  onRemove?: () => void
}) {
  return (
    <span
      data-slot="tag"
      data-active={active || undefined}
      // DS: radius-sm (no pill), superficie hundida; activo se rellena de accent
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-[var(--dur-fast)] ease-out",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-input bg-muted text-body",
        className
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label="Quitar"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          className="inline-flex cursor-pointer opacity-70 transition-opacity hover:opacity-100"
        >
          <X aria-hidden className="size-3.5 stroke-[2.5]" />
        </button>
      ) : null}
    </span>
  )
}

export { Tag }
