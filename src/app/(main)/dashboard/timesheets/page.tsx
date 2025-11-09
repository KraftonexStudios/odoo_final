"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { onGetMyTimesheets } from "@/actions/timesheet.action";
import TimesheetForm from "@/components/forms/timesheet";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function TimesheetsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-timesheets"],
    queryFn: async () => {
      const result = await onGetMyTimesheets();
      return result.status === 200 ? result.data : [];
    },
  });

  const timesheets = data || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "SUBMITTED":
        return "secondary";
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-8 w-8" />
            My Timesheets
          </h1>
          <p className="text-muted-foreground">
            Log your working hours and track time
          </p>
        </div>
        <TimesheetForm
          projectId={0} // General timesheet, not tied to specific project
          trigger={
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Log Hours
            </Button>
          }
        />
      </div>

      {/* Timesheets List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : timesheets.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Timesheets Yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Log your first hours to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((timesheet: any) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      {format(new Date(timesheet.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{timesheet.project?.name || "-"}</TableCell>
                    <TableCell>{timesheet.task?.title || "-"}</TableCell>
                    <TableCell className="font-mono">{timesheet.hours}h</TableCell>
                    <TableCell className="font-mono">
                      ${timesheet.cost?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      {timesheet.isBillable ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(timesheet.status)}>
                        {timesheet.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

