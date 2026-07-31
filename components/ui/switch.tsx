"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // DS: pista de 42x24 (2px de padding), apagada en border-strong, encendida en accent
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-[var(--dur-base)] ease-out outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-6 data-[size=default]:w-[42px] data-[size=sm]:h-5 data-[size=sm]:w-[34px] data-checked:bg-primary data-unchecked:bg-border-strong data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        // El knob usa el ease-spring del DS: un asentamiento suave, sin rebote marcado
        className="pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-[var(--dur-base)] ease-spring group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 data-unchecked:translate-x-0 group-data-[size=default]/switch:data-checked:translate-x-[18px] group-data-[size=sm]/switch:data-checked:translate-x-[14px]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
