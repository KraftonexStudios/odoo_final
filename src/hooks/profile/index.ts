import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetCurrentUser,
  onUpdateProfile,
  onUploadProfileImage,
} from "@/actions/profile.action";
import { toast } from "sonner";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const result = await onGetCurrentUser();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    }) => {
      return await onUpdateProfile(data);
    },
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["current-user"] });
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });
};

export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await onUploadProfileImage(formData);
    },
    onSuccess: (data, variables, context) => {
      if (data.status === 200) {
        toast.success("Profile image updated successfully");
        // Invalidate all user-related queries
        queryClient.invalidateQueries({ queryKey: ["current-user"] });
        queryClient.invalidateQueries({ queryKey: ["authenticated-user"] });
        // Force refetch
        queryClient.refetchQueries({ queryKey: ["current-user"] });
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    },
    onError: () => {
      toast.error("Failed to upload image");
    },
  });
};

