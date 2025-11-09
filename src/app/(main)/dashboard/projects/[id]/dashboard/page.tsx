"use client";
import React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  ListTodo,
  Clock,
  ShoppingCart,
  Receipt,
  FileText,
  Wallet,
} from "lucide-react";
import { useGetProject } from "@/hooks/projects";
import { useTasks } from "@/hooks/tasks";
import { useInvoices } from "@/hooks/invoices";
import { useSalesOrders } from "@/hooks/sales-orders";
import { usePurchaseOrders } from "@/hooks/purchase-orders";
import { useExpenses } from "@/hooks/expenses";
import { Loader2 } from "lucide-react";
import { LinksPanel } from "@/components/project/links-panel";
import { MilestonesPanel } from "@/components/project/milestones-panel";

const ProjectDashboardPage = () => {
  const params = useParams();
  const projectId = Number(params.id);

  const { data: projectData, isLoading: loadingProject } = useGetProject(projectId);
  const { data: tasksData } = useTasks(projectId);
  const { data: invoicesData } = useInvoices(projectId);
  const { data: soData } = useSalesOrders(projectId);
  const { data: poData } = usePurchaseOrders(projectId);
  const { data: expensesData } = useExpenses(projectId);

  const project = projectData?.data;
  const tasks = tasksData?.data ?? [];
  const invoices = invoicesData ?? [];
  const salesOrders = soData?.data ?? [];
  const purchaseOrders = poData?.data ?? [];
  const expenses = expensesData?.data ?? [];

  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCost = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0) +
    expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
  const profit = totalRevenue - totalCost;

  if (loadingProject) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      subtitle: `${invoices.length} invoices`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Cost",
      value: `$${totalCost.toFixed(2)}`,
      subtitle: `${purchaseOrders.length} POs, ${expenses.length} expenses`,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Profit",
      value: `$${profit.toFixed(2)}`,
      subtitle: profit >= 0 ? "On track" : "Over budget",
      icon: TrendingUp,
      color: profit >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: profit >= 0 ? "bg-emerald-100" : "bg-red-100",
    },
    {
      title: "Tasks",
      value: `${completedTasks}/${tasks.length}`,
      subtitle: tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}% complete` : "No tasks",
      icon: ListTodo,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const metrics = [
    {
      title: "Sales Orders",
      value: salesOrders.length,
      total: salesOrders.reduce((sum, so) => sum + (so.totalAmount || 0), 0),
      icon: ShoppingCart,
      href: `/dashboard/projects/${projectId}/so`,
    },
    {
      title: "Purchase Orders",
      value: purchaseOrders.length,
      total: purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0),
      icon: Receipt,
      href: `/dashboard/projects/${projectId}/po`,
    },
    {
      title: "Invoices",
      value: invoices.length,
      total: totalRevenue,
      icon: FileText,
      href: `/dashboard/projects/${projectId}/invoice`,
    },
    {
      title: "Expenses",
      value: expenses.length,
      total: expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0),
      icon: Wallet,
      href: `/dashboard/projects/${projectId}/expenses`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Links Panel */}
      <LinksPanel
        projectId={projectId}
        stats={{
          salesOrders: salesOrders.length,
          purchaseOrders: purchaseOrders.length,
          invoices: invoices.length,
          expenses: expenses.length,
        }}
      />

      {/* Milestones */}
      <MilestonesPanel projectId={projectId} />

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

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion</span>
              <span className="font-medium">{project?.progressPercentage ?? 0}%</span>
            </div>
            <Progress value={project?.progressPercentage ?? 0} />
          </div>
          {project?.budgetAmount && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Usage</span>
                <span className="font-medium">
                  ${totalCost.toFixed(2)} / ${Number(project.budgetAmount).toFixed(2)}
                </span>
              </div>
              <Progress
                value={Math.min((totalCost / Number(project.budgetAmount)) * 100, 100)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: ${metric.total.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectDashboardPage;

