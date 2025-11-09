"use client";

import React, { useState, useOptimistic, startTransition } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "./card";
import type { ProjectStatus } from "@prisma/client/index-browser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { onUpdateProject } from "@/actions/project.action";

const statuses: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "PLANNED", label: "Planned", color: "bg-slate-100" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-yellow-100" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100" },
];

export const ProjectsKanbanView = ({ projects }: { projects: any[] }) => {
  const router = useRouter();

  // Optimistic state for projects with proper typing
  const [optimisticProjects, setOptimisticProjects] = useOptimistic(
    projects,
    (state: any[], optimisticValue: { id: number; sourceStatus: ProjectStatus; destinationStatus: ProjectStatus; sourceIndex: number; destinationIndex: number }) => {
      const { id, sourceStatus, destinationStatus } = optimisticValue;
      
      // Update project status optimistically
      return state.map((p) =>
        p.id === id ? { ...p, status: destinationStatus } : p
      );
    }
  );

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any droppable
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const projectId = parseInt(draggableId);
    const newStatus = destination.droppableId as ProjectStatus;
    const oldStatus = source.droppableId as ProjectStatus;
    const project = optimisticProjects.find((p) => p.id === projectId);

    if (!project || project.status === newStatus) {
      return;
    }

    // Optimistically update the UI
    startTransition(() => {
      setOptimisticProjects({
        id: projectId,
        sourceStatus: oldStatus,
        destinationStatus: newStatus,
        sourceIndex: source.index,
        destinationIndex: destination.index,
      });
    });

    // Update on server
    try {
      const result = await onUpdateProject({
        id: projectId,
        name: project.name,
        description: project.description,
        code: project.code,
        type: project.type,
        status: newStatus,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        budgetAmount: project.budgetAmount,
        budgetHours: project.budgetHours,
        estimatedCost: project.estimatedCost,
        estimatedRevenue: project.estimatedRevenue,
      });

      if (result.status === 200) {
        toast.success(`Project moved to ${newStatus.replace("_", " ")}`);
        router.refresh();
      } else {
        toast.error("Failed to update project status");
        router.refresh(); // Refresh to revert optimistic update
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project status");
      router.refresh(); // Refresh to revert optimistic update
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => {
          const statusProjects = optimisticProjects.filter((p) => p.status === status.value);

          return (
            <Card key={status.value} className="flex flex-col h-[calc(100vh-20rem)]">
              <CardHeader className="p-4 pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{status.label}</h3>
                  <Badge variant="outline" className="font-mono">
                    {statusProjects.length}
                  </Badge>
                </div>
              </CardHeader>
              <Droppable droppableId={status.value} isDropDisabled={false}>
                {(provided, snapshot) => (
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 pt-0 flex-1 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver ? "bg-muted/50 ring-2 ring-primary/20 ring-inset" : ""
                    }`}
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#d1d5db #f3f4f6",
                    }}
                  >
                    <div className="space-y-3">
                      {statusProjects.map((project, index) => (
                        <Draggable
                          key={project.id}
                          draggableId={project.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${
                                snapshot.isDragging ? "rotate-2 scale-105 shadow-xl" : ""
                              }`}
                            >
                              <ProjectCard project={project} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {statusProjects.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                          Drop projects here
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Droppable>
            </Card>
          );
        })}
      </div>
    </DragDropContext>
  );
};

