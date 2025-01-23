"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { TaskFormDialog } from "@/components/task-dialog"
import { TasksTableSkeleton } from "@/components/tasks-table-skeleton"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/navbar"

type SortField = "startTime" | "endTime"
type SortOrder = "asc" | "desc"

interface SortState {
  field: SortField | null
  order: SortOrder
}

interface Task {
  _id: string
  title: string
  priority: number
  status: string
  startTime: string
  endTime: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [priority, setPriority] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [sort, setSort] = useState<SortState>({ field: null, order: "asc" })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  async function fetchTasks(params: Record<string, string | number>): Promise<{ tasks: Task[]; total: number }> {
    try {
      const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>)
      ).toString()
      const response = await fetch(`/api/tasks?${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(String(error))
      }
      console.error("Error fetching tasks:", error)
      throw error
    }
  }

  async function deleteTasks(ids: string[]): Promise<void> {
    try {
      console.log("Sending DELETE request for tasks:", ids)

      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server error:", errorData)
        throw new Error(errorData.message || `Failed to delete tasks: ${response.statusText}`)
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: data.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error deleting tasks:", error.message)
      } else {
        if (error instanceof Error) {
          console.error("Error deleting tasks:", error.message)
        } else {
          console.error("Error deleting tasks:", error)
        }
      }
      toast({
        title: "Error",
        description: (error instanceof Error ? error.message : "Failed to delete tasks. Please try again."),
        variant: "destructive",
      })
      throw error
    }
  }

  const refreshTasks = async () => {
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit,
      }
      if (priority !== "all") params.priority = priority
      if (status !== "all") params.status = status
      if (sort.field) {
        params.sortField = sort.field
        params.sortOrder = sort.order
      }

      const { tasks: updatedTasks, total: updatedTotal } = await fetchTasks(params)
      setTasks(updatedTasks)
      setTotal(updatedTotal)
    } catch (error) {
      console.error("Error refreshing tasks:", error)
      toast({
        title: "Error",
        description: "Failed to refresh tasks. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    refreshTasks()
    setLoading(false);
  }, [currentPage, limit, priority, status, sort])

  const totalPages = Math.ceil(total / limit)

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(tasks.map((task) => task._id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return newSet
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedTasks.size === 0) return

    try {
      await deleteTasks(Array.from(selectedTasks))
      await refreshTasks()
      setSelectedTasks(new Set())
    } catch (error) {
      console.error("Error deleting tasks:", error)
    }
  }



  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Task list</h1>
          <div className="flex items-center gap-4">
            <Select value={priority} onValueChange={(value) => setPriority(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {[1, 2, 3, 4, 5].map((priority) => (
                  <SelectItem key={priority} value={priority.toString()}>
                    Priority {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TaskFormDialog
            onSubmit={async (values) => {
              try {
                const response = await fetch("/api/tasks", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    ...values,
                    status: values.status ? "finished" : "pending",
                  }),
                })

                if (!response.ok) {
                  throw new Error(await response.text())
                }

                toast({
                  title: "Success",
                  description: "Task added successfully.",
                })

                await refreshTasks()
              } catch (error) {
                console.error("Failed to add task:", (error as Error).message)
                toast({
                  title: "Error",
                  description: (error instanceof Error ? error.message : "Failed to add task. Please try again."),
                  variant: "destructive",
                })
              }
            }}
            triggerButton={<Button>Add task</Button>}
          />
          <Button variant="destructive" disabled={selectedTasks.size === 0} onClick={handleDeleteSelected}>
            Delete selected
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <TasksTableSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedTasks.size === tasks.length && tasks.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort("startTime")}
                      >
                        Start Time
                        {sort.field === "startTime" && (sort.order === "asc" ? " ↑" : " ↓")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort("endTime")}
                      >
                        End Time
                        {sort.field === "endTime" && (sort.order === "asc" ? " ↑" : " ↓")}
                      </Button>
                    </TableHead>
                    <TableHead>Total time to finish (hrs)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length > 0 ? (
                    tasks.map((task) => {
                      const totalTime =
                        (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
                      return (
                        <TableRow key={task._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTasks.has(task._id)}
                              onCheckedChange={(checked) => handleSelectTask(task._id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>{task._id}</TableCell>
                          <TableCell>{task.title.charAt(0).toUpperCase() + task.title.slice(1)}</TableCell>
                          <TableCell>{task.priority}</TableCell>
                          <TableCell>
                            <span
                              className={`capitalize ${
                                task.status === "finished" ? "text-green-600" : "text-yellow-600"
                              }`}
                            >
                              {task.status}
                            </span>
                          </TableCell>
                          <TableCell>{format(new Date(task.startTime), "PPp")}</TableCell>
                          <TableCell>{format(new Date(task.endTime), "PPp")}</TableCell>
                          <TableCell>{totalTime.toFixed(1)}</TableCell>
                          <TableCell className="text-right">
                            <TaskFormDialog
                              task={{
                                _id: task._id,
                                title: task.title,
                                priority: task.priority,
                                status: task.status === "finished",
                                startTime: new Date(task.startTime).toISOString().slice(0, 16),
                                endTime: new Date(task.endTime).toISOString().slice(0, 16),
                              }}
                              onSubmit={async (values) => {
                                try {
                                  const response = await fetch(`/api/tasks`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      id: task._id,
                                      ...values,
                                      status: values.status ? "finished" : "pending",
                                    }),
                                  })

                                  if (!response.ok) {
                                    throw new Error(await response.text())
                                  }

                                  toast({
                                    title: "Success",
                                    description: "Task updated successfully.",
                                  })

                                  await refreshTasks()
                                } catch (error) {
                                  if (error instanceof Error) {
                                    console.error("Failed to update task:", error.message)
                                  } else {
                                    console.error("Failed to update task:", error)
                                  }
                                  toast({
                                    title: "Error",
                                    description: (error instanceof Error ? error.message : "Failed to update task. Please try again."),
                                    variant: "destructive",
                                  })
                                }
                              }}
                              triggerButton={
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNumber = i + 1
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink onClick={() => setCurrentPage(pageNumber)} isActive={currentPage === pageNumber}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            {totalPages > 5 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={currentPage === totalPages}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  )
}

