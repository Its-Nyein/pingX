"use client"

import "./globals.css"
import { useEffect } from "react"

const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  useEffect(() => {
    console.error("[app] root error", error)
  }, [error])

  // Replaces the root layout, so this owns html and body and cannot rely on
  // the theme provider or any shell component.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold tracking-tight">
            pingX could not load
          </p>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Something failed before the page could render. Your events and data
            are unaffected.
          </p>

          <button
            onClick={reset}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reload
          </button>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}

export default GlobalError
