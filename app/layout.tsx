import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "DistribPro — Portail de commandes B2B pour distributeurs marocains",
    template: "%s · DistribPro",
  },
  description:
    "DistribPro transforme votre catalogue en portail de commandes B2B : produits, tarifs professionnels personnalisés et commandes centralisées pour les grossistes et distributeurs au Maroc.",
  keywords: [
    "B2B Maroc",
    "portail commande grossiste",
    "catalogue B2B",
    "tarifs professionnels",
    "distributeur Maroc",
    "sanitaire",
    "électricité",
  ],
  openGraph: {
    title: "DistribPro — Transformez votre catalogue en portail de commandes B2B",
    description:
      "Centralisez vos produits, vos tarifs professionnels et les commandes de vos clients sur une seule plateforme.",
    type: "website",
    locale: "fr_MA",
    siteName: "DistribPro",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
