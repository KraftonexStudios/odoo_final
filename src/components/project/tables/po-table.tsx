"use client";
import React from "react";
import type { PurchaseOrderStatus } from "@prisma/client/index-browser";
import { useUpdatePurchaseOrderStatus, type PurchaseOrderDTO } from "@/hooks/purchase-orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PurchaseOrderRow = PurchaseOrderDTO;

type PurchaseOrdersTableProps = {
  projectId?: number;
  items?: PurchaseOrderRow[];
};

export const PurchaseOrdersTable = ({ projectId, items }: PurchaseOrdersTableProps) => {
  const { mutate: updateStatus } = useUpdatePurchaseOrderStatus();
  const purchaseOrders = items ?? [];
  const STATUSES: PurchaseOrderStatus[] = ["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"];

  if (purchaseOrders.length === 0) {
    return null;
  }

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
        {purchaseOrders.map((po) => (
          <TableRow key={po.id}>
            <TableCell className="font-medium">{po.orderNumber}</TableCell>
            <TableCell>
              <Select
                defaultValue={po.status}
                onValueChange={(v) =>
                  updateStatus({
                    id: po.id,
                    status: v as PurchaseOrderStatus,
                    projectId,
                  })
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">{po.totalAmount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PurchaseOrdersTable;