"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const toneClass = {
  accent: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  pr: "bg-pr",
} as const

function Progress({
  className,
  value,
  size = "default",
  tone = "accent",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  size?: "sm" | "default" | "lg"
  tone?: keyof typeof toneClass
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-size={size}
      // DS: alturas 6 / 10 / 14, pista hundida con hairline, siempre pill
      className={cn(
        "relative flex h-2.5 w-full items-center overflow-x-hidden rounded-full border border-border bg-muted data-[size=sm]:h-1.5 data-[size=lg]:h-3.5",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // El llenado usa la duración lenta del DS
        className={cn(
          "size-full flex-1 rounded-full transition-transform duration-[var(--dur-slow)] ease-out",
          toneClass[tone]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
