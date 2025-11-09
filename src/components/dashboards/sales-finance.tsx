"use client";

import { useSalesFinanceDashboard } from "@/hooks/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import Link from "next/link";

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
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
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

export function SalesFinanceDashboard() {
  const { data, isLoading } = useSalesFinanceDashboard();

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
  const recentInvoices = data?.recentInvoices || [];
  const recentSalesOrders = data?.recentSalesOrders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Sales & Finance Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage financial documents and track revenue
        </p>
      </div>

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value={stats?.totalInvoices || 0}
          subtitle={`$${stats?.totalInvoiceAmount?.toLocaleString() || 0}`}
          icon={Receipt}
          color="success"
        />
        <StatCard
          title="Sales Orders"
          value={stats?.totalSalesOrders || 0}
          subtitle={`$${stats?.totalSalesOrderAmount?.toLocaleString() || 0}`}
          icon={ShoppingCart}
          color="default"
        />
        <StatCard
          title="Purchase Orders"
          value={stats?.totalPurchaseOrders || 0}
          subtitle={`$${stats?.totalPurchaseOrderAmount?.toLocaleString() || 0}`}
          icon={Package}
          color="warning"
        />
        <StatCard
          title="Total Expenses"
          value={stats?.totalExpenses || 0}
          subtitle={`$${stats?.totalExpenseAmount?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="danger"
        />
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats?.totalInvoiceAmount?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Costs</p>
              <p className="text-2xl font-bold text-red-600">
                $
                {(
                  (stats?.totalPurchaseOrderAmount || 0) +
                  (stats?.totalExpenseAmount || 0)
                ).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-bold text-blue-600">
                $
                {(
                  (stats?.totalInvoiceAmount || 0) -
                  (stats?.totalPurchaseOrderAmount || 0) -
                  (stats?.totalExpenseAmount || 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Invoices
              </CardTitle>
              <Link href="/dashboard/projects">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.project?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.invoiceDate
                        ? new Date(invoice.invoiceDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">
                      ${invoice.totalAmount?.toLocaleString() || 0}
                    </p>
                    <Badge>{invoice.status}</Badge>
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No invoices yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Sales Orders
              </CardTitle>
              <Link href="/dashboard/projects">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSalesOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.project?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderDate
                        ? new Date(order.orderDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">
                      ${order.totalAmount?.toLocaleString() || 0}
                    </p>
                    <Badge>{order.status}</Badge>
                  </div>
                </div>
              ))}
              {recentSalesOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No sales orders yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects with Financial Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Projects Overview</CardTitle>
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
                href={`/dashboard/projects/${project.id}/invoice`}
              >
                <div className="flex items-center justify-between border-b pb-3 hover:bg-muted/50 p-2 rounded cursor-pointer transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Invoices</p>
                      <p className="font-semibold">{project._count?.invoices || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">SO</p>
                      <p className="font-semibold">
                        {project._count?.salesOrders || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">PO</p>
                      <p className="font-semibold">
                        {project._count?.purchaseOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No projects available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

