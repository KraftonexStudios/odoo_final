"use client";
import React from "react";
import type { Project, User } from "@prisma/client/index-browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base64ToDataUrl, cn } from "@/lib/utils";
import { MoreVertical, Flag, Pencil, Trash2 } from "lucide-react";
import ProjectSheetForm from "@/components/forms/project";
import { useDeleteProject } from "@/hooks/projects";
import { useRole } from "@/hooks/use-role";
import { useUser } from "@clerk/nextjs";
import { Progress } from "@/components/ui/progress";

type ProjectWithRelations = Project & {
  coverImage?: string | null;
  taskCount?: number;
  completedTaskCount?: number;
  projectManager?: Pick<User, "id" | "firstName" | "lastName" | "avatar">;
};

type Props = {
  project: ProjectWithRelations;
  className?: string;
};

export const ProjectCard = ({ project, className }: Props) => {
  const { mutate: remove, isPending } = useDeleteProject();
  const { isAdmin, isProjectManager } = useRole();
  const { user } = useUser();
  const imageSrc = base64ToDataUrl(project.coverImage ?? undefined);
  
  // Check if current user is the project manager
  const isOwnProject = user?.id === project.projectManager?.id?.toString();
  const canEdit = isAdmin || (isProjectManager && isOwnProject);
  const canDelete = isAdmin;

  // Format date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };

  // Get tags from project type and status
  const tags = [
    project.type?.replace("_", " ") || "",
    project.status?.replace("_", " ") || "",
  ].filter(Boolean);

  const managerInitials = project.projectManager
    ? `${project.projectManager.firstName?.[0] || ""}${project.projectManager.lastName?.[0] || ""}`
    : "";

  return (
    <Card 
      className={cn("overflow-hidden hover:shadow-lg transition-shadow cursor-pointer", className)}
      onClick={() => window.location.href = `/dashboard/projects/${project.id}/dashboard`}
    >
      <div className="relative h-60 bg-muted">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
          )}
          
          {/* Tags at the top */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {tags.map((tag, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Three-dot menu at top-right */}
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <ProjectSheetForm
                    mode="edit"
                    project={project}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                )}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => remove(project.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
                {!canEdit && !canDelete && (
                  <DropdownMenuItem disabled>
                    No actions available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Project Title */}
        <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>

        {/* Progress Bar */}
        {project.taskCount !== undefined && project.taskCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{project.completedTaskCount || 0} / {project.taskCount} tasks</span>
            </div>
            <Progress 
              value={project.taskCount > 0 ? ((project.completedTaskCount || 0) / project.taskCount) * 100 : 0} 
              className="h-2"
            />
          </div>
        )}

        {/* Deadline with flag icon */}
        {project.endDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flag className="h-4 w-4" />
            <span>{formatDate(project.endDate)}</span>
          </div>
        )}

        {/* Bottom section: Project Manager and Task Count */}
        <div className="flex items-center justify-between pt-2">
          {/* Project Manager Avatar */}
          {project.projectManager && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {project.projectManager.avatar ? (
                  <AvatarImage
                    src={
                      project.projectManager.avatar.startsWith("data:") ||
                      project.projectManager.avatar.startsWith("http")
                        ? project.projectManager.avatar
                        : base64ToDataUrl(project.projectManager.avatar)
                    }
                    alt={`${project.projectManager.firstName || ""} ${project.projectManager.lastName || ""}`}
                  />
                ) : null}
                <AvatarFallback className="text-xs">
                  {managerInitials || "PM"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Task Count */}
          <div className="text-sm text-muted-foreground">
            {project.taskCount ?? 0} {project.taskCount === 1 ? "task" : "tasks"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;