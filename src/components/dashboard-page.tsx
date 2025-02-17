"use client"

import { ReactNode } from "react"
import { Button } from "./ui/button"
import { ArrowLeft } from "lucide-react"
import Heading from "./heading"
import { useRouter } from "next/navigation"

interface DashboardPageProps {
    title: string,
    children?: ReactNode,
    backButton?: boolean,
    cta?: ReactNode
}

const DashboardPage = ({title, children, backButton, cta}: DashboardPageProps) => {

    const router = useRouter();
  return (
    <section className="flex flex-col flex-1 w-full h-full">
        <div className="w-full p-6 sm:p-8 justify-between border-b border-gray-200">
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="flex items-center gap-4">
                    {
                        backButton ? null : (
                            <Button
                                className="w-fit bg-white"
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                            >
                                <ArrowLeft className="size-4"/>
                            </Button>
                        )
                    }

                    <Heading>{title}</Heading>
                </div>
                {
                    cta ? <div className="w-full">{cta}</div> : null
                }
            </div>
        </div>

        <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto">
            {children}
        </div>
    </section>
  )
}

export default DashboardPage