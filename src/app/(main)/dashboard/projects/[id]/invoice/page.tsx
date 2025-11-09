"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useInvoices } from "@/hooks/invoices";
import InvoicesTable from "@/components/project/tables/invoice-table";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { InvoiceSheetForm } from "@/components/forms/invoice";

const InvoicesPage = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const { data, isLoading } = useInvoices(projectId);
  const items = data ?? [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invoices</h1>
          <InvoiceSheetForm
            projectId={projectId}
            trigger={
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Invoice
              </Button>
            }
          />
      </div>
      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No invoices</EmptyTitle>
          <EmptyDescription>Create your first invoice to get started</EmptyDescription>
        </Empty>
      ) : (
        <InvoicesTable projectId={projectId} invoices={items } />
      )}
    </div>
  );
};

export default InvoicesPage;
