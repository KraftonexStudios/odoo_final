"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { base64ToDataUrl, cn, getAvatarGradient, getInitials, formatRole } from "@/lib/utils";

export const ProfileDropdown = ({ className }: { className?: string }) => {
  const { data, isLoading } = useCurrentUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const queryClient = useQueryClient();

  const user = data?.data;

  // Refetch user data when query is invalidated (e.g., after profile update)
  // Note: Removed the subscription as it was causing infinite refetch loops
  // The query will refetch automatically when invalidated from mutations

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };


  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  const avatarSrc = base64ToDataUrl(user?.avatar);
  const initials = getInitials(user?.firstName, user?.lastName);
  const gradient = getAvatarGradient(user?.firstName || user?.email || "User");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("rounded-full h-10 w-10 p-0", className)}>
          <Avatar className="h-9 w-9">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="Profile" className="object-cover" />
            ) : (
              <AvatarFallback className={cn(gradient, "text-white font-semibold")}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1 font-semibold">
              {formatRole(user?.role as string | string[])}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

