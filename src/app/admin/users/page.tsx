import { onFetchAllUsers } from "@/actions/admin.action";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { UserManagementClient } from "./client";
import { unstable_noStore as noStore } from "next/cache";

export default async function UsersPage() {
  noStore(); // Prevent static generation
  
  const result = await onFetchAllUsers();
  const users = result.status === 200 ? (result.data || []) : [];

  console.log("[USERS_PAGE] Result:", result.status, "Users count:", users.length);

  if (result.status !== 200) {
    return (
      <div className="p-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-red-600">Error Loading Users</h2>
          <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and hourly rates
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {users.length} Users
        </Badge>
      </div>

      {/* Client Component for Interactive Features */}
      {users.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Users Found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            There are no users in the system yet.
          </p>
        </div>
      ) : (
        <UserManagementClient users={users} />
      )}
    </div>
  );
}
