"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Receipt, FileText, DollarSign, Wallet, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { normalizeRole } from "@/lib/utils";

type LinksPanelProps = {
  projectId: number;
  stats: {
    salesOrders: number;
    purchaseOrders: number;
    invoices: number;
    expenses: number;
  };
};

export const LinksPanel = ({ projectId, stats }: LinksPanelProps) => {
  const { user } = useUser();
  const userRole = normalizeRole(user?.publicMetadata?.role as string | string[]);

  const allLinks = [
    {
      title: "Sales Orders",
      count: stats.salesOrders,
      icon: ShoppingCart,
      href: `/dashboard/projects/${projectId}/so`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
    },
    {
      title: "Purchase Orders",
      count: stats.purchaseOrders,
      icon: Receipt,
      href: `/dashboard/projects/${projectId}/po`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
    },
    {
      title: "Invoices",
      count: stats.invoices,
      icon: FileText,
      href: `/dashboard/projects/${projectId}/invoice`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
    },
    {
      title: "Expenses",
      count: stats.expenses,
      icon: Wallet,
      href: `/dashboard/projects/${projectId}/expenses`,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES_FINANCE"],
    },
  ];

  const links = allLinks.filter((link) => !link.roles || link.roles.includes(userRole));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.bgColor}`}>
                      <Icon className={`h-5 w-5 ${link.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {link.title}
                      </p>
                      <p className="text-2xl font-bold">{link.count}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

