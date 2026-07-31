import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// DS: pastilla de estado. Los tonos son tintes suaves, nunca rellenos vívidos.
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-semibold tracking-label whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        neutral: "border-input bg-muted text-body",
        accent: "bg-accent-soft text-accent-soft-strong",
        success: "bg-success-soft text-success-strong",
        warning: "bg-warning-soft text-warning-strong",
        destructive: "bg-destructive-soft text-destructive-strong",
        info: "bg-info-soft text-info-strong",
        // Récord personal: bronce contenido, nunca naranja
        pr: "bg-pr-soft text-warning-strong",
        outline: "border-border text-foreground",
      },
      size: {
        default: "px-3 py-1 text-xs leading-[1.4]",
        sm: "px-2 py-0.5 text-2xs leading-[1.4]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  size = "default",
  dot = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Punto de estado a la izquierda, del color del texto. */
    dot?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {dot ? (
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full bg-current"
            />
          ) : null}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Badge, badgeVariants }
