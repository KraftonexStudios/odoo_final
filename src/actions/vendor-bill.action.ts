"use server";
import { client as prisma } from "@/lib/prisma/client";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { BillStatus } from "@prisma/client/index.js";
import { revalidatePath } from "next/cache";

function serializeBill(bill: any) {
  if (!bill) return bill;
  return {
    ...bill,
    subtotal: bill.subtotal ? Number(bill.subtotal) : 0,
    taxAmount: bill.taxAmount ? Number(bill.taxAmount) : 0,
    totalAmount: bill.totalAmount ? Number(bill.totalAmount) : 0,
    paidAmount: bill.paidAmount ? Number(bill.paidAmount) : 0,
    balanceAmount: bill.balanceAmount ? Number(bill.balanceAmount) : 0,
    lines: bill.lines?.map((line: any) => ({
      ...line,
      quantity: line.quantity ? Number(line.quantity) : 0,
      unitPrice: line.unitPrice ? Number(line.unitPrice) : 0,
      taxRate: line.taxRate ? Number(line.taxRate) : 0,
      subtotal: line.subtotal ? Number(line.subtotal) : 0,
      totalAmount: line.totalAmount ? Number(line.totalAmount) : 0,
    })),
  };
}

export async function onGetVendorBillsByProject(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const bills = await prisma.vendorBill.findMany({
      where: { projectId },
      include: {
        vendor: true,
        purchaseOrder: true,
        lines: true,
      },
      orderBy: { billDate: "desc" },
    });

    return { status: 200, data: bills.map(serializeBill) };
  } catch (error) {
    console.error("[GET_VENDOR_BILLS]", error);
    return { status: 500, message: "Failed to fetch vendor bills" };
  }
}

type BillLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type CreateVendorBillInput = {
  projectId: number;
  vendorId: number;
  purchaseOrderId?: number;
  vendorReference?: string;
  dueDate: Date;
  lines: BillLine[];
  paymentTerms?: string;
  notes?: string;
};

async function nextBillNumber() {
  const last = await prisma.vendorBill.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const n = (last?.id ?? 0) + 1;
  return `BILL-${String(n).padStart(4, "0")}`;
}

export async function onCreateVendorBill(input: CreateVendorBillInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    let subtotal = 0;
    let taxAmount = 0;

    const linesData = input.lines.map((line, idx) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineTax = lineSubtotal * (line.taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        subtotal: lineSubtotal,
        totalAmount: lineTotal,
        sortOrder: idx,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const bill = await prisma.vendorBill.create({
      data: {
        billNumber: await nextBillNumber(),
        vendorReference: input.vendorReference,
        projectId: input.projectId,
        vendorId: input.vendorId,
        purchaseOrderId: input.purchaseOrderId,
        dueDate: input.dueDate,
        subtotal,
        taxAmount,
        totalAmount,
        balanceAmount: totalAmount,
        paymentTerms: input.paymentTerms,
        notes: input.notes,
        status: BillStatus.DRAFT,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: true,
        vendor: true,
      },
    });

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return { status: 201, data: serializeBill(bill), message: "Vendor bill created" };
  } catch (error) {
    console.error("[CREATE_VENDOR_BILL]", error);
    return { status: 500, message: "Failed to create vendor bill" };
  }
}

export async function onUpdateBillStatus(id: number, status: BillStatus) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const bill = await prisma.vendorBill.update({
      where: { id },
      data: { status },
    });

    return { status: 200, data: serializeBill(bill), message: "Bill status updated" };
  } catch (error) {
    console.error("[UPDATE_BILL_STATUS]", error);
    return { status: 500, message: "Failed to update bill status" };
  }
}

export async function onDeleteVendorBill(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    await prisma.vendorBill.delete({
      where: { id },
    });

    return { status: 200, message: "Vendor bill deleted" };
  } catch (error) {
    console.error("[DELETE_VENDOR_BILL]", error);
    return { status: 500, message: "Failed to delete vendor bill" };
  }
}

export async function onRecordBillPayment(billId: number, amount: number, paymentDate: Date) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const bill = await prisma.vendorBill.findUnique({
      where: { id: billId },
      select: { paidAmount: true, totalAmount: true },
    });

    if (!bill) return { status: 404, message: "Bill not found" };

    const newPaidAmount = Number(bill.paidAmount) + amount;
    const newBalanceAmount = Number(bill.totalAmount) - newPaidAmount;

    const updated = await prisma.vendorBill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount <= 0 ? BillStatus.PAID : BillStatus.PARTIALLY_PAID,
        paidDate: newBalanceAmount <= 0 ? paymentDate : undefined,
      },
    });

    return { status: 200, data: serializeBill(updated), message: "Payment recorded" };
  } catch (error) {
    console.error("[RECORD_BILL_PAYMENT]", error);
    return { status: 500, message: "Failed to record payment" };
  }
}

