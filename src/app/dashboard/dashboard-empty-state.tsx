import { CreateEventCategoryModal } from "@/components/create-event-category-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { client } from "@/lib/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const DashboardEmptyState = () => {
  const queryClient = useQueryClient();

  const { mutate: insertQuickstartCategories, isPending } = useMutation({
    mutationFn: async () => {
      await client.category.insertQuickstartCategories.$post();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event-categories"] });
    },
  });

  return (
    <Card className="flex flex-col items-center justify-center rounded-2xl flex-1 text-center p-8 border border-gray-200 shadow-md">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        No Event Categories Yet
      </h1>

      <p className="text-sm text-gray-600 max-w-md mt-3">
        Start organizing your events by creating a category.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center w-full mt-6 space-y-3 sm:space-y-0 sm:space-x-4">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => insertQuickstartCategories()}
          disabled={isPending}
        >
          ⚡ {isPending ? "Creating..." : "Quickstart"}
        </Button>

        <CreateEventCategoryModal>
          <Button className="w-full sm:w-auto">+ Add Category</Button>
        </CreateEventCategoryModal>
      </div>
    </Card>
  );
};
