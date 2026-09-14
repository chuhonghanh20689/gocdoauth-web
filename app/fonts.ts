import { Libre_Baskerville, Noto_Sans_Mono, Noto_Serif } from "next/font/google";

export const displayFont = Libre_Baskerville({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-display",
});

export const brandFont = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-brand",
});

export const monoFont = Noto_Sans_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});