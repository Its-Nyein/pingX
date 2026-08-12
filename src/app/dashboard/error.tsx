"use client"

import { PageBody } from "@/components/shell/page-body"
import { EmptyState } from "@/components/shell/empty-state"
import { Button } from "@/components/ui/button"
import { TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

const Error = ({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  useEffect(() => {
    console.error("[dashboard] render error", error)
  }, [error])

  return (
    <PageBody>
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description="This page failed to load. Your events are unaffected — nothing was lost."
        action={
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to overview</Link>
              </Button>
            </div>

            {error.digest ? (
              <p className="text-xs text-muted-foreground">
                Reference{" "}
                <code className="rounded border border-border bg-recessed/60 px-1.5 py-0.5 font-mono">
                  {error.digest}
                </code>
              </p>
            ) : null}
          </div>
        }
      />
    </PageBody>
  )
}

export default Error
