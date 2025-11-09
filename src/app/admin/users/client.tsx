"use client";

import { onUpdateUserRole, onUpdateUserHourlyRate } from "@/actions/admin.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, DollarSign, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { base64ToDataUrl } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UserRole = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "SALES_FINANCE";

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "PROJECT_MANAGER":
      return "default";
    case "SALES_FINANCE":
      return "secondary";
    default:
      return "outline";
  }
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  hourlyRate: number;
  createdAt: Date;
};

export function UserManagementClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      const result = await onUpdateUserRole(userId, newRole);
      if (result.status === 200) {
        toast.success("User role updated successfully");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update user role");
      }
    });
  };

  const handleRateChange = (userId: string, rate: number) => {
    setEditingRates((prev) => ({ ...prev, [userId]: rate }));
  };

  const handleSaveRate = async (userId: string) => {
    const rate = editingRates[userId];
    if (rate !== undefined) {
      startTransition(async () => {
        const result = await onUpdateUserHourlyRate(userId, rate);
        if (result.status === 200) {
          toast.success("Hourly rate updated successfully");
          setEditingRates((prev) => {
            const newRates = { ...prev };
            delete newRates[userId];
            return newRates;
          });
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update hourly rate");
        }
      });
    }
  };

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isEditingRate = editingRates[user.id] !== undefined;
                const displayRate = isEditingRate
                  ? editingRates[user.id]
                  : user.hourlyRate;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              user.avatar?.startsWith("data:")
                                ? user.avatar
                                : user.avatar?.startsWith("http")
                                ? user.avatar
                                : base64ToDataUrl(user.avatar)
                            }
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                          <AvatarFallback>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as UserRole)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="PROJECT_MANAGER">
                            Project Manager
                          </SelectItem>
                          <SelectItem value="TEAM_MEMBER">
                            Team Member
                          </SelectItem>
                          <SelectItem value="SALES_FINANCE">
                            Sales & Finance
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            value={displayRate}
                            onChange={(e) =>
                              handleRateChange(user.id, parseFloat(e.target.value))
                            }
                            className="w-[120px] pl-6 font-mono"
                            disabled={isPending}
                          />
                        </div>
                        {isEditingRate && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveRate(user.id)}
                            disabled={isPending}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

