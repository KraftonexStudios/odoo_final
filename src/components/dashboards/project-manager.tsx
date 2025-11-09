"use client";

import { useProjectManagerDashboard } from "@/hooks/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  ListTodo,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import ProjectSheetForm from "@/components/forms/project";

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

export function ProjectManagerDashboard() {
  const { data, isLoading } = useProjectManagerDashboard();

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
  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Manager Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your projects, tasks, and team
          </p>
        </div>
        <ProjectSheetForm
          trigger={
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Project
            </Button>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="My Projects"
          value={stats?.totalProjects || 0}
          icon={FolderKanban}
          color="default"
        />
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Pending Expenses"
          value={stats?.pendingExpenses || 0}
          icon={DollarSign}
          color="warning"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          icon={AlertCircle}
          color="danger"
        />
      </div>

      {/* Task Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Task Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.taskStats?.map((stat: any) => (
                <div
                  key={stat.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        stat.status === "DONE"
                          ? "default"
                          : stat.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {stat.status}
                    </Badge>
                  </div>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/projects">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FolderKanban className="h-4 w-4" />
                View All Projects
              </Button>
            </Link>
            <ProjectSheetForm
              trigger={
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Project
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Projects</CardTitle>
            <Link href="/dashboard/projects">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.slice(0, 5).map((project: any) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}/dashboard`}
              >
                <div className="flex items-center justify-between border-b pb-3 hover:bg-muted/50 p-2 rounded cursor-pointer transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{project.status}</Badge>
                    <div className="text-sm text-muted-foreground">
                      {project.tasks?.length || 0} tasks
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No projects yet</p>
                <p className="text-sm">Create your first project to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

