"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectsGridView } from "@/components/project/grid-view";
import { ProjectsKanbanView } from "@/components/project/kanban-view-dnd";
import ProjectSheetForm from "@/components/forms/project";
import { Button } from "@/components/ui/button";
import { Grid3x3, Kanban, PlusCircle } from "lucide-react";
import { useRole } from "@/hooks/use-role";

export function ProjectsClient({ projects }: { projects: any[] }) {
  const { isAdmin } = useRole();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track all your projects
          </p>
        </div>
        {isAdmin && (
          <ProjectSheetForm
            trigger={
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Project
              </Button>
            }
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid" className="gap-2">
            <Grid3x3 className="h-4 w-4" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="h-4 w-4" />
            Board View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <ProjectsGridView projects={projects} />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <ProjectsKanbanView projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

