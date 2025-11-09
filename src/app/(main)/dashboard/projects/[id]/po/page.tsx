"use client";
import React from "react";
import { useParams } from "next/navigation";
import { usePurchaseOrders } from "@/hooks/purchase-orders";
import PurchaseOrdersTable from "@/components/project/tables/po-table";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { PurchaseOrderSheetForm } from "@/components/forms/purchase-order";

const PurchaseOrdersPage = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const { data, isLoading } = usePurchaseOrders(projectId);
  const items = data?.data ?? [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
          <PurchaseOrderSheetForm
            projectId={projectId}
            trigger={
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Purchase Order
              </Button>
            }
          />
      </div>
      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No purchase orders</EmptyTitle>
          <EmptyDescription>Create your first purchase order to get started</EmptyDescription>
        </Empty>
      ) : (
        <PurchaseOrdersTable projectId={projectId} items={items as any} />
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
