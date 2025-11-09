"use client";
import React from "react";
import type { SalesOrder, SalesOrderStatus } from "@prisma/client/index-browser";
import { useUpdateSalesOrderStatus } from "@/hooks/sales-orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const SalesOrdersTable = ({ projectId, salesOrders }: { projectId: number; salesOrders: (SalesOrder & { totalAmount: number })[] }) => {
  const { mutate: updateStatus } = useUpdateSalesOrderStatus();
  const STATUSES: SalesOrderStatus[] = ["DRAFT","SENT","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {salesOrders.map((so) => (
          <TableRow key={so.id}>
            <TableCell className="font-medium">{so.orderNumber}</TableCell>
            <TableCell>
              <Select defaultValue={so.status} onValueChange={(v) => updateStatus({ id: so.id, status: v as SalesOrderStatus })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{new Date(so.orderDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">{so.totalAmount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SalesOrdersTable;