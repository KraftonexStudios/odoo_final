"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RichTextPreview } from "@/components/ui/rich-text-viewer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useDeleteTask } from "@/hooks/tasks";
import TaskSheetForm from "@/components/forms/task";
import { EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Task } from "@prisma/client";



export const TasksTable = ({
  projectId,
  tasks,
}: {
  projectId: number;
  tasks: Task[];
}) => {
  const { mutate: deleteTask } = useDeleteTask(projectId);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <EmptyTitle>No tasks yet</EmptyTitle>
        <EmptyDescription>Create your first task to get started</EmptyDescription>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Hours (Est/Actual)</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{task.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  task.priority === "URGENT"
                    ? "destructive"
                    : task.priority === "HIGH"
                    ? "default"
                    : "outline"
                }
              >
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell className="font-mono">
              {typeof task.estimatedHours === 'number' ? task.estimatedHours : task.estimatedHours?.toNumber() || 0} / {typeof task.actualHours === 'number' ? task.actualHours : task.actualHours?.toNumber() || 0}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <TaskSheetForm
                    projectId={projectId}
                    mode="edit"
                    task={task as any}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem
                    onClick={() => deleteTask(Number(task.id))}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

