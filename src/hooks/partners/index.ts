import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onFetchAllPartners,
  onFetchPartnersByType,
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
} from "@/actions/partner.action";
import { toast } from "sonner";
import { PartnerType } from "@prisma/client/index-browser";

export const usePartners = () => {
  return useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const result = await onFetchAllPartners();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });
};

export const usePartnersByType = (type: PartnerType) => {
  return useQuery({
    queryKey: ["partners", type],
    queryFn: async () => {
      const result = await onFetchPartnersByType(type);
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });
};

export const useCreatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onCreatePartner,
    onSuccess: (data) => {
      if (data.status === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["partners"] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to create partner");
    },
  });
};

export const useUpdatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onUpdatePartner,
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["partners"] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to update partner");
    },
  });
};

export const useDeletePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onDeletePartner,
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["partners"] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to delete partner");
    },
  });
};
