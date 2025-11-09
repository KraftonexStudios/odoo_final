import { onFetchAllTasksAdmin } from "@/actions/admin.action";
import { Badge } from "@/components/ui/badge";
import { ListTodo } from "lucide-react";
import { TasksManagementClient } from "./client";
import { unstable_noStore as noStore } from "next/cache";

export default async function AdminTasksPage() {
  noStore(); // Prevent static generation
  
  const result = await onFetchAllTasksAdmin();
  const tasks = result.status === 200 ? (result.data || []) : [];

  console.log("[TASKS_PAGE] Result:", result.status, "Tasks count:", tasks.length);

  if (result.status !== 200) {
    return (
      <div className="p-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-red-600">Error Loading Tasks</h2>
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
            <ListTodo className="h-8 w-8" />
            Task Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all tasks across all projects
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {tasks.length} Tasks
        </Badge>
      </div>

      {/* Client Component for Interactive Features */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Tasks Yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Tasks will appear here once projects are created and tasks are assigned.
          </p>
        </div>
      ) : (
        <TasksManagementClient tasks={tasks} />
      )}
    </div>
  );
}
