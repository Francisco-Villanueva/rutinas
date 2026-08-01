import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = {
  title: "Ingresar · Rutinas",
};

// Catch-all opcional: Clerk usa los segmentos extra para los pasos del flujo
// (verificación por mail, reset de contraseña, factor-two).
export default function SignInPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Entrá a tu cuenta
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Tu rutina, tus cargas y tu progreso.
        </p>
      </header>

      <SignIn appearance={clerkAppearance} />
    </div>
  );
}
