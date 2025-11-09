"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, PlusCircle, CheckCircle2, Calendar, Trash2 } from "lucide-react";
import { useMilestones, useCompleteMilestone, useDeleteMilestone } from "@/hooks/milestones";
import { Skeleton } from "@/components/ui/skeleton";
import MilestoneForm from "@/components/forms/milestone";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  projectId: number;
};

export const MilestonesPanel = ({ projectId }: Props) => {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const { mutate: complete, isPending: completing } = useCompleteMilestone(projectId);
  const { mutate: deleteMilestone, isPending: deleting } = useDeleteMilestone(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const completedCount = milestones.filter((m: any) => m.isCompleted).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Milestones
          </CardTitle>
          <MilestoneForm
            projectId={projectId}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Milestone
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No milestones yet</p>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {completedCount} / {milestones.length} completed
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Milestone List */}
            <div className="space-y-3">
              {milestones.map((milestone: any) => (
                <div
                  key={milestone.id}
                  className={`p-3 border rounded-lg space-y-2 ${
                    milestone.isCompleted ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${milestone.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {milestone.title}
                        </h4>
                        {milestone.isCompleted && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(milestone.dueDate), "dd/MM/yyyy")}
                        </div>
                        {milestone.completedAt && (
                          <div className="text-green-600">
                            Completed: {format(new Date(milestone.completedAt), "dd/MM/yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!milestone.isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => complete(milestone.id)}
                          disabled={completing}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This milestone will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMilestone(milestone.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

