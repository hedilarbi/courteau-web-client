// app/layout.jsx
import "./globals.css";
import { Bebas_Neue, Inter } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "@/context/AppProviders";
import { Toaster } from "react-hot-toast";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "300", "400", "500", "700"],
});

const BRAND = "Casse-Croûte Courteau";
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lecourteau.com";

export const metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: BRAND,
    template: `%s | ${BRAND}`,
  },
  description:
    "Venez découvrir les généreuses et délicieuses poutines ou les succulentes pizzas du Casse-Croûte Courteau. Le meilleur menu à Trois-Rivières.",
  applicationName: BRAND,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: BASE,
    siteName: BRAND,
    title: BRAND,
    description:
      "Venez découvrir les généreuses et délicieuses poutines ou les succulentes pizzas du Casse-Croûte Courteau. Le meilleur menu à Trois-Rivières.",
    locale: "fr_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND,
    description:
      "Venez découvrir les généreuses et délicieuses poutines ou les succulentes pizzas du Casse-Croûte Courteau. Le meilleur menu à Trois-Rivières.",
  },
  icons: {
    icon: "/favicon.ico",

    shortcut: "/favicon.ico",
  },
  // optionnel: reliez votre propriété Search Console
  // verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

export const viewport = {
  themeColor: "#000000",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  // JSON-LD WebSite + SearchAction (pour la “sitelinks search box”)
  const ldWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    url: BASE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE}/recherche?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="fr-CA">
      <body className={`${bebasNeue.variable} ${inter.variable} antialiased`}>
        <AppProviders>
          <Toaster position="top-left" containerStyle={{ zIndex: 9999 }} />
          {children}
        </AppProviders>

        <Script
          id="ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldWebsite) }}
        />
      </body>
    </html>
  );
}
