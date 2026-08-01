import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ClipboardList, Dumbbell, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Portada.
 *
 * No hay registro público —al alumno lo da de alta su profesor— así que esto no
 * es una landing de venta: es la puerta de entrada para alguien que ya tiene
 * cuenta. Con sesión abierta ni se muestra, redirige a /post-login, que bifurca
 * por rol.
 */
export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/post-login");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-xl bg-primary shadow-accent">
          <Dumbbell aria-hidden className="size-8 text-primary-foreground" />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl leading-tight font-bold tracking-display text-foreground">
            Rutinas
          </h1>
          <p className="text-md text-muted-foreground">
            Tu rutina del día, la carga de tus entrenamientos y tu progreso, en
            un solo lugar.
          </p>
        </div>

        <Button size="lg" className="w-full" asChild>
          <Link href="/sign-in">Ingresar</Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          ¿No tenés cuenta? Te la crea tu profe: pedile que te invite con tu
          email.
        </p>
      </div>

      <ul className="flex w-full max-w-sm flex-col gap-3 border-t border-border pt-8">
        <Punto icono={<ClipboardList aria-hidden />}>
          Mirá qué te toca entrenar hoy, con series, repeticiones y peso.
        </Punto>
        <Punto icono={<Dumbbell aria-hidden />}>
          Cargá lo que levantaste entre serie y serie, desde el celular.
        </Punto>
        <Punto icono={<TrendingUp aria-hidden />}>
          Seguí tus récords personales y tu evolución semana a semana.
        </Punto>
      </ul>
    </main>
  );
}

function Punto({
  icono,
  children,
}: {
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-primary [&>svg]:size-[18px]">
        {icono}
      </span>
      <span className="text-sm text-body">{children}</span>
    </li>
  );
}
