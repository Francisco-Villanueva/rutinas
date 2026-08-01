import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/nextjs";

// Core 3 no exporta el tipo `Appearance` públicamente, así que lo sacamos del
// prop del propio componente. Un nombre de variable mal escrito rompe el
// typecheck acá y no en runtime.
type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

// Los componentes de Clerk se montan en el DOM de la página (no en un iframe),
// así que leen las custom properties del design system directamente.
// Todo lo de acá sale de app/globals.css: no hay colores nuevos.
//
// OJO con los nombres: Core 3 renombró las variables de appearance.
// colorText -> colorForeground, colorTextSecondary -> colorMutedForeground,
// colorInputBackground -> colorInput, colorInputText -> colorInputForeground.
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "var(--green-600)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorForeground: "var(--neutral-900)",
    colorMutedForeground: "var(--neutral-500)",
    colorBackground: "var(--neutral-0)",
    colorInput: "var(--neutral-0)",
    colorInputForeground: "var(--neutral-900)",
    colorBorder: "var(--neutral-200)",
    colorRing: "var(--green-600)",
    colorDanger: "var(--red-500)",
    colorSuccess: "var(--green-600)",
    colorWarning: "var(--amber-500)",

    fontFamily: "var(--font-manrope), system-ui, sans-serif",
    // Base de la escala de radios de Clerk: deriva sm/lg/xl a partir de este.
    // Equivale a --radius-md del DS.
    borderRadius: "12px",
  },
  elements: {
    // La tarjeta la dibuja el layout de (auth); Clerk aporta solo el formulario.
    rootBox: "w-full",
    cardBox: "w-full shadow-none border-none",
    card: "bg-transparent shadow-none p-0 gap-6",
    header: "hidden",

    formButtonPrimary:
      "h-12 text-md font-semibold normal-case tracking-tight shadow-accent",
    formFieldInput: "h-12 text-md",
    formFieldLabel: "text-sm font-medium text-body",

    socialButtonsBlockButton: "h-12 border-border text-md",
    dividerLine: "bg-border",
    dividerText: "text-faint text-xs",

    footer: "bg-transparent",
    footerActionText: "text-muted-foreground text-sm",
    footerActionLink: "text-primary font-semibold hover:text-accent-soft-strong",
  },
};
