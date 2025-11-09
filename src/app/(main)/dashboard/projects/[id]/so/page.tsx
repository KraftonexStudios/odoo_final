"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useSalesOrders } from "@/hooks/sales-orders";
import SalesOrdersTable from "@/components/project/tables/so-table";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { SalesOrderSheetForm } from "@/components/forms/sales-order";

const SalesOrdersPage = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const { data, isLoading } = useSalesOrders(projectId);
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
        <h1 className="text-xl font-semibold">Sales Orders</h1>
          <SalesOrderSheetForm
            projectId={projectId}
            trigger={
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Sales Order
              </Button>
            }
          />
      </div>
      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No sales orders</EmptyTitle>
          <EmptyDescription>Create your first sales order to get started</EmptyDescription>
        </Empty>
      ) : (
        <SalesOrdersTable projectId={projectId} salesOrders={items as any} />
      )}
    </div>
  );
};

export default SalesOrdersPage;
