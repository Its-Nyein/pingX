"use client"

import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import LoadingSpinner  from "@/components/loading-spinner"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowRight, BarChart2, Clock, Database, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { DashboardEmptyState } from "./dashboard-empty-state"

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
            <div className="flex flex-1 justify-center items-center h-full w-full">
                <LoadingSpinner/>
            </div>
        )
    }

    if(!categories || categories.length === 0) {
        return <DashboardEmptyState/>
    }

    return (
        <>
            <ul className="max-w-6xl grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {
                    categories.map(category => (
                        <li 
                            key={category.id}
                            className="relative group transition-all duration-200 hover:translate-y-0.5 z-10"
                        >
                            <div className="absolute inset-px z-0 rounded-lg bg-white"/>

                            <div className="pointer-events-none z-0 absolute rounded-lg shadow-sm inset-px transition-all duration-300 group-hover:shadow-md ring-1 ring-black/5"/>

                            <div className="relative z-10 p-6">
                                <div className="flex items-center mb-6 gap-4">
                                    <div>
                                        <h3 className="text-lg/7 font-medium tracking-tight text-gray-950">{category.name}</h3>
                                        <p className="text-sm/6 text-gray-600">{format(category.createdAt, "MM d, yyyy")}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm/6 text-gray-600">
                                        <Clock className="size-4 mr-2 text-brand-500"/>
                                        <span className="font-medium">Last Ping:</span>
                                        <span className="ml-1">
                                            {
                                                category.lastPing ? formatDistanceToNow(category.lastPing) + " ago": "Never"
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm/6 text-gray-600">
                                        <Database className="size-4 mr-2 text-brand-500"/>
                                        <span className="font-medium">Unique Fields:</span>
                                        <span className="ml-1">
                                            { category.uniqueFieldCount || 0 }
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm/6 text-gray-600">
                                        <BarChart2 className="size-4 me-2 text-brand-500"/>
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
                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                        aria-label={`Delete ${category.name}`}
                                        onClick={() => setDeletingCategory(category.name)}
                                    >
                                        <Trash2 className="size-5"/>
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))
                }
            </ul>

            <Modal
                showModal={!!deletingCategory}
                setShowModal={() => setDeletingCategory(null)}
                className="max-w-md p-8"
            >
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg/7 font-medium text-gray-950 tracking-tight">
                            Delete Category
                        </h2>
                        <p className="text-sm/6 text-gray-600">
                            Are you sure you want to delete the <span className="font-bold text-base">{deletingCategory}</span> category?
                            This action cannot be undone.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingCategory(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deletingCategory && deleteCategory(deletingCategory)}
                            disabled={isDeletingCategory}
                        >
                            {isDeletingCategory ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}