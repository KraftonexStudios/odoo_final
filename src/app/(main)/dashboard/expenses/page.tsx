"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { onGetMyExpenses } from "@/actions/expense.action";
import { ExpenseSheetForm } from "@/components/forms/expense";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ExpensesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-expenses"],
    queryFn: async () => {
      const result = await onGetMyExpenses();
      return result.status === 200 ? result.data : [];
    },
  });

  const expenses = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            My Expenses
          </h1>
          <p className="text-muted-foreground">
            Create and manage your expense submissions
          </p>
        </div>
        <ExpenseSheetForm
          projectId={0} // General expense, not tied to specific project
          trigger={
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Expense
            </Button>
          }
        />
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Expenses Yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first expense submission to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.expenseNumber}</TableCell>
                      <TableCell>{expense.project?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${expense.totalAmount?.toFixed(2) || "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

