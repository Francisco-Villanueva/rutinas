"use client"

/**
 * Página TEMPORAL de revisión del design system.
 * Renderiza todos los componentes juntos para mirarlos de un vistazo.
 * Se borra cuando el DS esté aprobado — no linkear desde la app.
 */

import * as React from "react"
import {
  Bell,
  Dumbbell,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
} from "lucide-react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Stat } from "@/components/stat"
import { Switch } from "@/components/ui/switch"
import { Tag } from "@/components/tag"
import { Textarea } from "@/components/ui/textarea"

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {note ? (
          <p className="text-sm leading-normal text-muted-foreground">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`h-14 w-full rounded-md border border-border ${className}`}
      />
      <span className="font-mono text-2xs text-muted-foreground">{name}</span>
    </div>
  )
}

const TAGS = ["Pecho", "Espalda", "Pierna", "Hombros"]

export default function DesignSystemPage() {
  const [tags, setTags] = React.useState(TAGS)
  const [activeTag, setActiveTag] = React.useState("Pecho")

  return (
    <main className="mx-auto flex w-full max-w-app flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Rutinas · Design system</span>
        <h1 className="text-3xl font-bold tracking-display">
          Componentes y tokens
        </h1>
        <p className="text-md leading-normal text-body">
          Página temporal de revisión. Todo lo de acá sale de los tokens en{" "}
          <code className="font-mono text-sm">app/globals.css</code>.
        </p>
      </header>

      <Section
        title="Color"
        note="Emerald de marca usado con cuentagotas, neutros grafito cálido y semánticos apagados."
      >
        <Row label="Marca y superficies">
          <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-6">
            <Swatch name="primary" className="bg-primary" />
            <Swatch name="accent-soft" className="bg-accent-soft" />
            <Swatch name="background" className="bg-background" />
            <Swatch name="card" className="bg-card" />
            <Swatch name="muted" className="bg-muted" />
            <Swatch name="canvas" className="bg-canvas" />
          </div>
        </Row>
        <Row label="Semánticos">
          <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-6">
            <Swatch name="success" className="bg-success" />
            <Swatch name="warning" className="bg-warning" />
            <Swatch name="destructive" className="bg-destructive" />
            <Swatch name="info" className="bg-info" />
            <Swatch name="pr" className="bg-pr" />
            <Swatch name="border-strong" className="bg-border-strong" />
          </div>
        </Row>
        <Row label="Texto">
          <div className="flex flex-col gap-1">
            <span className="text-md text-foreground">foreground — strong</span>
            <span className="text-md text-body">body — texto corrido</span>
            <span className="text-md text-muted-foreground">
              muted-foreground — secundario
            </span>
            <span className="text-md text-faint">faint — placeholders</span>
          </div>
        </Row>
      </Section>

      <Section
        title="Tipografía"
        note="Manrope para todo; JetBrains Mono para datos tabulares. La jerarquía sale de tamaño + peso + tracking."
      >
        <div className="flex flex-col gap-3">
          <p className="text-5xl font-bold tracking-display">64 · hero</p>
          <p className="text-3xl font-bold tracking-display">36 · display</p>
          <p className="text-2xl font-bold tracking-tight">28 · título</p>
          <p className="text-xl font-semibold tracking-tight">22 · subtítulo</p>
          <p className="text-lg leading-normal">18 · lead</p>
          <p className="text-md leading-normal text-body">16 · body</p>
          <p className="text-sm text-muted-foreground">14 · small</p>
          <p className="text-xs text-muted-foreground">12 · caption</p>
          <p className="eyebrow">11 · eyebrow en caps trackeadas</p>
          <p className="font-mono text-lg tabular-nums">
            102,5 kg · 8 reps · RPE 8
          </p>
        </div>
      </Section>

      <Section title="Radios y sombras">
        <Row label="Radios">
          <div className="flex flex-wrap gap-3">
            {[
              ["xs · 5", "rounded-xs"],
              ["sm · 8", "rounded-sm"],
              ["md · 12", "rounded-md"],
              ["lg · 16", "rounded-lg"],
              ["xl · 22", "rounded-xl"],
              ["2xl · 30", "rounded-2xl"],
              ["pill", "rounded-full"],
            ].map(([name, cls]) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <div className={`size-16 border border-border bg-card ${cls}`} />
                <span className="font-mono text-2xs text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Row>
        <Row label="Sombras">
          <div className="flex flex-wrap gap-4 py-2">
            <div className="size-20 rounded-lg bg-card shadow-xs" />
            <div className="size-20 rounded-lg bg-card shadow-sm" />
            <div className="size-20 rounded-lg bg-card shadow-md" />
            <div className="size-20 rounded-lg bg-card shadow-lg" />
            <div className="size-20 rounded-lg bg-card shadow-xl" />
            <div className="size-20 rounded-lg bg-primary shadow-accent" />
          </div>
        </Row>
      </Section>

      <Section title="Button" note="shadcn/ui · variantes y tamaños del DS.">
        <Row label="Variantes">
          <Button>Guardar rutina</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="secondary">Duplicar</Button>
          <Button variant="ghost">Ver detalle</Button>
          <Button variant="destructive">Eliminar</Button>
          <Button variant="link">Más info</Button>
        </Row>
        <Row label="Tamaños">
          <Button size="sm">Chico · 32</Button>
          <Button>Medio · 40</Button>
          <Button size="lg">Grande · 48</Button>
        </Row>
        <Row label="Con icono / estados">
          <Button>
            <Plus />
            Invitar alumno
          </Button>
          <Button variant="outline">
            <Search />
            Buscar
          </Button>
          <Button disabled>
            <Loader2 className="animate-spin" />
            Guardando
          </Button>
          <Button disabled variant="outline">
            Deshabilitado
          </Button>
        </Row>
        <Row label="Icon-only">
          <Button size="icon-sm" variant="outline" aria-label="Editar">
            <Pencil />
          </Button>
          <Button size="icon" variant="outline" aria-label="Notificaciones">
            <Bell />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Eliminar">
            <Trash2 />
          </Button>
          <Button size="icon-lg" aria-label="Agregar">
            <Plus />
          </Button>
        </Row>
        <Row label="Block">
          <Button className="w-full">Continuar entrenamiento</Button>
        </Row>
      </Section>

      <Section title="Campos de formulario">
        <div className="flex flex-col gap-5 sm:max-w-md">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-email">Email</Label>
            <Input id="ds-email" type="email" placeholder="lucia@gimnasio.com" />
            <span className="text-xs text-muted-foreground">
              Le mandamos la invitación acá.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-peso">Peso</Label>
            <Input
              id="ds-peso"
              inputMode="decimal"
              placeholder="102,5"
              className="font-mono tabular-nums"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-error">Repeticiones</Label>
            <Input id="ds-error" aria-invalid defaultValue="0" />
            <span className="text-xs text-destructive-strong">
              Tiene que ser mayor a 0.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-disabled">Deshabilitado</Label>
            <Input id="ds-disabled" disabled defaultValue="No editable" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-obj">Objetivo del mesociclo</Label>
            <Select>
              <SelectTrigger id="ds-obj">
                <SelectValue placeholder="Elegí un objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Bloques</SelectLabel>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="fuerza">Fuerza</SelectItem>
                  <SelectItem value="resistencia">Resistencia</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-nota">Nota del profe</Label>
            <Textarea
              id="ds-nota"
              placeholder="Cuidá la técnica en press militar, no arquees de más."
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="eyebrow">Checkbox</span>
            <div className="flex items-center gap-2">
              <Checkbox id="ds-c1" defaultChecked />
              <Label htmlFor="ds-c1" className="font-normal text-body">
                Avisarme cuando cargue la sesión
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="ds-c2" />
              <Label htmlFor="ds-c2" className="font-normal text-body">
                Repetir la semana anterior
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="ds-c3" disabled />
              <Label htmlFor="ds-c3" className="font-normal text-body">
                Deshabilitado
              </Label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="eyebrow">Switch</span>
            <div className="flex items-center gap-3">
              <Switch id="ds-s1" defaultChecked />
              <Label htmlFor="ds-s1" className="font-normal text-body">
                Notificaciones push
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ds-s2" />
              <Label htmlFor="ds-s2" className="font-normal text-body">
                Modo descanso
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ds-s3" size="sm" defaultChecked />
              <Label htmlFor="ds-s3" className="font-normal text-body">
                Chico
              </Label>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Empuje — Pecho / Hombros</CardTitle>
              <CardDescription>6 ejercicios · 24 series</CardDescription>
            </CardHeader>
            <CardContent className="text-body">
              Card base: superficie, hairline y sombra suave.
            </CardContent>
          </Card>

          <Card accent>
            <CardHeader>
              <CardTitle>Hoy te toca</CardTitle>
              <CardDescription>
                Card destacada con la barra emerald superior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Continuar entrenamiento</Button>
            </CardContent>
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>Lucía Fernández</CardTitle>
              <CardDescription>Card clickeable: levanta en hover.</CardDescription>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Compacta</CardTitle>
              <CardDescription>size=&quot;sm&quot;</CardDescription>
            </CardHeader>
            <CardFooter className="justify-end gap-2">
              <Button size="sm" variant="ghost">
                Descartar
              </Button>
              <Button size="sm">Guardar</Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Badge" note="Pastilla de estado. Tonos suaves, nunca vívidos.">
        <Row label="Tonos">
          <Badge>Neutral</Badge>
          <Badge variant="accent">Activo</Badge>
          <Badge variant="success">Mesociclo completo</Badge>
          <Badge variant="warning">Estancada en press</Badge>
          <Badge variant="destructive">Inactiva 8 días</Badge>
          <Badge variant="info">Nueva rutina</Badge>
          <Badge variant="pr">
            <Trophy />
            Nuevo PR
          </Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>
        <Row label="Con punto / tamaño sm">
          <Badge variant="success" dot>
            Activo
          </Badge>
          <Badge variant="destructive" dot>
            Inactivo
          </Badge>
          <Badge size="sm" variant="accent">
            Semana 3
          </Badge>
          <Badge size="sm" variant="pr" dot>
            PR
          </Badge>
        </Row>
      </Section>

      <Section title="Tag" note="Componente propio: shadcn no tiene un chip categórico.">
        <Row label="Selección">
          {TAGS.map((t) => (
            <Tag
              key={t}
              active={activeTag === t}
              onClick={() => setActiveTag(t)}
              className="cursor-pointer"
            >
              {t}
            </Tag>
          ))}
        </Row>
        <Row label="Removibles">
          {tags.map((t) => (
            <Tag
              key={t}
              onRemove={() => setTags((prev) => prev.filter((x) => x !== t))}
            >
              {t}
            </Tag>
          ))}
          {tags.length === 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setTags(TAGS)}>
              Restaurar
            </Button>
          ) : null}
        </Row>
      </Section>

      <Section title="Avatar">
        <Row label="Tamaños">
          {(["xs", "sm", "default", "lg", "xl"] as const).map((s) => (
            <Avatar key={s} size={s}>
              <AvatarFallback>LF</AvatarFallback>
            </Avatar>
          ))}
        </Row>
        <Row label="Con estado">
          <Avatar>
            <AvatarFallback>LF</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>MG</AvatarFallback>
            <AvatarBadge className="bg-warning" />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>JP</AvatarFallback>
            <AvatarBadge className="bg-faint" />
          </Avatar>
        </Row>
      </Section>

      <Section title="Progress">
        <div className="flex max-w-md flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                Adherencia
              </span>
              <span className="font-mono tabular-nums text-body">78%</span>
            </div>
            <Progress value={78} />
          </div>
          <Progress value={45} size="sm" />
          <Progress value={92} size="lg" tone="success" />
          <Progress value={30} tone="warning" />
          <Progress value={15} tone="destructive" />
          <Progress value={100} tone="pr" />
        </div>
      </Section>

      <Section
        title="Stat"
        note="Componente propio: la lectura grande de métrica del DS."
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <Stat
            label="1RM estimado"
            value="128"
            unit="kg"
            delta="+4,5 kg"
            icon={<Dumbbell className="size-3.5" />}
          />
          <Stat
            label="Volumen semanal"
            value="18,4"
            unit="t"
            delta="-1,2 t"
            deltaDir="down"
          />
          <Stat
            label="Racha"
            value="12"
            unit="días"
            icon={<Flame className="size-3.5" />}
          />
        </div>
        <div className="grid gap-6 pt-2 sm:grid-cols-3">
          <Stat size="sm" label="Adherencia" value="78" unit="%" />
          <Stat size="lg" label="Series hoy" value="24" />
        </div>
      </Section>
    </main>
  )
}
