import { EmptyState } from "@/components/shell/empty-state"
import { PageBody } from "@/components/shell/page-body"
import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"
import Link from "next/link"

const NotFound = () => (
  <PageBody>
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="That category or page does not exist, or it belongs to another account."
      action={
        <Button asChild>
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      }
    />
  </PageBody>
)

export default NotFound
