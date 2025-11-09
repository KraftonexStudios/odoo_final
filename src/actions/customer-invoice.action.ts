"use server";
import { client as prisma } from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { InvoiceStatus } from "@prisma/client/index.js";
import { revalidatePath } from "next/cache";

function serializeInvoice(inv: any) {
  if (!inv) return inv;
  return {
    ...inv,
    subtotal: inv.subtotal ? Number(inv.subtotal) : 0,
    taxAmount: inv.taxAmount ? Number(inv.taxAmount) : 0,
    discountAmount: inv.discountAmount ? Number(inv.discountAmount) : 0,
    totalAmount: inv.totalAmount ? Number(inv.totalAmount) : 0,
    paidAmount: inv.paidAmount ? Number(inv.paidAmount) : 0,
    balanceAmount: inv.balanceAmount ? Number(inv.balanceAmount) : 0,
    lines: inv.lines?.map((line: any) => ({
      ...line,
      quantity: line.quantity ? Number(line.quantity) : 0,
      unitPrice: line.unitPrice ? Number(line.unitPrice) : 0,
      taxRate: line.taxRate ? Number(line.taxRate) : 0,
      discountRate: line.discountRate ? Number(line.discountRate) : 0,
      subtotal: line.subtotal ? Number(line.subtotal) : 0,
      totalAmount: line.totalAmount ? Number(line.totalAmount) : 0,
    })),
  };
}

export async function onGetInvoicesByProject(projectId: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const invoices = await prisma.customerInvoice.findMany({
      where: { projectId },
      include: {
        customer: true,
        salesOrder: true,
        lines: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    return { status: 200, data: invoices.map(serializeInvoice) };
  } catch (error) {
    console.error("[GET_INVOICES_BY_PROJECT]", error);
    return { status: 500, message: "Failed to fetch invoices" };
  }
}

type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
};

type CreateInvoiceInput = {
  projectId: number;
  customerId: number;
  salesOrderId?: number;
  dueDate: Date;
  lines: InvoiceLine[];
  paymentTerms?: string;
  notes?: string;
};

async function nextInvoiceNumber() {
  const last = await prisma.customerInvoice.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const n = (last?.id ?? 0) + 1;
  return `INV-${String(n).padStart(4, "0")}`;
}

export async function onCreateCustomerInvoice(input: CreateInvoiceInput) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const linesData = input.lines.map((line, idx) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineDiscount = lineSubtotal * (line.discountRate / 100);
      const taxableAmount = lineSubtotal - lineDiscount;
      const lineTax = taxableAmount * (line.taxRate / 100);
      const lineTotal = taxableAmount + lineTax;

      subtotal += lineSubtotal;
      discountAmount += lineDiscount;
      taxAmount += lineTax;

      return {
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        discountRate: line.discountRate,
        subtotal: lineSubtotal,
        totalAmount: lineTotal,
        sortOrder: idx,
      };
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoiceNumber: await nextInvoiceNumber(),
        projectId: input.projectId,
        customerId: input.customerId,
        salesOrderId: input.salesOrderId,
        dueDate: input.dueDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        balanceAmount: totalAmount,
        paymentTerms: input.paymentTerms,
        notes: input.notes,
        status: InvoiceStatus.DRAFT,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: true,
        customer: true,
      },
    });

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return { status: 201, data: serializeInvoice(invoice), message: "Invoice created" };
  } catch (error) {
    console.error("[CREATE_CUSTOMER_INVOICE]", error);
    return { status: 500, message: "Failed to create invoice" };
  }
}

export async function onUpdateInvoiceStatus(id: number, status: InvoiceStatus) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const invoice = await prisma.customerInvoice.update({
      where: { id },
      data: { status },
    });

    return { status: 200, data: serializeInvoice(invoice), message: "Invoice status updated" };
  } catch (error) {
    console.error("[UPDATE_INVOICE_STATUS]", error);
    return { status: 500, message: "Failed to update invoice status" };
  }
}

export async function onDeleteCustomerInvoice(id: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    await prisma.customerInvoice.delete({
      where: { id },
    });

    return { status: 200, message: "Invoice deleted" };
  } catch (error) {
    console.error("[DELETE_INVOICE]", error);
    return { status: 500, message: "Failed to delete invoice" };
  }
}

export async function onRecordPayment(invoiceId: number, amount: number, paymentDate: Date) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      select: { 
        paidAmount: true, 
        totalAmount: true,
        invoiceNumber: true,
        projectId: true,
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    if (!invoice) return { status: 404, message: "Invoice not found" };

    const oldPaidAmount = Number(invoice.paidAmount);
    const newPaidAmount = oldPaidAmount + amount;
    const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;
    const isFullyPaid = newBalanceAmount <= 0;

    const updated = await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        paidDate: isFullyPaid ? paymentDate : undefined,
      },
    });

    // Notify project manager if invoice is fully paid
    if (isFullyPaid && invoice.project?.projectManagerId) {
      const { notifyInvoicePaid } = await import("@/lib/notifications");
      await notifyInvoicePaid(
        invoice.project.projectManagerId,
        invoice.invoiceNumber,
        Number(invoice.totalAmount),
        invoice.projectId
      ).catch((err) => console.error("[NOTIFY_INVOICE_PAID]", err));
    }

    return { status: 200, data: serializeInvoice(updated), message: "Payment recorded" };
  } catch (error) {
    console.error("[RECORD_PAYMENT]", error);
    return { status: 500, message: "Failed to record payment" };
  }
}

