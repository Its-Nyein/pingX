import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"

const roboto = localFont({
  src: "./fonts/roboto-variable.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-roboto",
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
      className={cn(roboto.variable, bebas.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-[calc(100vh-1px)] font-sans bg-background text-foreground antialiased flex flex-col">
        <main className="relative flex flex-col flex-1">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
