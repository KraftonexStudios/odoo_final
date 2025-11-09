"use client";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "./comment-section";
import { AttachmentSection } from "./attachment-section";
import { MessageSquare, Paperclip, Clock, Calendar, User, Flag } from "lucide-react";
import { format } from "date-fns";
import { useTimesheetsByTask } from "@/hooks/timesheets";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TimesheetForm from "@/components/forms/timesheet";
import { ExpenseSheetForm } from "@/components/forms/expense";
import { PlusCircle } from "lucide-react";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | null;
  assignedTo?: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  } | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
};

type Props = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
};

export const TaskDetailDrawer = ({ task, open, onOpenChange, projectId }: Props) => {
  const { data: timesheets, isLoading: loadingTimesheets } = useTimesheetsByTask(
    task?.id || 0
  );

  if (!task) return null;

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

  const totalHours = timesheets?.reduce((sum: number, t: any) => sum + (t.hours || 0), 0) || 0;
  const billableHours = timesheets?.filter((t: any) => t.isBillable).reduce((sum: number, t: any) => sum + (t.hours || 0), 0) || 0;
  const totalCost = timesheets?.reduce((sum: number, t: any) => sum + (t.cost || 0), 0) || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{task.title}</SheetTitle>
          <SheetDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusBadgeVariant(task.status)}>
                {task.status.replace("_", " ")}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                {task.priority}
              </Badge>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Task Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {task.assignedTo && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-2 mb-1">
                      <User className="h-4 w-4" />
                      Assigned To
                    </p>
                    <p className="font-medium">
                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </p>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </p>
                    <p className="font-medium">
                      {format(new Date(task.dueDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4" />
                    Estimated Hours
                  </p>
                  <p className="font-medium">{task.estimatedHours || 0}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4" />
                    Actual Hours
                  </p>
                  <p className="font-medium">{task.actualHours || 0}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {task.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold mb-2">Description</p>
                <RichTextViewer content={task.description} />
              </CardContent>
            </Card>
          )}

          {/* Timesheet Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Tracking
                </p>
                <TimesheetForm
                  projectId={projectId}
                  taskId={task.id}
                  trigger={
                    <button className="text-xs text-primary hover:underline">
                      Log Hours
                    </button>
                  }
                />
              </div>
              {loadingTimesheets ? (
                <Skeleton className="h-20" />
              ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Hours</p>
                    <p className="text-lg font-semibold">{totalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Billable Hours</p>
                    <p className="text-lg font-semibold">{billableHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-semibold">${totalCost.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Tabs for Comments, Timesheets, Attachments */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="timesheets" className="gap-2">
                <Clock className="h-4 w-4" />
                Timesheets
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <CommentSection taskId={task.id} />
            </TabsContent>

            <TabsContent value="timesheets" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <TimesheetForm
                  projectId={projectId}
                  taskId={task.id}
                  trigger={
                    <Button size="sm" className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Log Hours
                    </Button>
                  }
                />
              </div>
              {loadingTimesheets ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : timesheets && timesheets.length > 0 ? (
                <div className="space-y-2">
                  {timesheets.map((timesheet: any) => (
                    <Card key={timesheet.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {format(new Date(timesheet.date), "dd/MM/yyyy")}
                              </p>
                              <Badge variant={timesheet.isBillable ? "default" : "secondary"}>
                                {timesheet.isBillable ? "Billable" : "Non-billable"}
                              </Badge>
                              <Badge variant="outline">{timesheet.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {timesheet.description || "No description"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{timesheet.hours}h</span>
                              <span>${timesheet.cost?.toFixed(2) || "0.00"}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No timesheets logged yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <AttachmentSection taskId={task.id} />
            </TabsContent>
          </Tabs>

          {/* Quick Actions for Team Members */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold mb-4">Quick Actions</p>
              <div className="flex gap-2">
                <ExpenseSheetForm
                  projectId={projectId}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Create Expense
                    </Button>
                  }
                />
                <TimesheetForm
                  projectId={projectId}
                  taskId={task.id}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Log Hours
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

