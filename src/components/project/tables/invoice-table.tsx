"use client";

import { useState } from "react";
import type { InvoiceStatus } from "@prisma/client/index-browser";
import { useUpdateInvoiceStatus, useDeleteInvoice, useRecordInvoicePayment } from "@/hooks/invoices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  customer?: {
    name?: string | null;
  };
};

const STATUS_OPTIONS: InvoiceStatus[] = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];

export const InvoicesTable = ({ projectId, invoices }: { projectId: number; invoices: Invoice[] }) => {
  const { mutate: updateStatus } = useUpdateInvoiceStatus(projectId);
  const { mutate: deleteInvoice, isPending: deleting } = useDeleteInvoice(projectId);
  const { mutate: recordPayment, isPending: recording } = useRecordInvoicePayment(projectId);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount.toFixed(2));
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;
    const amountNumber = parseFloat(paymentAmount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) return;

    recordPayment(
      {
        invoiceId: selectedInvoice.id,
        amount: amountNumber,
        paymentDate: new Date(paymentDate),
      },
      {
        onSuccess: () => {
          setPaymentDialogOpen(false);
        },
      }
    );
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "PP");
  };

  const getBalanceBadgeVariant = (balance: number) => {
    if (balance <= 0) return "default";
    if (balance < 50) return "secondary";
    return "outline";
  };

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
            <TableHead>Due</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-[70px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.customer?.name || "-"}</TableCell>
            <TableCell>
                <Select
                  defaultValue={invoice.status}
                  onValueChange={(value) =>
                    updateStatus({ id: invoice.id, status: value as InvoiceStatus })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </TableCell>
              <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell className="text-right font-mono">${invoice.totalAmount.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <Badge variant={getBalanceBadgeVariant(invoice.balanceAmount)}>
                  ${invoice.balanceAmount.toFixed(2)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        // Generate and download invoice PDF
                        const invoiceData = {
                          ...invoice,
                          lines: invoice || [],
                        };
                        const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${invoice.invoiceNumber}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        // TODO: Replace with actual PDF generation
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openPaymentDialog(invoice)}
                      disabled={invoice.balanceAmount <= 0}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteInvoice(invoice.id)}
                      disabled={deleting}
                      className="text-red-600 focus:text-red-600"
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

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={recording || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoicesTable;