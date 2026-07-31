import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // DS: padding space-3, radius-md, texto 16px con lh normal, resize vertical
        "flex field-sizing-content min-h-24 w-full resize-y rounded-md border border-input bg-card p-3 text-md leading-normal shadow-xs transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out outline-none placeholder:text-faint focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
