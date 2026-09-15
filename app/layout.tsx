import type { Metadata } from "next";
import { JetBrains_Mono, Titillium_Web } from "next/font/google";
import Script from "next/script";
import { BottomNav } from "@/components/f1/BottomNav";
import { LightsOut } from "@/components/f1/LightsOut";
import { SiteFooter } from "@/components/f1/SiteFooter";
import { SiteHeader } from "@/components/f1/SiteHeader";
import "./globals.css";

const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "BOXBOX — Everything from the pit wall",
  description:
    "Standings, news, the driver market and the pecking order in one place. An unofficial fan site.",
};

/** Marks the session as having seen the lights-out intro, before first paint. */
const LIGHTS_ONCE = `try{var k="bb-lights";if(sessionStorage.getItem(k)){document.documentElement.dataset.lights="seen"}else{sessionStorage.setItem(k,"1")}}catch(e){document.documentElement.dataset.lights="seen"}`;

/**
 * Root layout: fonts, the once-per-session lights-out intro, header, mobile
 * bottom navigation, and the footer carrying the unofficial-site disclaimer.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${titillium.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script id="lights-once" strategy="beforeInteractive">
          {LIGHTS_ONCE}
        </Script>
        <LightsOut />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
