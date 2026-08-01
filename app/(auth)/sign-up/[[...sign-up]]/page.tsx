import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = {
  title: "Crear cuenta · Rutinas",
};

// Esta pantalla existe para el flujo de invitación: el alumno no se registra
// solo, llega acá desde el mail de Clerk con un ticket en la URL, y el
// catch-all es lo que deja que Clerk lo lea.
// El registro público se cierra desde el dashboard de Clerk
// (Configure -> Restrictions -> Sign-up mode: Restricted), no desde el código.
export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Creá tu cuenta
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Usá el mismo mail donde recibiste la invitación.
        </p>
      </header>

      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
