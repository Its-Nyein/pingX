"use client"

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HTTPException } from "hono/http-exception"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { PropsWithChildren, useState } from "react"

export const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (err) => {
            let errorMessage: string
            if (err instanceof HTTPException) {
              errorMessage = err.message
            } else if (err instanceof Error) {
              errorMessage = err.message
            } else {
              errorMessage = "An unknown error occurred."
            }

            console.log(errorMessage)
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>

      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}

        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
