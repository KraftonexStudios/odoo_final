import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  BarChart3,
  ShoppingCart,
  FileText,
  Receipt,
  Wallet,
  Users,
  Settings,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[]; // Which roles can see this
};

export const mainNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"], // Only admin sees dashboard
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES_FINANCE"], // All roles see projects
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: ListTodo,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"], // Team members need to see tasks
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: CheckCircle2,
    roles: ["ADMIN", "PROJECT_MANAGER"], // Only admin and PM see approvals
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["ADMIN", "PROJECT_MANAGER"], // Admin and PM see analytics
  },
  {
    title: "Settings",
    href: "/settings/partners",
    icon: Settings,
    roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"], // Admin, PM, and Sales/Finance see settings
  },
  {
    title: "Expenses",
    href: "/dashboard/expenses",
    icon: Wallet,
    roles: ["TEAM_MEMBER"], // Team members can create expenses
  },
  {
    title: "Timesheets",
    href: "/dashboard/timesheets",
    icon: Clock,
    roles: ["TEAM_MEMBER"], // Team members can log timesheets
  },
];

export const settingsNavigation: NavItem[] = [
  {
    title: "Sales Orders",
    href: "/dashboard/sales-orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
  },
  {
    title: "Purchase Orders",
    href: "/dashboard/purchase-orders",
    icon: Receipt,
    roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
  },
  {
    title: "Customer Invoices",
    href: "/dashboard/invoices",
    icon: FileText,
    roles: ["ADMIN", "PROJECT_MANAGER", "SALES_FINANCE"],
  },
  {
    title: "Expenses",
    href: "/dashboard/expenses",
    icon: Wallet,
  },
  {
    title: "Partners",
    href: "/dashboard/partners",
    icon: Users,
    roles: ["ADMIN", "SALES_FINANCE"],
  },
];

export const adminNavigation: NavItem[] = [
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "System Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

