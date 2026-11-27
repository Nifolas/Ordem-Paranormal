import type { Metadata } from "next";
import {
  Caveat,
  Crimson_Pro,
  Inter,
  JetBrains_Mono,
  Space_Grotesk,
  Special_Elite,
} from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ParanormalBackground } from "@/components/layout/ParanormalBackground";
import { RollOverlay } from "@/components/layout/RollOverlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-typewriter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-handwriting",
  display: "swap",
});

export const metadata: Metadata = {
  title: "V.E.R.A. // Vigilância Especial de Registros Anômalos",
  description:
    "Sistema tático V.E.R.A. de dossiês de agentes, rolagem oficial, escudo do mestre, bestiário e homebrew para Ordem Paranormal RPG v1.2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${crimsonPro.variable} ${specialElite.variable} ${caveat.variable}`}
    >
      <body className="font-sans antialiased bg-[#09090B] text-[#F4F4F5] selection:bg-zinc-200 selection:text-[#09090B] cris-grain">
        <ParanormalBackground />
        <div className="min-h-screen flex flex-col relative z-10">
          <Navbar />
          <main className="flex-1">{children}</main>
          <RollOverlay />
        </div>
      </body>
    </html>
  );
}
