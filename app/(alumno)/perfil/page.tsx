import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

import { getPerfil } from "@/lib/data/perfil";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function PerfilPage() {
  const perfil = await getPerfil();

  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <header className="flex items-center gap-3.5">
        <Avatar size="lg">
          <AvatarFallback>{perfil.iniciales}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-xl leading-tight font-bold tracking-display text-foreground">
            {perfil.nombre}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{perfil.email}</p>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <Dato label="Tu profe" valor={perfil.profesor?.nombre ?? "Sin asignar"} />
          <Dato label="Rutina actual" valor={perfil.rutina ?? "Sin rutina asignada"} />
          {perfil.objetivo ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Objetivo</span>
              <Badge size="sm">{perfil.objetivo}</Badge>
            </div>
          ) : null}
          <Dato
            label="Entrenamientos completados"
            valor={String(perfil.entrenamientos)}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Para cambiar tu rutina o tus datos, hablá con tu profe.
      </p>

      <SignOutButton redirectUrl="/sign-in">
        <Button variant="outline" size="lg" className="w-full">
          <LogOut aria-hidden />
          Cerrar sesión
        </Button>
      </SignOutButton>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-semibold text-body">{valor}</span>
    </div>
  );
}
