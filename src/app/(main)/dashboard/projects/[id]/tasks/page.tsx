"use client";
import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTasks, useUpdateTaskStatus } from "@/hooks/tasks";
import type { Task, TaskStatus } from "@prisma/client/index-browser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle } from "lucide-react";
import { TaskSheetForm } from "@/components/forms/task";

const STATUSES: TaskStatus[] = ["NEW", "IN_PROGRESS", "BLOCKED", "DONE"];

const ProjectTasksPage = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const { data, isLoading } = useTasks(projectId);
  const tasks = (data?.data ?? []) as Task[];
  const { mutate: changeStatus } = useUpdateTaskStatus();

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = {
      NEW: [],
      IN_PROGRESS: [],
      BLOCKED: [],
      DONE: [],
      CANCELLED: [],
    };

    tasks.forEach((t) => g[t.status].push(t));
    return g;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
          <TaskSheetForm
            projectId={projectId}
            trigger={
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Task
              </Button>
            }
          />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {status.replace("_", " ")}
              </h3>
              <Badge variant="secondary">{grouped[status].length}</Badge>
            </div>
            <div className="space-y-2">
              {grouped[status].map((t) => (
                <Card key={t.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.assignedToId && (
                        <div className="text-xs text-muted-foreground">
                          Assigned to: {t.assignedToId}
                        </div>
                      )}
                    </div>
                    <Select
                      defaultValue={t.status}
                      onValueChange={(v) =>
                        changeStatus({ id: t.id, status: v as TaskStatus })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
              {grouped[status].length === 0 && (
                <div className="text-xs text-muted-foreground">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTasksPage;
