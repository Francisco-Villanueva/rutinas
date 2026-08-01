import { ImageResponse } from "next/og";

import { Pesa } from "@/components/marca/pesa";

// 180x180 es el tamaño del apple-touch-icon: iOS no lee los iconos del manifest
// para "agregar a la pantalla de inicio", usa este.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<Pesa lado={size.width} />, size);
}
