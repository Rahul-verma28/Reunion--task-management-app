import { type NextRequest, NextResponse } from "next/server"
import { getDataFromToken } from "@/lib/getDataFormToken"
import { connectToDB } from "@/lib/mongoDB"
import { Task, type TaskDocument } from "@/lib/models/task"

interface PriorityGroup {
  timeLapsed: number
  balanceTimeLeft: number
  count: number
}

interface PendingTasksSummary {
  count: number
  totalTimeLapsed: number
  totalTimeToFinish: number
}

interface DashboardResponse {
  totalTasks: number
  percentCompleted: number
  percentPending: number
  pendingTasksGroupedByPriority: Record<number, PriorityGroup>
  averageCompletionTime: number
  pendingTasksSummary: PendingTasksSummary
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB()

    const userId = getDataFromToken(req)
    if (typeof userId !== "string" || !userId) {
      return new NextResponse("User not authenticated", { status: 401 })
    }

    const tasks: TaskDocument[] = await Task.find({ user: userId })

    const totalTasks = tasks.length

    const completedTasks = tasks.filter((task) => task.status === "finished").length
    const pendingTasks = totalTasks - completedTasks
    const percentCompleted = (completedTasks / totalTasks) * 100 || 0
    const percentPending = (pendingTasks / totalTasks) * 100 || 0

    const pendingTasksGroupedByPriority = tasks
      .filter((task) => task.status === "pending")
      .reduce<Record<number, PriorityGroup>>((acc, task) => {
        const currentTime = new Date()
        const startTime = new Date(task.startTime)
        const endTime = new Date(task.endTime)

        // Calculate the lapsed time (time passed since the task started)
        const timeLapsed =
          currentTime > startTime ? (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) : 0

        // Calculate the balance estimated time left (time remaining to finish the task)
        const balanceTimeLeft =
          currentTime < endTime ? (endTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60) : 0

        // Group by priority
        if (!acc[task.priority]) {
          acc[task.priority] = { timeLapsed: 0, balanceTimeLeft: 0, count: 0 }
        }

        acc[task.priority].timeLapsed += timeLapsed
        acc[task.priority].balanceTimeLeft += balanceTimeLeft
        acc[task.priority].count++

        return acc
      }, {})

    const pendingTasksSummary = Object.values(pendingTasksGroupedByPriority).reduce<PendingTasksSummary>(
      (acc, group) => {
        acc.count += group.count
        acc.totalTimeLapsed += group.timeLapsed
        acc.totalTimeToFinish += group.balanceTimeLeft
        return acc
      },
      { count: 0, totalTimeLapsed: 0, totalTimeToFinish: 0 },
    )

    // Calculate the overall average completion time for finished tasks
    const completedTasksWithTime = tasks.filter((task) => task.status === "finished")
    const totalCompletionTime = completedTasksWithTime.reduce((acc, task) => {
      const startTime = new Date(task.startTime)
      const endTime = new Date(task.endTime)
      return acc + (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // Convert to hours
    }, 0)

    const averageCompletionTime =
      completedTasksWithTime.length > 0 ? totalCompletionTime / completedTasksWithTime.length : 0

    const response: DashboardResponse = {
      totalTasks,
      percentCompleted,
      percentPending,
      pendingTasksGroupedByPriority,
      averageCompletionTime,
      pendingTasksSummary,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[POST_DASHBOARD]", error instanceof Error ? error.message : String(error))
    return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", { status: 500 })
  }
}

