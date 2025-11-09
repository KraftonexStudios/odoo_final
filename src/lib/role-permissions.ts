// Role-based permissions system

export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "SALES_FINANCE";

export interface RolePermissions {
  // Project permissions
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canViewAllProjects: boolean;
  canAssignProjectManager: boolean;
  
  // Task permissions
  canCreateTask: boolean;
  canEditAnyTask: boolean;
  canEditOwnTask: boolean;
  canDeleteTask: boolean;
  canAssignTask: boolean;
  canViewAllTasks: boolean;
  canLogHours: boolean;
  
  // Expense permissions
  canSubmitExpense: boolean;
  canApproveExpense: boolean;
  canViewAllExpenses: boolean;
  
  // Financial documents permissions
  canCreateInvoice: boolean;
  canCreateSalesOrder: boolean;
  canCreatePurchaseOrder: boolean;
  canManageFinancials: boolean;
  
  // User management
  canManageUsers: boolean;
  canViewReports: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    canViewAllProjects: true,
    canAssignProjectManager: true,
    canCreateTask: true,
    canEditAnyTask: true,
    canEditOwnTask: true,
    canDeleteTask: true,
    canAssignTask: true,
    canViewAllTasks: true,
    canLogHours: true,
    canSubmitExpense: true,
    canApproveExpense: true,
    canViewAllExpenses: true,
    canCreateInvoice: true,
    canCreateSalesOrder: true,
    canCreatePurchaseOrder: true,
    canManageFinancials: true,
    canManageUsers: true,
    canViewReports: true,
  },
  PROJECT_MANAGER: {
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: false,
    canViewAllProjects: false, // Only own projects
    canAssignProjectManager: false,
    canCreateTask: true,
    canEditAnyTask: true,
    canEditOwnTask: true,
    canDeleteTask: true,
    canAssignTask: true,
    canViewAllTasks: false, // Only project tasks
    canLogHours: true,
    canSubmitExpense: true,
    canApproveExpense: true,
    canViewAllExpenses: false, // Only project expenses
    canCreateInvoice: true,
    canCreateSalesOrder: false,
    canCreatePurchaseOrder: false,
    canManageFinancials: false,
    canManageUsers: false,
    canViewReports: true,
  },
  TEAM_MEMBER: {
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canViewAllProjects: false,
    canAssignProjectManager: false,
    canCreateTask: false,
    canEditAnyTask: false,
    canEditOwnTask: true,
    canDeleteTask: false,
    canAssignTask: false,
    canViewAllTasks: false, // Only assigned tasks
    canLogHours: true,
    canSubmitExpense: true,
    canApproveExpense: false,
    canViewAllExpenses: false,
    canCreateInvoice: false,
    canCreateSalesOrder: false,
    canCreatePurchaseOrder: false,
    canManageFinancials: false,
    canManageUsers: false,
    canViewReports: false,
  },
  SALES_FINANCE: {
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canViewAllProjects: true,
    canAssignProjectManager: false,
    canCreateTask: false,
    canEditAnyTask: false,
    canEditOwnTask: false,
    canDeleteTask: false,
    canAssignTask: false,
    canViewAllTasks: false,
    canLogHours: false,
    canSubmitExpense: true,
    canApproveExpense: false,
    canViewAllExpenses: true,
    canCreateInvoice: true,
    canCreateSalesOrder: true,
    canCreatePurchaseOrder: true,
    canManageFinancials: true,
    canManageUsers: false,
    canViewReports: true,
  },
};

export function getRolePermissions(role?: string): RolePermissions {
  const userRole = (role as UserRole) || "TEAM_MEMBER";
  return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM_MEMBER;
}

export function hasPermission(role: string | undefined, permission: keyof RolePermissions): boolean {
  const permissions = getRolePermissions(role);
  return permissions[permission];
}

