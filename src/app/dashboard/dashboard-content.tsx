"use client"

import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import LoadingSpinner  from "@/components/loading-spinner"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowRight, BarChart2, Clock, Database, PlusIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DashboardEmptyState } from "./dashboard-empty-state"
import { CreateEventCategoryModal } from "@/components/create-event-category-modal"

export const DashboardContent = () => {
    const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const {data: categories, isPending: isEventCategoryLoading} = useQuery({
        queryKey: ["user-event-categories"],
        queryFn: async () => {
            const res = await client.category.getEventCategories.$get();
            const {categories} = await res.json();
            return categories;
        }
    })

    const {mutate: deleteCategory, isPending: isDeletingCategory} = useMutation({
        mutationFn: async (name: string) => {
            await client.category.deleteCategory.$post({name});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-event-categories"] });
            setDeletingCategory(null);
        }
    })

    if(isEventCategoryLoading) {
        return (
            <div className="flex flex-1 justify-center items-center size-full">
                <LoadingSpinner/>
            </div>
        )
    }

    if(!categories || categories.length === 0) {
        return <DashboardEmptyState/>
    }

    return (
        <>

            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {categories.length} {categories.length === 1 ? "category" : "categories"}
                </p>

                <CreateEventCategoryModal>
                    <Button>
                        <PlusIcon />
                        Create category
                    </Button>
                </CreateEventCategoryModal>
            </div>

            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {
                    categories.map(category => (
                        <li
                            key={category.id}
                            className="group rounded-md border border-border bg-card transition-colors hover:border-foreground/20"
                        >
                            <div className="p-4">
                                <div className="mb-4 flex items-center gap-4">
                                    <div>
                                        <h3 className="text-base font-semibold tracking-tight text-foreground">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground">{format(category.createdAt, "MM d, yyyy")}</p>
                                    </div>
                                </div>

                                <div className="mb-4 space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Clock className="size-4 mr-2 text-link"/>
                                        <span className="font-medium">Last Ping:</span>
                                        <span className="ml-1">
                                            {
                                                category.lastPing ? formatDistanceToNow(category.lastPing) + " ago": "Never"
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Database className="size-4 mr-2 text-link"/>
                                        <span className="font-medium">Unique Fields:</span>
                                        <span className="ml-1">
                                            { category.uniqueFieldCount || 0 }
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <BarChart2 className="size-4 me-2 text-link"/>
                                        <span className="font-medium">Events this month:</span>
                                        <span className="ml-1">
                                            { category.eventsCount || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <Link
                                        href={`/dashboard/category/${category.name}`}
                                        className={buttonVariants({
                                            variant: "outline",
                                            size: "sm",
                                            className: "flex items-center text-sm gap-2"
                                        })}
                                    >
                                        View All <ArrowRight className="size-4"/>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                        aria-label={`Delete ${category.name}`}
                                        onClick={() => setDeletingCategory(category.name)}
                                    >
                                        <Trash2 className="size-4"/>
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))
                }
            </ul>

            <ConfirmDialog
                open={!!deletingCategory}
                onOpenChange={(open) => !open && setDeletingCategory(null)}
                title="Delete category"
                description={
                    <>
                        Are you sure you want to delete the{" "}
                        <span className="font-medium text-foreground">{deletingCategory}</span>{" "}
                        category? This action cannot be undone.
                    </>
                }
                confirmLabel="Delete"
                destructive
                pending={isDeletingCategory}
                onConfirm={() => deletingCategory && deleteCategory(deletingCategory)}
            />
        </>
    )
}
