"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  FolderKanban,
  Users,
  Timer,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { onFetchProjects } from "@/actions/project.action";
import { onGetAllTasks } from "@/actions/task.action";

export default function AnalyticsPage() {
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await onFetchProjects();
      return result.status === 200 ? result.data : [];
    },
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ["all-tasks-analytics"],
    queryFn: async () => {
      const result = await onGetAllTasks();
      return result.status === 200 ? result.data : [];
    },
  });

  const projects = projectsData || [];
  const tasks = tasksData || [];

  // Calculate KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter((p: any) => p.status === "COMPLETED").length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
  const blockedTasks = tasks.filter((t: any) => t.status === "BLOCKED").length;

  const totalHours = tasks.reduce((sum: number, t: any) => sum + (t.actualHours || 0), 0);
  const estimatedHours = tasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);

  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budgetAmount || 0), 0);
  const totalRevenue = projects.reduce((sum: number, p: any) => sum + (p.estimatedRevenue || 0), 0);
  const totalCost = projects.reduce((sum: number, p: any) => sum + (p.estimatedCost || 0), 0);

  const kpis = [
    {
      title: "Total Projects",
      value: totalProjects,
      subtitle: `${activeProjects} active, ${completedProjects} completed`,
      icon: FolderKanban,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Tasks Completed",
      value: completedTasks,
      subtitle: `${inProgressTasks} in progress, ${blockedTasks} blocked`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Hours Logged",
      value: `${totalHours.toFixed(1)}h`,
      subtitle: `Est: ${estimatedHours.toFixed(1)}h`,
      icon: Timer,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Revenue vs Cost",
      value: `$${(totalRevenue - totalCost).toFixed(0)}`,
      subtitle: totalRevenue > totalCost ? "Profitable" : "Over budget",
      icon: DollarSign,
      color: totalRevenue > totalCost ? "text-emerald-600" : "text-red-600",
      bgColor: totalRevenue > totalCost ? "bg-emerald-100" : "bg-red-100",
    },
  ];

  const tasksByStatus = [
    { status: "NEW", count: tasks.filter((t: any) => t.status === "NEW").length, color: "bg-gray-500" },
    { status: "IN_PROGRESS", count: inProgressTasks, color: "bg-blue-500" },
    { status: "BLOCKED", count: blockedTasks, color: "bg-red-500" },
    { status: "DONE", count: completedTasks, color: "bg-green-500" },
  ];

  const projectsByStatus = [
    { status: "PLANNED", count: projects.filter((p: any) => p.status === "PLANNED").length },
    { status: "IN_PROGRESS", count: activeProjects },
    { status: "ON_HOLD", count: projects.filter((p: any) => p.status === "ON_HOLD").length },
    { status: "COMPLETED", count: completedProjects },
    { status: "CANCELLED", count: projects.filter((p: any) => p.status === "CANCELLED").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Key performance indicators and insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasksByStatus.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.status.replace("_", " ")}</span>
                  <span className="font-medium">{item.count} tasks</span>
                </div>
                <Progress
                  value={totalTasks > 0 ? (item.count / totalTasks) * 100 : 0}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsByStatus.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.status.replace("_", " ")}</span>
                  <span className="font-medium">{item.count} projects</span>
                </div>
                <Progress
                  value={totalProjects > 0 ? (item.count / totalProjects) * 100 : 0}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Hours Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Hours Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Logged Hours</span>
                <span className="font-medium">{totalHours.toFixed(1)}h</span>
              </div>
              <Progress
                value={estimatedHours > 0 ? (totalHours / estimatedHours) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {estimatedHours > 0
                  ? `${((totalHours / estimatedHours) * 100).toFixed(1)}% of estimated hours`
                  : "No estimates set"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Budget</span>
                <span className="font-mono font-bold">${totalBudget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expected Revenue</span>
                <span className="font-mono text-green-600">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expected Cost</span>
                <span className="font-mono text-red-600">${totalCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-semibold">Expected Profit</span>
                <span className={`font-mono font-bold ${totalRevenue - totalCost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totalRevenue - totalCost).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.slice(0, 10).map((project: any) => {
              const progress = project.taskCount > 0
                ? ((project.completedTaskCount || 0) / project.taskCount) * 100
                : 0;

              return (
                <div key={project.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.toFixed(0)}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
