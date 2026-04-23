import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@/components/analytics";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MelhorMetro | Busca Inteligente de Imóveis",
  description: "Encontre o imóvel dos seus sonhos usando inteligência artificial. Busque por qualquer característica: terrenos com árvores, casas com vista, e muito mais.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  other: {
    'X-UA-Compatible': 'IE=edge',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased min-h-screen flex flex-col`}>
        <Analytics />
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <BottomTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
