type Task = {
  _id: Key | null | undefined
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: TaskStatus
  startTime: Date
  endTime: Date
  userId: string
}

type TaskStats = {
  totalTasks: number
  completedPercentage: number
  pendingPercentage: number
  averageCompletionTime: number
  pendingTasks: {
    count: number
    totalTimeLapsed: number
    totalTimeToFinish: number
  }
  priorityStats: Array<{
    priority: number
    pendingTasks: number
    timeLapsed: number
    timeToFinish: number
  }>
}