import { onFetchDashboardStats } from "@/actions/admin.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FolderKanban,
  ListTodo,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { unstable_noStore as noStore } from "next/cache";

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "default",
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  trendLabel?: string;
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
        {trend && trendLabel && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-600 font-medium">{trend}</span>{" "}
            {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default async function AdminDashboard() {
  noStore(); // Prevent static generation

  const result = await onFetchDashboardStats();
  const stats = result.status === 200 ? result.data : null;

  console.log("[ADMIN_DASHBOARD] Result:", result.status);

  if (!stats) {
    return (
      <div className="p-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-red-600">
            Error Loading Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {result.message || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all system activities and metrics
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats?.overview.totalProjects || 0}
          icon={FolderKanban}
          color="default"
        />
        <StatCard
          title="Active Projects"
          value={stats?.overview.activeProjects || 0}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.overview.totalTasks || 0}
          icon={ListTodo}
          color="default"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overview.overdueTasks || 0}
          icon={AlertCircle}
          color="danger"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completed Projects"
          value={stats?.overview.completedProjects || 0}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Completed Tasks"
          value={stats?.overview.completedTasks || 0}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Total Users"
          value={stats?.overview.totalUsers || 0}
          icon={Users}
          color="default"
        />
        <StatCard
          title="Total Expenses"
          value={stats?.overview.totalExpenses || 0}
          icon={DollarSign}
          color="default"
        />
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">
                ${stats?.financials.totalExpenseAmount?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tax</p>
              <p className="text-2xl font-bold">
                ${stats?.financials.totalExpenseTax?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.projectsByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tasks by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.tasksByPriority.map((item) => (
                <div
                  key={item.priority}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.priority === "URGENT"
                          ? "destructive"
                          : item.priority === "HIGH"
                          ? "default"
                          : "outline"
                      }
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Project Updates
          </CardTitle>
          <Link href="/admin/projects">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentActivities?.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.updatedAt).toLocaleDateString()} at{" "}
                    {new Date(activity.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="outline">{activity.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
