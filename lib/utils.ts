import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Iniciales para el fallback del Avatar: "Lucía Fernández" -> "LF". */
export function iniciales(nombre: string, apellido?: string | null) {
  return [nombre, apellido]
    .filter(Boolean)
    .join(" ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase()
}

/** Nombre completo listo para mostrar. */
export function nombreCompleto(nombre: string, apellido?: string | null) {
  return [nombre, apellido].filter(Boolean).join(" ")
}
