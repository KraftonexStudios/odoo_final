"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onGetExpensesByProject, onCreateExpense, onUpdateExpenseStatus, onDeleteExpense } from "@/actions/expense.action";
import type { Expense, ExpenseStatus } from "@prisma/client/index-browser";

export function useExpenses(projectId?: number) {
  return useQuery<{ status: number; data?: (Expense & { amount: number; totalAmount: number })[] }>({
    queryKey: ["expenses", projectId],
    queryFn: () => (projectId ? onGetExpensesByProject(projectId) : Promise.resolve({ status: 200, data: [] })),
    enabled: !!projectId,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onCreateExpense,
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ["expenses", (variables as any).projectId] });
    },
  });
}

export function useUpdateExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; status: ExpenseStatus }) => onUpdateExpenseStatus(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// Alias for consistency
export const useGetProjectExpenses = useExpenses;