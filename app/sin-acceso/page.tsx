import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sin acceso · Rutinas",
};

// Adónde caen los que tienen sesión de Clerk pero no tienen fila activa en
// `usuarios`. Sin esta pantalla el redirect a /sign-in haría un loop infinito:
// Clerk los considera logueados y los devuelve enseguida.
//
// En la práctica pasa en dos casos: una cuenta creada en Clerk que nadie dio de
// alta en la base, o un alumno dado de baja (activo = false).
export default function SinAccesoPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tu cuenta todavía no está habilitada
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Pedile a tu profesor que te dé de alta con este mismo mail.
        </p>
      </div>

      <SignOutButton redirectUrl="/sign-in">
        <Button variant="outline">Cerrar sesión</Button>
      </SignOutButton>
    </main>
  );
}
