import { useUser } from "@clerk/nextjs";
import { getRolePermissions, hasPermission, type RolePermissions } from "@/lib/role-permissions";
import { normalizeRole } from "@/lib/utils";

export function useRole() {
  const { user, isLoaded } = useUser();
  const role = normalizeRole(user?.publicMetadata?.role as string | string[] | undefined);
  
  return {
    role,
    isLoaded,
    isAdmin: role === "ADMIN",
    isProjectManager: role === "PROJECT_MANAGER",
    isTeamMember: role === "TEAM_MEMBER",
    isSalesFinance: role === "SALES_FINANCE",
    permissions: getRolePermissions(role),
    hasPermission: (permission: keyof RolePermissions) => hasPermission(role, permission),
  };
}

