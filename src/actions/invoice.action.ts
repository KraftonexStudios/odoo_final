"use server";
import { client } from "@/lib/prisma/client";
import { InvoiceStatus } from "@prisma/client/index.js";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { notifyInvoiceCreated, notifyInvoicePaid } from "@/lib/notifications";

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && typeof (value as any).toNumber === "function") {
    return (value as any).toNumber();
  }
  return Number(value);
};

function serializeInvoice(inv: any) {
  if (!inv) return inv;
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    projectId: inv.projectId,
    customerId: inv.customerId,
    invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
    dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
    status: inv.status,
    subtotal: toNumber(inv.subtotal),
    taxAmount: toNumber(inv.taxAmount),
    discountAmount: toNumber(inv.discountAmount),
    totalAmount: toNumber(inv.totalAmount),
    paidAmount: toNumber(inv.paidAmount),
    balanceAmount: toNumber(inv.balanceAmount),
    paymentTerms: inv.paymentTerms,
    notes: inv.notes,
    createdAt: inv.createdAt ? new Date(inv.createdAt) : null,
    updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : null,
    customer: inv.customer ? {
      id: inv.customer.id,
      name: inv.customer.name,
      email: inv.customer.email,
      phone: inv.customer.phone,
    } : null,
  };
}

export async function onGetInvoicesByProject(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const invoices = await client.customerInvoice.findMany({
      where: { projectId },
      include: {
        customer: true,
        lines: true,
      },
      orderBy: { invoiceDate: "desc" },
    });
    return {
      status: 200,
      data: invoices.map((invoice) => ({
        ...serializeInvoice(invoice),
        lines: invoice.lines?.map((line: any) => ({
          ...line,
          quantity: toNumber(line.quantity),
          unitPrice: toNumber(line.unitPrice),
          taxRate: toNumber(line.taxRate),
          discountRate: toNumber(line.discountRate),
          subtotal: toNumber(line.subtotal),
          totalAmount: toNumber(line.totalAmount),
        })),
      })),
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to fetch invoices" };
  }
}

type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
};

type CreateInvoiceInput = {
  projectId: number;
  customerId: number;
  dueDate: Date;
  lines: InvoiceLine[];
  paymentTerms?: string;
  notes?: string;
};

async function nextInvoiceNumber() {
  const last = await client.customerInvoice.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const n = (last?.id ?? 0) + 1;
  return `INV-${String(n).padStart(4, "0")}`;
}

export async function onCreateInvoice(input: CreateInvoiceInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const invoice = await client.customerInvoice.create({
      data: {
        invoiceNumber: await nextInvoiceNumber(),
        projectId: input.projectId,
        customerId: input.customerId,
        invoiceDate: new Date(),
        dueDate: input.dueDate,
        status: "DRAFT",
        paymentTerms: input.paymentTerms,
        notes: input.notes,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        lines: {
          create: input.lines.map((line, idx) => {
            const subtotal = line.quantity * line.unitPrice;
            const discount = subtotal * ((line.discountRate ?? 0) / 100);
            const taxableAmount = subtotal - discount;
            const tax = taxableAmount * ((line.taxRate ?? 0) / 100);
            const total = taxableAmount + tax;

            return {
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate ?? 0,
              discountRate: line.discountRate ?? 0,
              subtotal,
              totalAmount: total,
              sortOrder: idx,
            };
          }),
        },
      },
      include: { lines: true },
    });

    // Calculate totals
    const subtotal = invoice.lines.reduce((sum, line) => sum + Number(line.subtotal), 0);
    const taxAmount = invoice.lines.reduce(
      (sum, line) => sum + (Number(line.subtotal) * Number(line.taxRate)) / 100,
      0
    );
    const discountAmount = invoice.lines.reduce(
      (sum, line) => sum + (Number(line.subtotal) * Number(line.discountRate)) / 100,
      0
    );
    const totalAmount = invoice.lines.reduce((sum, line) => sum + Number(line.totalAmount), 0);

    // Update invoice with totals
    await client.customerInvoice.update({
      where: { id: invoice.id },
      data: {
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        balanceAmount: totalAmount,
      },
    });

    const updated = await client.customerInvoice.findUnique({
      where: { id: invoice.id },
      include: {
        customer: true,
        lines: true,
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    // Notify project manager about invoice creation
    if (updated && updated.project?.projectManagerId) {
      await notifyInvoiceCreated(
        updated.project.projectManagerId,
        updated.invoiceNumber,
        Number(updated.totalAmount),
        updated.projectId
      ).catch((err) => console.error("[NOTIFY_INVOICE_CREATED]", err));
    }

    return {
      status: 201,
      data: updated
        ? {
            ...serializeInvoice(updated),
            lines: updated.lines.map((line) => ({
              ...line,
              quantity: toNumber(line.quantity),
              unitPrice: toNumber(line.unitPrice),
              taxRate: toNumber(line.taxRate),
              discountRate: toNumber(line.discountRate),
              subtotal: toNumber(line.subtotal),
              totalAmount: toNumber(line.totalAmount),
            })),
          }
        : null,
      message: "Invoice created",
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to create invoice" };
  }
}

export async function onUpdateInvoiceStatus({ id, status }: { id: number; status: InvoiceStatus }) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };
    
    const oldInvoice = await client.customerInvoice.findUnique({
      where: { id },
      select: { status: true, projectId: true },
    });

    await client.customerInvoice.update({ where: { id }, data: { status } });
    const inv = await client.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    // Notify if invoice status changed to PAID
    if (inv && oldInvoice && oldInvoice.status !== "PAID" && status === "PAID" && inv.project?.projectManagerId) {
      await notifyInvoicePaid(
        inv.project.projectManagerId,
        inv.invoiceNumber,
        Number(inv.totalAmount),
        inv.projectId
      ).catch((err) => console.error("[NOTIFY_INVOICE_PAID]", err));
    }

    return {
      status: 200,
      data: inv
        ? {
            ...serializeInvoice(inv),
            lines: inv.lines.map((line) => ({
              ...line,
              quantity: toNumber(line.quantity),
              unitPrice: toNumber(line.unitPrice),
              taxRate: toNumber(line.taxRate),
              discountRate: toNumber(line.discountRate),
              subtotal: toNumber(line.subtotal),
              totalAmount: toNumber(line.totalAmount),
            })),
          }
        : null,
      message: "Invoice updated",
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to update invoice" };
  }
}

export async function onDeleteInvoice(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    await client.customerInvoice.delete({ where: { id } });
    return { status: 200, message: "Invoice deleted" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to delete invoice" };
  }
}