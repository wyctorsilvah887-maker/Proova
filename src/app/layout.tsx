import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proova AI — Automação de Avaliações no Google Meu Negócio com IA",
  description: "Responda avaliações do Google automaticamente com Inteligência Artificial, aumente sua nota no Maps e atraia mais clientes locais.",
  metadataBase: new URL('https://useproova.online'),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "maskable-icon",
        url: "/maskable_icon_x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        rel: "maskable-icon",
        url: "/maskable_icon_x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "maskable-icon",
        url: "/maskable_icon_x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Proova AI — Automação de Avaliações no Google Meu Negócio com IA",
    description: "Responda avaliações do Google automaticamente com Inteligência Artificial, aumente sua nota no Maps e atraia mais clientes locais.",
    url: 'https://useproova.online',
    siteName: 'Proova AI',
    images: [
      {
        url: 'https://picsum.photos/seed/proova-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'Proova AI — Gestão de Reputação com IA',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Proova AI — Automação de Avaliações no Google Meu Negócio com IA",
    description: "Responda avaliações do Google automaticamente com Inteligência Artificial, aumente sua nota no Maps e atraia mais clientes locais.",
    images: ['https://picsum.photos/seed/proova-og/1200/630'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} antialiased h-full bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme={true}
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
