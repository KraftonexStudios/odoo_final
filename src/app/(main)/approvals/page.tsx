"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Timer,
  AlertCircle 
} from "lucide-react";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onGetPendingExpenses, onApproveExpense, onRejectExpense } from "@/actions/expense.action";
import { onGetPendingTimesheets, onApproveTimesheet, onRejectTimesheet } from "@/actions/timesheet.action";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedItem, setSelectedItem] = useState<{id: number, type: "expense" | "timesheet"} | null>(null);

  // Fetch pending items
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["pending-expenses"],
    queryFn: async () => {
      const result = await onGetPendingExpenses();
      return result.status === 200 ? result.data : [];
    },
  });

  const { data: timesheets, isLoading: loadingTimesheets } = useQuery({
    queryKey: ["pending-timesheets"],
    queryFn: async () => {
      const result = await onGetPendingTimesheets();
      return result.status === 200 ? result.data : [];
    },
  });

  // Mutations
  const approveExpense = useMutation({
    mutationFn: onApproveExpense,
    onSuccess: () => {
      toast.success("Expense approved");
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
    },
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => onRejectExpense(id, reason),
    onSuccess: () => {
      toast.success("Expense rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      setRejectDialogOpen(false);
      setRejectReason("");
    },
  });

  const approveTimesheet = useMutation({
    mutationFn: onApproveTimesheet,
    onSuccess: () => {
      toast.success("Timesheet approved");
      queryClient.invalidateQueries({ queryKey: ["pending-timesheets"] });
    },
  });

  const rejectTimesheetMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => onRejectTimesheet(id, reason),
    onSuccess: () => {
      toast.success("Timesheet rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-timesheets"] });
      setRejectDialogOpen(false);
      setRejectReason("");
    },
  });

  const handleReject = () => {
    if (!selectedItem || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (selectedItem.type === "expense") {
      rejectExpenseMutation.mutate({ id: selectedItem.id, reason: rejectReason });
    } else {
      rejectTimesheetMutation.mutate({ id: selectedItem.id, reason: rejectReason });
    }
  };

  const pendingCount = (expenses?.length || 0) + (timesheets?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve pending expenses and timesheets
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Items
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Require your approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: ${expenses?.reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0).toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Timesheets
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {timesheets?.reduce((sum: number, t: any) => sum + (t.hours || 0), 0).toFixed(1) || "0.0"}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Expenses ({expenses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="gap-2">
            <Timer className="h-4 w-4" />
            Timesheets ({timesheets?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : expenses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending expenses
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.map((expense: any) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {expense.user?.firstName} {expense.user?.lastName}
                        </TableCell>
                        <TableCell>{expense.project?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          ${expense.totalAmount?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {expense.isBillable ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => approveExpense.mutate(expense.id)}
                              disabled={approveExpense.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => {
                                setSelectedItem({ id: expense.id, type: "expense" });
                                setRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Timesheets</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTimesheets ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : timesheets?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending timesheets
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets?.map((timesheet: any) => (
                      <TableRow key={timesheet.id}>
                        <TableCell>
                          {timesheet.user?.firstName} {timesheet.user?.lastName}
                        </TableCell>
                        <TableCell>{timesheet.project?.name}</TableCell>
                        <TableCell>{timesheet.task?.title || "-"}</TableCell>
                        <TableCell>
                          {new Date(timesheet.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          {timesheet.hours}h
                        </TableCell>
                        <TableCell className="font-mono">
                          ${timesheet.cost?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {timesheet.isBillable ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => approveTimesheet.mutate(timesheet.id)}
                              disabled={approveTimesheet.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => {
                                setSelectedItem({ id: timesheet.id, type: "timesheet" });
                                setRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedItem?.type === "expense" ? "Expense" : "Timesheet"}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {selectedItem?.type}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectExpenseMutation.isPending || rejectTimesheetMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

