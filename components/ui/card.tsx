import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  accent = false,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg"
  /** Barra emerald superior — el único motivo de "borde de acento" del DS. */
  accent?: boolean
  /** Card clickeable: levanta suavemente en hover. */
  interactive?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-accent={accent || undefined}
      className={cn(
        // DS: surface-card, hairline border-subtle, radius-lg, shadow-sm, padding 20px
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg border border-border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm [--card-spacing:--spacing(5)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=lg]:[--card-spacing:--spacing(6)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        accent && "border-t-[3px] border-t-primary",
        interactive &&
          "cursor-pointer transition-[box-shadow,transform,border-color] duration-[var(--dur-base)] ease-out hover:-translate-y-0.5 hover:border-input hover:shadow-lg",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      // DS: la jerarquía sale de tamaño + peso + tracking, no de mayúsculas
      className={cn(
        "font-heading text-lg leading-snug font-bold tracking-tight text-foreground group-data-[size=sm]/card:text-md",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-lg border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
