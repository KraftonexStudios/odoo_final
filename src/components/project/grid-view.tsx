"use client";

import React from "react";
import { useRole } from "@/hooks/use-role";
import { ProjectCard } from "./card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PlusCircle } from "lucide-react";
import ProjectSheetForm from "@/components/forms/project";

export const ProjectsGridView = ({ projects }: { projects: any[] }) => {
  const { permissions } = useRole();

  if (projects.length === 0) {
    return (
      <Empty className="py-20" title="No projects yet">
        {permissions.canCreateProject && (
          <ProjectSheetForm
            trigger={
              <Button className="mt-4 gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Your First Project
              </Button>
            }
          />
        )}
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {permissions.canCreateProject && (
        <div className="flex justify-end">
          <ProjectSheetForm
            trigger={
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Project
              </Button>
            }
          />
        </div>
      )}
      {projects.length === 0 ? (
        <Empty className="py-20" title="No projects yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
};
