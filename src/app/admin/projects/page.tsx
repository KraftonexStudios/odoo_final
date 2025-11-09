import { onFetchAllProjectsAdmin } from "@/actions/admin.action";
import { FolderKanban, PlusCircle } from "lucide-react";
import ProjectSheetForm from "@/components/forms/project";
import { Button } from "@/components/ui/button";
import { ProjectsManagementClient } from "./client";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default async function AdminProjectsPage() {
  
  const result = await onFetchAllProjectsAdmin();
  const projects = result.status === 200 ? (result.data || []) : [];

  console.log("[PROJECTS_PAGE] Result:", result.status, "Projects count:", projects.length);

  if (result.status !== 200) {
    return (
      <div className="p-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-red-600">Error Loading Projects</h2>
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
            <FolderKanban className="h-8 w-8" />
            Project Management
          </h1>
          <p className="text-muted-foreground">
            Manage all projects with full CRUD access
          </p>
        </div>
        <ProjectSheetForm
          mode="create"
          trigger={
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Project
            </Button>
          }
        />
      </div>

      {/* Client Component for Interactive Features */}
      {projects.length === 0 ? (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>No Projects Yet</EmptyTitle>
            <EmptyDescription>
              Create your first project to get started managing your work.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ProjectsManagementClient projects={projects as any} />
      )}
    </div>
  );
}
