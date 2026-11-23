import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

// Fontes servidas pelo próprio site (OFL; licenças em public/assets/fonts/).
const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const jetbrains = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-400.woff2", weight: "400" },
    { path: "./fonts/jetbrains-mono-500.woff2", weight: "500" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://divinegw.github.io"),
  title: { default: "Manual da Guilda DIVINE", template: "%s · DIVINE" },
  description: "Guias de Raids, Fractals, Dungeons e Endgame de Guild Wars 2 da guilda DIVINE.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", inter.variable, jetbrains.variable)}>
      <body>{children}</body>
    </html>
  );
}
