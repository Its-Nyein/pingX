import { CreateEventCategoryModal } from "@/components/create-event-category-modal"
import { EmptyState } from "@/components/shell/empty-state"
import { Button } from "@/components/ui/button"
import { client } from "@/lib/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Inbox } from "lucide-react"
import { toast } from "sonner"

export const DashboardEmptyState = () => {
  const queryClient = useQueryClient()

  const { mutate: insertQuickstartCategories, isPending } = useMutation({
    mutationFn: async () => {
      await client.category.insertQuickstartCategories.$post()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event-categories"] })
    },
    onError: (error) => {
      toast.error("Couldn't add starter categories", {
        description: error.message,
      })
    },
  })

  return (
    <EmptyState
      icon={Inbox}
      title="No categories yet"

      description="Create your first one to start receiving events."
      action={
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <CreateEventCategoryModal>
            <Button>Create category</Button>
          </CreateEventCategoryModal>

          <Button
            variant="outline"
            onClick={() => insertQuickstartCategories()}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Use quickstart set"}
          </Button>
        </div>
      }
    />
  )
}
