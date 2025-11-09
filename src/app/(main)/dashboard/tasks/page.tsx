"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListTodo, User, Users as UsersIcon, LayoutGrid } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { onGetMyTasks, onGetAllTasks } from "@/actions/task.action";
import TaskSheetForm from "@/components/forms/task";

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "NEW":
      return "secondary";
    case "IN_PROGRESS":
      return "default";
    case "BLOCKED":
      return "destructive";
    case "DONE":
      return "outline";
    default:
      return "secondary";
  }
};

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "outline";
    default:
      return "secondary";
  }
};

export default function TasksPage() {
  const { data: myTasksData, isLoading: loadingMyTasks } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const result = await onGetMyTasks();
      return result.status === 200 ? result.data : [];
    },
  });

  const { data: allTasksData, isLoading: loadingAllTasks } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const result = await onGetAllTasks();
      return result.status === 200 ? result.data : [];
    },
  });

  const myTasks = myTasksData || [];
  const allTasks = allTasksData || [];

  const renderTasksTable = (tasks: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Hours</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No tasks found
            </TableCell>
          </TableRow>
        ) : (
          tasks.map((task: any) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.project?.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(task.status)}>
                  {task.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityBadgeVariant(task.priority)}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {task.estimatedHours || 0}h / {task.actualHours || 0}h
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListTodo className="h-8 w-8" />
          Tasks
        </h1>
        <p className="text-muted-foreground">
          View and manage your tasks
        </p>
      </div>

      {/* Tabs for My Tasks / All Tasks / Board View */}
      <Tabs defaultValue="my-tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-tasks" className="gap-2">
            <User className="h-4 w-4" />
            My Tasks ({myTasks.length})
          </TabsTrigger>
          <TabsTrigger value="all-tasks" className="gap-2">
            <UsersIcon className="h-4 w-4" />
            All Tasks ({allTasks.length})
          </TabsTrigger>
          <TabsTrigger value="board" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Board View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Assigned to Me</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMyTasks ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : (
                renderTasksTable(myTasks)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Accessible Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAllTasks ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : (
                renderTasksTable(allTasks)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Board</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {["NEW", "IN_PROGRESS", "BLOCKED", "DONE"].map((status) => {
                  const statusTasks = allTasks.filter((t: any) => t.status === status);
                  return (
                    <div key={status} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                          {status.replace("_", " ")}
                        </h3>
                        <Badge variant="secondary">{statusTasks.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {statusTasks.map((task: any) => (
                          <Card key={task.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="space-y-2">
                              <div className="text-sm font-medium">{task.title}</div>
                              {task.project && (
                                <div className="text-xs text-muted-foreground">
                                  {task.project.name}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
                                  {task.priority}
                                </Badge>
                                {task.dueDate && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                        {statusTasks.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-4">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

