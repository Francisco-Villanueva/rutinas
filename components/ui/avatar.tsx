"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "xs" | "sm" | "default" | "lg" | "xl"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      // DS: escala 24 / 32 / 40 / 56 / 80, siempre redondo, con hairline
      className={cn(
        "group/avatar relative flex size-10 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border data-[size=xs]:size-6 data-[size=sm]:size-8 data-[size=lg]:size-14 data-[size=xl]:size-20",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      // DS: iniciales en bold sobre accent-soft
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-accent-soft text-sm font-bold tracking-tight text-accent-soft-strong uppercase group-data-[size=xs]/avatar:text-2xs group-data-[size=sm]/avatar:text-xs group-data-[size=lg]/avatar:text-xl group-data-[size=xl]/avatar:text-2xl",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        // DS: punto de estado — ~28% del avatar, anillo del color de la card
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-success text-primary-foreground ring-2 ring-card select-none",
        "group-data-[size=xs]/avatar:size-1.5 group-data-[size=xs]/avatar:[&>svg]:hidden",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3.5 group-data-[size=lg]/avatar:[&>svg]:size-2.5",
        "group-data-[size=xl]/avatar:size-5 group-data-[size=xl]/avatar:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-2 ring-background group-has-data-[size=xs]/avatar-group:size-6 group-has-data-[size=sm]/avatar-group:size-8 group-has-data-[size=lg]/avatar-group:size-14 group-has-data-[size=xl]/avatar-group:size-20 [&>svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
