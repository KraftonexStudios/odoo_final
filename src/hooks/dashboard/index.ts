import { useQuery } from "@tanstack/react-query";
import {
  onFetchProjectManagerDashboard,
  onFetchTeamMemberDashboard,
  onFetchSalesFinanceDashboard,
} from "@/actions/dashboard.action";

export const useProjectManagerDashboard = () => {
  return useQuery({
    queryKey: ["pm-dashboard"],
    queryFn: async () => {
      const result = await onFetchProjectManagerDashboard();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useTeamMemberDashboard = () => {
  return useQuery({
    queryKey: ["tm-dashboard"],
    queryFn: async () => {
      const result = await onFetchTeamMemberDashboard();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useSalesFinanceDashboard = () => {
  return useQuery({
    queryKey: ["sf-dashboard"],
    queryFn: async () => {
      const result = await onFetchSalesFinanceDashboard();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

