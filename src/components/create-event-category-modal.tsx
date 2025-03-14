"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/modal";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { client } from "@/lib/client";

const EVENT_CATEGORY_SCHEMA = z.object({
    name: z.string().min(1, "Category name is required").regex(/^[a-zA-Z0-9-]+$/, "Category name can only contain letters, numbers, and hyphens")
})

type EventCategoryForm = z.infer<typeof EVENT_CATEGORY_SCHEMA>;

export const CreateEventCategoryModal = ({children}: PropsWithChildren) => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: createEventCategory, isPending} = useMutation({
        mutationFn: async (data: EventCategoryForm) => {
            await client.category.createEventCategory.$post(data)
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ["user-event-categories"]})
            setIsOpen(false)
        }
    })

    const {register, handleSubmit, formState: {errors}, reset} = useForm<EventCategoryForm>({
        resolver: zodResolver(EVENT_CATEGORY_SCHEMA)
    })

    const onSubmit = async (data: EventCategoryForm) => {
        createEventCategory(data, {
            onSettled: () => reset()
        })
    }

    return(
        <>
            <div onClick={() => setIsOpen(true)}>
                {children}
            </div>

            <Modal showModal={isOpen} setShowModal={setIsOpen} className="max-w-xl p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
                            Create Event Category
                        </h2>
                        <p className="text-sm/6 text-gray-600">
                            Create a new category to organize your events
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <Label htmlFor="name" className="mb-2">Name</Label>
                            <Input
                                id="name"
                                autoFocus
                                {...register("name")}
                                placeholder="e.e. category name"
                                className="w-full"
                            />
                            {
                                errors.name ? <p className="text-sm text-red-500 mt-1">{errors.name.message}</p> : null
                            }
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isPending}
                            type="submit"
                        >
                            { isPending ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}