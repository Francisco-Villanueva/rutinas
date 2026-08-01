import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rutinas",
    template: "%s · Rutinas",
  },
  description: "Rutinas de entrenamiento y seguimiento de progreso.",
  applicationName: "Rutinas",
  // Al agregarla a la pantalla de inicio de iOS, arranca sin barra del
  // navegador. El resto de lo que necesita la instalación está en app/manifest.ts.
  appleWebApp: {
    capable: true,
    title: "Rutinas",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Pinta la barra de estado del celular con el verde de la marca.
  themeColor: "#16714c",
  // La app se diseñó para 375px y se carga con una mano: el ancho fijo del
  // dispositivo es lo correcto. No se bloquea el zoom — hacerlo rompe la
  // accesibilidad de quien necesita agrandar el texto.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      {/* Desde Core 3 el ClerkProvider va adentro de <body>, no envolviendo
          a <html>. */}
      <body className="min-h-full flex flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
