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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { useDeleteExpense } from "@/hooks/expenses";
import { EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Expense } from "@prisma/client";



export const ExpensesTable = ({
  projectId,
  expenses,
}: {
  projectId: number;
  expenses: Expense[];
}) => {
  const { mutate: deleteExpense } = useDeleteExpense();

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <EmptyTitle>No expenses yet</EmptyTitle>
        <EmptyDescription>Add your first expense to track costs</EmptyDescription>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Tax</TableHead>
          <TableHead>Billable</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>
              <Badge variant="outline">{expense.category}</Badge>
            </TableCell>
            <TableCell>{expense.description || "-"}</TableCell>
            <TableCell>
              {new Date(expense.expenseDate).toLocaleDateString()}
            </TableCell>
            <TableCell className="font-mono">
              ${expense.amount.toLocaleString()}
            </TableCell>
            <TableCell className="font-mono">
              ${expense.taxAmount.toLocaleString()}
            </TableCell>
            <TableCell>
              {expense.isBillable ? (
                <Badge variant="default">Yes</Badge>
              ) : (
                <Badge variant="outline">No</Badge>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => deleteExpense(Number(expense.id))}
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

