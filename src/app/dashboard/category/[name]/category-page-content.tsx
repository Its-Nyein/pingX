"use client"

import type { Event, EventCategory, Status } from "@/db"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { EmptyCategoryState } from "./empty-category-state"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { client } from "@/lib/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, BarChart, CheckCircle2, CircleDashed, RotateCcw, Search as SearchIcon, X, XCircle } from "lucide-react"
import { isAfter, isToday, startOfMonth, startOfWeek } from "date-fns"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterToolbar } from "@/components/shell/filter-toolbar"
import { MetricPanel } from "@/components/shell/metric-panel"
import { StatusBadge } from "@/components/shell/status-badge"
import { SendTestEventButton } from "@/components/shell/send-test-event-button"
import { EventChart } from "@/components/shell/event-chart"
import { FacetedFilter } from "@/components/shell/faceted-filter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_OPTIONS = [
  { label: "Delivered", value: "DELIVERED", icon: CheckCircle2 },
  { label: "Failed", value: "FAILED", icon: XCircle },
  { label: "Pending", value: "PENDING", icon: CircleDashed },
]

const RESERVED_COLUMN_IDS = new Set([
  "category",
  "createdAt",
  "deliveryStatus",
  "actions",
])

const RANGE_LABEL = {
  today: "today",
  week: "this week",
  month: "this month",
} as const

interface CategoryPageContentProps {
  hasEvents: boolean
  hasDiscordId: boolean
  category: EventCategory
}

export const CategoryPageContent = ({
  hasEvents: intitialHasEvents,
  hasDiscordId,
  category,
}: CategoryPageContentProps) => {
  const searchParams = useSearchParams()

  const queryClient = useQueryClient()

  const refreshCategory = () => {
    queryClient.invalidateQueries({ queryKey: ["events", category.name] })
    queryClient.invalidateQueries({ queryKey: ["event-series", category.name] })
    queryClient.invalidateQueries({
      queryKey: ["category", category.name, "hasEvents"],
    })
  }

  const [activeTab, setActiveTab] = useState<"today" | "week" | "month">(
    "today"
  )

  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "30", 10)

  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: limit,
  })

  const { data: pollingData } = useQuery({
    queryKey: ["category", category.name, "hasEvents"],
    queryFn: async () => {
      const res = await client.category.pollCategory.$get({
        name: category.name,
      })
      return await res.json()
    },
    initialData: { hasEvents: intitialHasEvents },
    refetchInterval: (query) => (query.state.data?.hasEvents ? false : 1000),
  })

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statuses, setStatuses] = useState<Status[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: seriesData } = useQuery({
    queryKey: ["event-series", category.name, activeTab],
    queryFn: async () => {
      const res = await client.category.getEventSeries.$get({
        name: category.name,
        timeRange: activeTab,
      })
      return await res.json()
    },
    enabled: pollingData.hasEvents,
  })

  const { data, isFetching, refetch } = useQuery({
    queryKey: [
      "events",
      category.name,
      pagination.pageIndex,
      pagination.pageSize,
      activeTab,
      debouncedSearch,
      statuses,
    ],
    queryFn: async () => {
      const res = await client.category.getEventsByCategoryName.$get({
        name: category.name,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        timeRange: activeTab,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statuses.length ? { status: statuses } : {}),
      })

      return await res.json()
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled: pollingData.hasEvents,
  })

  const numericFieldSums = useMemo(() => {
    if (!data?.events || data.events.length === 0) return {}

    const sums: Record<
      string,
      {
        total: number
        today: number
        thisweek: number
        thismonth: number
      }
    > = {}

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const monthStart = startOfMonth(now)

    data.events.forEach((event) => {
      const eventDate = event.createdAt
      Object.entries(event.data as object).forEach(([key, value]) => {
        if (typeof value === "number") {
          if (!sums[key]) {
            sums[key] = { total: 0, today: 0, thisweek: 0, thismonth: 0 }
          }
          sums[key].total += value

          if (
            isAfter(eventDate, weekStart) ||
            eventDate.getTime() === weekStart.getTime()
          ) {
            sums[key].thisweek += value
          }

          if (
            isAfter(eventDate, monthStart) ||
            eventDate.getTime() === monthStart.getTime()
          ) {
            sums[key].thismonth += value
          }

          if (isToday(eventDate)) {
            sums[key].today += value
          }
        }
      })
    })

    return sums
  }, [data?.events])

  const NumericFieldSums = () => {
    if (Object.keys(numericFieldSums).length === 0) return null

    return Object.entries(numericFieldSums).map(([key, sums]) => {
      const relevantSums =
        activeTab === "today"
          ? sums.today
          : activeTab === "week"
          ? sums.thisweek
          : sums.thismonth

      return (
        <MetricPanel
          key={key}
          label={key.charAt(0).toUpperCase() + key.slice(1)}
          value={relevantSums.toFixed(2)}
          hint={RANGE_LABEL[activeTab]}
        />
      )
    })
  }

  const [resendingId, setResendingId] = useState<string | null>(null)

  const { mutate: resend } = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      setResendingId(eventId)
      await client.category.resendEvent.$post({ eventId })
    },
    onSuccess: () => {
      toast.success("Event resent", {
        description: "It has been delivered to your Discord DMs.",
      })
      refetch()
    },
    onError: (error) => {
      toast.error("Couldn't resend the event", { description: error.message })
    },
    onSettled: () => setResendingId(null),
  })

  const columns: ColumnDef<Event>[] = useMemo(
    () => [
      {
        accessorKey: "category",
        header: "Category",
        cell: () => <span>{category.name || "Uncategorized"}</span>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          return new Date(row.getValue("createdAt")).toLocaleString()
        },
      },
      ...(data?.events[0]
        ? Object.keys(data.events[0].data as object)
            .filter((field) => !RESERVED_COLUMN_IDS.has(field))
            .map((field) => ({
            accessorFn: (row: Event) =>
              (row.data as Record<string, any>)[field],
            header: field,
            cell: ({ row }: { row: Row<Event> }) =>
              (row.original.data as Record<string, any>)[field] || "-",
          }))
        : []),
      {
        accessorKey: "deliveryStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue<Status>("deliveryStatus")
          const lastError = row.original.lastError

          return (
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {status === "FAILED" && lastError ? (
                <span
                  title={lastError}
                  className="max-w-56 truncate text-xs text-muted-foreground"
                >
                  {lastError}
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.getValue<Status>("deliveryStatus") === "DELIVERED" ? null : (
            <Button
              variant="ghost"
              size="sm"
              disabled={resendingId === row.original.id}
              onClick={() => resend({ eventId: row.original.id })}
            >
              <RotateCcw className="size-3.5" />
              {resendingId === row.original.id ? "Resending..." : "Resend"}
            </Button>
          ),
      },
    ],
    [category.name, data?.events, resend, resendingId]
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: data?.events || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((data?.eventsCount || 0) / pagination.pageSize),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  const router = useRouter()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("page", (pagination.pageIndex + 1).toString())
    searchParams.set("limit", pagination.pageSize.toString())
    router.push(`?${searchParams.toString()}`, { scroll: false })
  }, [pagination, router])

  if (!pollingData.hasEvents) {
    return (
      <EmptyCategoryState
        categoryName={category.name}
        hasDiscordId={hasDiscordId}
        onSent={refreshCategory}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "today" | "week" | "month")
        }
      >
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This week</TabsTrigger>
          <TabsTrigger value="month">This month</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricPanel
              label="Total events"
              value={data ? data.eventsCount : "-"}
              hint={RANGE_LABEL[activeTab]}
              icon={BarChart}
            />

            <NumericFieldSums />
          </div>

          <div className="space-y-3">
            <EventChart
              series={seriesData?.series ?? []}
              bucket={(seriesData?.bucket as "hour" | "day") ?? "day"}
            />

            <FilterToolbar
              trailing={
                <span>
                  {data?.eventsCount ?? 0} event
                  {data?.eventsCount === 1 ? "" : "s"} {RANGE_LABEL[activeTab]}
                </span>
              }
            >
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPagination((p) => ({ ...p, pageIndex: 0 }))
                  }}
                  placeholder="Search category, email, any field"
                  aria-label="Search events"
                  className="h-8 w-56 pl-8 lg:w-72"
                />
              </div>

              <FacetedFilter
                title="Status"
                options={STATUS_OPTIONS}
                selected={statuses}
                counts={data?.statusCounts}
                onChange={(values) => {
                  setStatuses(values as Status[])
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
              />

              {search || statuses.length ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setSearch("")
                    setStatuses([])
                    setPagination((p) => ({ ...p, pageIndex: 0 }))
                  }}
                >
                  Reset
                  <X className="ml-1 size-4" />
                </Button>
              ) : null}

              <SendTestEventButton
                categoryName={category.name}
                hasDiscordId={hasDiscordId}
                size="sm"
                onSent={refreshCategory}
              />
            </FilterToolbar>

            <div className="overflow-hidden rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {isFetching ? (
                    [...Array(5)].map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 w-full animate-pulse rounded bg-recessed" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No events in this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {pagination.pageIndex + 1} of{" "}
                {Math.max(1, table.getPageCount())}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage() || isFetching}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage() || isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
