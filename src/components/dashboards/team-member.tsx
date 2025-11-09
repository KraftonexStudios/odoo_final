"use client";

import { useTeamMemberDashboard } from "@/hooks/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "default",
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: "default" | "success" | "warning" | "danger";
}) => {
  const colorClasses = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export function TeamMemberDashboard() {
  const { data, isLoading } = useTeamMemberDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const tasks = data?.tasks || [];
  const expenses = data?.expenses || [];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          View your tasks, log hours, and submit expenses
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="To Do"
          value={stats?.todoTasks || 0}
          icon={ListTodo}
          color="default"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressTasks || 0}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Completed"
          value={stats?.completedTasks || 0}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdueTasks || 0}
          icon={AlertCircle}
          color="danger"
        />
        <StatCard
          title="Hours This Week"
          value={stats?.hoursThisWeek || 0}
          icon={Clock}
          color="default"
        />
      </div>

      {/* Tasks Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {tasks.slice(0, 10).map((task: any) => (
                <Link
                  key={task.id}
                  href={`/dashboard/projects/${task.projectId}/tasks`}
                >
                  <div className="flex items-start justify-between border-b pb-3 hover:bg-muted/50 p-2 rounded cursor-pointer transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant={getPriorityBadge(task.priority) as any}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.project?.name}
                      </p>
                      {task.dueDate && (
                        <p
                          className={`text-xs ${
                            new Date(task.dueDate) < new Date() &&
                            task.status !== "DONE"
                              ? "text-red-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </Link>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No tasks assigned yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {expenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{expense.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.project?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">
                      ${expense.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant={
                        expense.status === "APPROVED"
                          ? "default"
                          : expense.status === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No expenses yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <Link href="/dashboard/projects">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ListTodo className="h-4 w-4" />
                View All My Tasks
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Calendar className="h-4 w-4" />
              My Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

