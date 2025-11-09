"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  onGetSalesOrdersByProject,
  onCreateSalesOrder,
  onUpdateSalesOrderStatus,
  onDeleteSalesOrder,
} from "@/actions/sales-order.action";
import type { SalesOrder, SalesOrderStatus } from "@prisma/client/index-browser";

export function useSalesOrders(projectId?: number) {
  return useQuery<{ status: number; data?: (SalesOrder & { totalAmount: number })[] }>({
    queryKey: ["sales-orders", projectId],
    queryFn: () => (projectId ? onGetSalesOrdersByProject(projectId) : Promise.resolve({ status: 200, data: [] })),
    enabled: !!projectId,
  });
}

export function useCreateSalesOrder(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onCreateSalesOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders", projectId] });
    },
  });
}

export function useUpdateSalesOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; status: SalesOrderStatus }) => onUpdateSalesOrderStatus(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });
}

export function useDeleteSalesOrder(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeleteSalesOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders", projectId] });
    },
  });
}
