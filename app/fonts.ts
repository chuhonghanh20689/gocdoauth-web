import { Libre_Baskerville, Noto_Sans_Mono } from "next/font/google";

export const displayFont = Libre_Baskerville({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-display",
});

export const monoFont = Noto_Sans_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});