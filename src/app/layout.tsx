import type { Metadata } from "next"
import { Bebas_Neue, Inter, Roboto } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const roboto = Roboto({
  weight: ["300","400","700"],
  subsets: ["latin"],
  variable: "--font-roboto"
})

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-bebas"
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
    <html lang="en" className={cn(roboto.variable, bebas.variable)}>
      <body className="font-sans bg-brand-50 text-brand-950 antialiased">
        {children}
      </body>
    </html>
  )
}
