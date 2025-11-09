"use client";

import { usePartners, useDeletePartner } from "@/hooks/partners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";
import PartnerSheetForm from "@/components/forms/partner";

export default function PartnersPage() {
  const { data: partners, isLoading } = usePartners();
  const { mutate: deletePartner, isPending: deleting } = useDeletePartner();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPartners = partners?.filter(
    (partner: any) =>
      partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "CUSTOMER":
        return "default";
      case "VENDOR":
        return "secondary";
      case "BOTH":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Partners
          </h1>
          <p className="text-muted-foreground">
            Manage customers and vendors
          </p>
        </div>
        <PartnerSheetForm
          trigger={
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Partner
            </Button>
          }
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search partners by name or email..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Partners ({filteredPartners?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : filteredPartners?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No partners found. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Linked Docs</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners?.map((partner: any) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(partner.type)}>
                        {partner.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {partner.email || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {partner.phone || "-"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {partner.paymentTermDays} days
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      SO: {partner._count?.salesOrders || 0} | PO: {partner._count?.purchaseOrders || 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PartnerSheetForm
                            mode="edit"
                            partner={partner}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deletePartner(partner.id)}
                            disabled={deleting}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

