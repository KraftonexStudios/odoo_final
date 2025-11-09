import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetVendorBillsByProject,
  onCreateVendorBill,
  onUpdateBillStatus,
  onDeleteVendorBill,
  onRecordBillPayment,
} from "@/actions/vendor-bill.action";
import { toast } from "sonner";

export const useVendorBills = (projectId: number) => {
  return useQuery({
    queryKey: ["vendor-bills", projectId],
    queryFn: async () => {
      const result = await onGetVendorBillsByProject(projectId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data;
    },
  });
};

export const useCreateVendorBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof onCreateVendorBill>[0]) => onCreateVendorBill(input),
    onSuccess: (data, variables) => {
      if (data.status === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["vendor-bills", variables.projectId] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useUpdateBillStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: any }) => onUpdateBillStatus(id, status),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useDeleteVendorBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onDeleteVendorBill,
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useRecordBillPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, amount, paymentDate }: { billId: number; amount: number; paymentDate: Date }) =>
      onRecordBillPayment(billId, amount, paymentDate),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

