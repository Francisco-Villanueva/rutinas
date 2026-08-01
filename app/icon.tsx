import { ImageResponse } from "next/og";

import { Pesa } from "@/components/marca/pesa";

// 512 es el tamaño que pide el manifest para el ícono de la pantalla de inicio;
// el navegador lo escala solo para la pestaña. Un solo archivo cubre los dos usos.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Pesa lado={size.width} />, size);
}
