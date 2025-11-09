"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  onGetPurchaseOrdersByProject,
  onCreatePurchaseOrder,
  onUpdatePurchaseOrderStatus,
  onDeletePurchaseOrder,
} from "@/actions/purchase-order.action";
import type { PurchaseOrder, PurchaseOrderStatus } from "@prisma/client/index-browser";

export type PurchaseOrderDTO = Omit<PurchaseOrder, "subtotal" | "taxAmount" | "totalAmount"> & {
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number;
};

export function usePurchaseOrders(projectId?: number) {
  return useQuery<{ status: number; data?: PurchaseOrderDTO[] }>({
    queryKey: ["purchase-orders", projectId],
    queryFn: () =>
      projectId ? onGetPurchaseOrdersByProject(projectId) : Promise.resolve({ status: 200, data: [] }),
    enabled: !!projectId,
  });
}

export function useCreatePurchaseOrder(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onCreatePurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", projectId] });
    },
  });
}

export function useUpdatePurchaseOrderStatus(projectId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; status: PurchaseOrderStatus; projectId?: number }) =>
      onUpdatePurchaseOrderStatus(payload),
    onSuccess: (_, variables) => {
      const targetProjectId = variables.projectId ?? projectId;
      qc.invalidateQueries({ queryKey: ["purchase-orders", targetProjectId] });
    },
  });
}

export function useDeletePurchaseOrder(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeletePurchaseOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", projectId] });
    },
  });
}
