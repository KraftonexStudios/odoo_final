"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetInvoicesByProject,
  onCreateCustomerInvoice,
  onUpdateInvoiceStatus,
  onDeleteCustomerInvoice,
  onRecordPayment,
} from "@/actions/customer-invoice.action";
import { InvoiceStatus } from "@prisma/client/index-browser";
import { toast } from "sonner";

export const useInvoices = (projectId: number) => {
  return useQuery({
    queryKey: ["customer-invoices", projectId],
    queryFn: async () => {
      const result = await onGetInvoicesByProject(projectId);
      if (result.status !== 200) {
        throw new Error(result.message || "Failed to fetch invoices");
      }
      return result.data || [];
    },
  });
};

export const useCreateInvoice = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onCreateCustomerInvoice,
    onSuccess: (result) => {
      if (result.status === 201) {
        toast.success(result.message || "Invoice created");
        queryClient.invalidateQueries({ queryKey: ["customer-invoices", projectId] });
      } else {
        toast.error(result.message || "Failed to create invoice");
      }
    },
    onError: () => {
      toast.error("Failed to create invoice");
    },
  });
};

export const useUpdateInvoiceStatus = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: InvoiceStatus }) => onUpdateInvoiceStatus(id, status),
    onSuccess: (result) => {
      if (result.status === 200) {
        toast.success(result.message || "Invoice status updated");
        queryClient.invalidateQueries({ queryKey: ["customer-invoices", projectId] });
      } else {
        toast.error(result.message || "Failed to update status");
      }
    },
    onError: () => toast.error("Failed to update invoice status"),
  });
};

export const useDeleteInvoice = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onDeleteCustomerInvoice,
    onSuccess: (result) => {
      if (result.status === 200) {
        toast.success(result.message || "Invoice deleted");
        queryClient.invalidateQueries({ queryKey: ["customer-invoices", projectId] });
      } else {
        toast.error(result.message || "Failed to delete invoice");
      }
    },
    onError: () => toast.error("Failed to delete invoice"),
  });
};

export const useRecordInvoicePayment = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, amount, paymentDate }: { invoiceId: number; amount: number; paymentDate: Date }) =>
      onRecordPayment(invoiceId, amount, paymentDate),
    onSuccess: (result) => {
      if (result.status === 200) {
        toast.success(result.message || "Payment recorded");
        queryClient.invalidateQueries({ queryKey: ["customer-invoices", projectId] });
      } else {
        toast.error(result.message || "Failed to record payment");
      }
    },
    onError: () => toast.error("Failed to record payment"),
  });
};