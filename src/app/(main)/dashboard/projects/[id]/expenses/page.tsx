"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useExpenses } from "@/hooks/expenses";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { ExpenseSheetForm } from "@/components/forms/expense";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ExpensesPage = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const { data, isLoading } = useExpenses(projectId);
  const items = data?.data ?? [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Expenses</h1>
          <ExpenseSheetForm
            projectId={projectId}
            trigger={
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Expense
              </Button>
            }
          />
      </div>
      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No expenses</EmptyTitle>
          <EmptyDescription>Create your first expense to get started</EmptyDescription>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.expenseNumber}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>
                  {new Date(e.expenseDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{e.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {e.totalAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ExpensesPage;
