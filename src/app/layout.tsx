import type { Metadata } from "next"
import localFont from "next/font/local"
import Script from "next/script"
import NextTopLoader from "nextjs-toploader"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { FONT_INIT_SCRIPT } from "@/lib/font"

const roboto = localFont({
  src: "./fonts/roboto-variable.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-roboto",
})

const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
})

const manrope = localFont({
  src: "./fonts/manrope-variable.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-manrope",
})

const bebas = localFont({
  src: "./fonts/bebas-neue-400.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-bebas",
})

export const metadata: Metadata = {
  title: "pingX",
  description: "Created using Next.Js",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(roboto.variable, inter.variable, manrope.variable, bebas.variable)}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="font-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: FONT_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-[calc(100vh-1px)] font-sans bg-background text-foreground antialiased flex flex-col">
        <NextTopLoader
          color="var(--primary)"
          height={2}
          shadow={false}
          showSpinner={false}
        />
        <main className="relative flex flex-col flex-1">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
