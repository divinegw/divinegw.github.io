import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

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
      <body>
        {/* visível só quando o teclado chega nele; cada página põe id="conteudo" no <main> */}
        <a
          href="#conteudo"
          className="fixed top-4 left-4 z-[60] inline-flex h-control -translate-y-[200%] items-center rounded-md bg-primary px-4 text-body font-semibold text-primary-foreground focus-visible:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
