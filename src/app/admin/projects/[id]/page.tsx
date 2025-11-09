"use client";

import { use } from "react";
import { useGetProject } from "@/hooks/projects";
import { useTasks } from "@/hooks/tasks";
import { useExpenses } from "@/hooks/expenses";
import { useInvoices } from "@/hooks/invoices";
import { useSalesOrders } from "@/hooks/sales-orders";
import { usePurchaseOrders } from "@/hooks/purchase-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FolderKanban,
  ListTodo,
  DollarSign,
  Receipt,
  ShoppingCart,
  Package,
} from "lucide-react";
import Link from "next/link";
import { TasksTable } from "@/components/project/tables/task-table";
import { ExpensesTable } from "@/components/project/tables/expense-table";
import { InvoicesTable } from "@/components/project/tables/invoice-table";
import { SalesOrdersTable } from "@/components/project/tables/so-table";
import { PurchaseOrdersTable } from "@/components/project/tables/po-table";
import TaskSheetForm from "@/components/forms/task";
import ExpenseSheetForm from "@/components/forms/expense";
import InvoiceSheetForm from "@/components/forms/invoice";
import SalesOrderSheetForm from "@/components/forms/sales-order";
import PurchaseOrderSheetForm from "@/components/forms/purchase-order";

export default function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = use(params);
  const { data: projectData, isLoading: loadingProject } = useGetProject(id);
  const { data: tasksData, isLoading: loadingTasks } = useTasks(id);
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(id);
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoices(id);
  const { data: soData, isLoading: loadingSO } = useSalesOrders(id);
  const { data: poData, isLoading: loadingPO } = usePurchaseOrders(id);

  const project = projectData?.data;
  const tasks = tasksData?.data || [];
  const expenses = expensesData?.data || [];
  const invoices = invoicesData || [];
  const salesOrders = soData?.data || [];
  const purchaseOrders = poData?.data || [];

  if (loadingProject) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/admin/projects">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">{project.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge>{project.status}</Badge>
          <Badge variant="outline">{project.type}</Badge>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold font-mono">
              ${project.budgetAmount?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="so" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales Orders
          </TabsTrigger>
          <TabsTrigger value="po" className="gap-2">
            <Package className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <TaskSheetForm
                projectId={id}
                trigger={<Button size="sm">Add Task</Button>}
              />
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <Skeleton className="h-48" />
              ) : (
                <TasksTable projectId={id} tasks={tasks} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <ExpenseSheetForm
                projectId={id}
                trigger={<Button size="sm">Add Expense</Button>}
              />
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <Skeleton className="h-48" />
              ) : (
                <ExpensesTable projectId={id} expenses={expenses} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <InvoiceSheetForm
                projectId={id}
                trigger={<Button size="sm">Add Invoice</Button>}
              />
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <Skeleton className="h-48" />
              ) : (
                <InvoicesTable projectId={id} invoices={invoices as any} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="so">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Orders</CardTitle>
              <SalesOrderSheetForm
                projectId={id}
                trigger={<Button size="sm">Add Sales Order</Button>}
              />
            </CardHeader>
            <CardContent>
              {loadingSO ? (
                <Skeleton className="h-48" />
              ) : (
                <SalesOrdersTable projectId={id} salesOrders={salesOrders as any} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Orders</CardTitle>
              <PurchaseOrderSheetForm
                projectId={id}
                trigger={<Button size="sm">Add Purchase Order</Button>}
              />
            </CardHeader>
            <CardContent>
              {loadingPO ? (
                <Skeleton className="h-48" />
              ) : (
                <PurchaseOrdersTable
                  projectId={id}
                  items={purchaseOrders}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

