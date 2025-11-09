"use client";

import { onDeleteTask } from "@/actions/task.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ExternalLink, Trash2, Eye, MoreVertical } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { base64ToDataUrl } from "@/lib/utils";
import Link from "next/link";
import { RichTextPreview, RichTextViewer } from "@/components/ui/rich-text-viewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "DONE":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "BLOCKED":
      return "destructive";
    default:
      return "outline";
  }
};

export function TasksManagementClient({ tasks }: { tasks: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    startTransition(async () => {
      const result = await onDeleteTask(id);
      if (result.status === 200) {
        toast.success("Task deleted successfully");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete task");
      }
    });
  };

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks by title or project..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tasks.filter((t) => t.status === "IN_PROGRESS").length}
            </div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tasks.filter((t) => t.status === "DONE").length}
            </div>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {
                tasks.filter(
                  (t) =>
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== "DONE"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Hours (Est/Act)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{task.title}</span>
                  {task.description && (
                    <RichTextPreview content={task.description} maxLength={100} className="text-xs" />
                  )}
                </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/projects/${task.project?.id}`}
                      className="hover:underline text-primary"
                    >
                      {task.project?.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {task.assignedTo && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              task.assignedTo.avatar?.startsWith("data:")
                                ? task.assignedTo.avatar
                                : task.assignedTo.avatar?.startsWith("http")
                                ? task.assignedTo.avatar
                                : base64ToDataUrl(task.assignedTo.avatar)
                            }
                          />
                          <AvatarFallback>
                            {task.assignedTo.firstName?.[0]}
                            {task.assignedTo.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span
                        className={
                          new Date(task.dueDate) < new Date() &&
                          task.status !== "DONE"
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {task.estimatedHours || 0} / {task.actualHours || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setSelectedTask(task)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <Link href={`/admin/projects/${task.project?.id}`}>
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Go to Project
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600"
                          disabled={isPending}
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
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{selectedTask.project?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              {selectedTask.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <RichTextViewer content={selectedTask.description} />
                </div>
              )}
              {selectedTask.assignedTo && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          selectedTask.assignedTo.avatar?.startsWith("data:")
                            ? selectedTask.assignedTo.avatar
                            : selectedTask.assignedTo.avatar?.startsWith("http")
                            ? selectedTask.assignedTo.avatar
                            : base64ToDataUrl(selectedTask.assignedTo.avatar)
                        }
                      />
                      <AvatarFallback>
                        {selectedTask.assignedTo.firstName?.[0]}
                        {selectedTask.assignedTo.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {selectedTask.assignedTo.firstName}{" "}
                      {selectedTask.assignedTo.lastName}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Hours</p>
                  <p className="font-mono font-medium">
                    {selectedTask.estimatedHours || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Hours</p>
                  <p className="font-mono font-medium">
                    {selectedTask.actualHours || 0}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

