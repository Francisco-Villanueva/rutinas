import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent bg-clip-padding font-semibold tracking-label whitespace-nowrap transition-[transform,filter,background-color,border-color,box-shadow] duration-[var(--dur-fast)] ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em]",
  {
    variants: {
      variant: {
        // DS primary — relleno emerald con el glow contenido
        default:
          "bg-primary text-primary-foreground shadow-accent hover:brightness-[1.04] active:scale-[0.98]",
        // DS secondary — superficie de card con borde
        outline:
          "border-input bg-card text-foreground shadow-xs hover:bg-muted active:scale-[0.98] aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:brightness-[0.98] active:scale-[0.98]",
        // DS ghost — se rellena con la superficie hundida en hover
        ghost:
          "text-body hover:bg-muted hover:text-foreground active:scale-[0.98] aria-expanded:bg-muted",
        // DS danger — relleno sólido, sin glow
        destructive:
          "bg-destructive text-white hover:brightness-[1.04] active:scale-[0.98] focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Alturas de control del DS: 32 / 40 / 48
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-5 text-md",
        lg: "h-12 px-6 text-lg",
        // Icon-only (el IconButton del DS): comprime un poco más en press
        "icon-sm": "size-8 px-0 active:scale-[0.94]",
        icon: "size-10 px-0 active:scale-[0.94]",
        "icon-lg": "size-12 px-0 active:scale-[0.94]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
