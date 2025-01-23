"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Navbar from "@/components/navbar";

interface TaskStats {
  totalTasks: number;
  percentCompleted: number;
  percentPending: number;
  averageCompletionTime: number;
  pendingTasksSummary: {
    count: number;
    totalTimeLapsed: number;
    totalTimeToFinish: number;
  };
  pendingTasksGroupedByPriority: {
    [key: number]: {
      timeLapsed: number;
      balanceTimeLeft: number;
      count: number;
    };
  };
}

async function fetchTaskStats(): Promise<TaskStats> {
  const response = await fetch("/api/tasksSummeryDashbord", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch task statistics");
  }
  return response.json();
}

function StatItem({
  label,
  value,
  unit = "",
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 bg-secondary rounded-lg">
      <div className="text-3xl font-bold text-primary mb-2">
        {value}
        {unit}
      </div>
      <p className="text-sm text-muted-foreground text-center">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 p-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getStats() {
      try {
        const data = await fetchTaskStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching task statistics:", error);
        setError("Failed to load dashboard data. Please try again later.");
      }
    }

    getStats();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // if (!stats) {
  //   return <LoadingSkeleton />;
  // }

  const priorityStats = stats?Object.entries(stats.pendingTasksGroupedByPriority).map(
    ([priority, data]) => ({
      priority: Number(priority),
      ...data,
    })
  ):[];

  console.log(stats);

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        {!stats ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatItem label="Total tasks" value={stats.totalTasks} />
              <StatItem
                label="Tasks completed"
                value={stats.percentCompleted.toFixed(1)}
                unit="%"
              />
              <StatItem
                label="Tasks pending"
                value={stats.percentPending.toFixed(1)}
                unit="%"
              />
              <StatItem
                label="Average time per completed task"
                value={stats.averageCompletionTime.toFixed(2)}
                unit=" hrs"
              />
            </div>

            <div className="bg-card rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                Pending task summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatItem
                  label="Pending tasks"
                  value={stats.pendingTasksSummary.count}
                />
                <StatItem
                  label="Total time lapesd"
                  value={stats.pendingTasksSummary.totalTimeLapsed.toFixed(1)}
                  unit=" hrs"
                />
                <StatItem
                  label="Total time to finish"
                  value={stats.pendingTasksSummary.totalTimeToFinish.toFixed(2)}
                  unit=" hrs"
                />
              </div>
              <div className="overflow-x-auto w-full lg:w-[75%] border rounded-lg mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task priority</TableHead>
                      <TableHead>Pending tasks</TableHead>
                      <TableHead>Time lapsed (hrs)</TableHead>
                      <TableHead>Time to finish (hrs)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priorityStats.map((stat) => (
                      <TableRow key={stat.priority}>
                        <TableCell>{stat.priority}</TableCell>
                        <TableCell>{stat.count}</TableCell>
                        <TableCell>{stat.timeLapsed.toFixed(2)}</TableCell>
                        <TableCell>{stat.balanceTimeLeft.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
