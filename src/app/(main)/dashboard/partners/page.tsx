"use client";
import React from "react";
import { usePartners } from "@/hooks/partners";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PartnersPage = () => {
  const { data: allData, isLoading: loadingAll } = usePartners();
  const { data: customersData, isLoading: loadingCustomers } = usePartners("CUSTOMER");
  const { data: vendorsData, isLoading: loadingVendors } = usePartners("VENDOR");
  
  const all = allData?.data ?? [];
  const customers = customersData?.data ?? [];
  const vendors = vendorsData?.data ?? [];

  if (loadingAll) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const renderTable = (partners: typeof all) => {
    if (partners.length === 0) {
      return (
        <Empty>
          <EmptyTitle>No partners</EmptyTitle>
          <EmptyDescription>Create your first partner to get started</EmptyDescription>
        </Empty>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Payment Terms</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell className="font-medium">{partner.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{partner.type}</Badge>
              </TableCell>
              <TableCell>{partner.email || "-"}</TableCell>
              <TableCell>{partner.phone || "-"}</TableCell>
              <TableCell>{partner.paymentTermDays} days</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
            <p className="text-muted-foreground mt-1">
              Manage customers and vendors
            </p>
          </div>
        </div>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Partner
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderTable(all)}
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          {renderTable(customers)}
        </TabsContent>
        <TabsContent value="vendors" className="mt-4">
          {renderTable(vendors)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnersPage;

