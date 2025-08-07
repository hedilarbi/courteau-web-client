import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";
import Header from "@/components/Header";

const BebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  variables: "--font-bebas-neue",
  weight: ["400"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "300", "400", "500", "700"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Casse-Croûte Le Courteau",
  description:
    "Casse-Croûte Le Courteau - Votre destination pour des repas rapides et délicieux",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${BebasNeue.variable} ${inter.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
