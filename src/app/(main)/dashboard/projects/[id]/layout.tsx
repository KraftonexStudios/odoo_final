"use client";
import React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Receipt,
  FileText,
  ShoppingCart,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { useGetProject } from "@/hooks/projects";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { normalizeRole } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
};

const ProjectDetailLayout = ({ children }: Props) => {
  const params = useParams();
  const pathname = usePathname();
  const projectId = Number(params.id);

  const { data: projectData, isLoading } = useGetProject(projectId);
  const project = projectData?.data ?? { name: "Loading...", code: "", status: "PLANNED" };
  const { user } = useUser();
  const userRole = normalizeRole(user?.publicMetadata?.role as string | string[]);

  // Filter tabs based on role - TEAM_MEMBER only sees Dashboard, Tasks, and Expenses
  const allTabs = [
    {
      title: "Dashboard",
      href: `/dashboard/projects/${projectId}/dashboard`,
      icon: LayoutDashboard,
      roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES_FINANCE"],
    },
    {
      title: "Tasks",
      href: `/dashboard/projects/${projectId}/tasks`,
      icon: ListTodo,
      roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES_FINANCE"],
    },
    {
      title: "Sales Orders",
      href: `/dashboard/projects/${projectId}/so`,
      icon: ShoppingCart,
      roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
    },
    {
      title: "Purchase Orders",
      href: `/dashboard/projects/${projectId}/po`,
      icon: Receipt,
      roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
    },
    {
      title: "Invoices",
      href: `/dashboard/projects/${projectId}/invoice`,
      icon: FileText,
      roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
    },
    {
      title: "Expenses",
      href: `/dashboard/projects/${projectId}/expenses`,
      icon: Wallet,
      roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES_FINANCE"],
    },
  ];

  const tabs = allTabs.filter((tab) => !tab.roles || tab.roles.includes(userRole));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className="text-sm">
                {project.status?.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{project.code}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <nav className="flex gap-2 overflow-x-auto pb-0" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 rounded-b-none border-b-2",
                    isActive ? "border-primary" : "border-transparent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

export default ProjectDetailLayout;

