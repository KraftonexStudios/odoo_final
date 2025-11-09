"use server";
import { client } from "@/lib/prisma/client";
import { PurchaseOrderStatus } from "@prisma/client/index.js";
import { onAuthenticatedUser } from "@/actions/auth.action";

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && typeof (value as any).toNumber === "function") {
    return (value as any).toNumber();
  }
  return Number(value);
};

function serializePO(po: any) {
  if (!po) return po;
  return {
    id: po.id,
    orderNumber: po.orderNumber,
    projectId: po.projectId,
    vendorId: po.vendorId,
    orderDate: po.orderDate ? new Date(po.orderDate) : null,
    expectedDate: po.expectedDate ? new Date(po.expectedDate) : null,
    receivedDate: po.receivedDate ? new Date(po.receivedDate) : null,
    status: po.status,
    subtotal: toNumber(po.subtotal),
    taxAmount: toNumber(po.taxAmount),
    totalAmount: toNumber(po.totalAmount),
    paymentTerms: po.paymentTerms,
    deliveryAddress: po.deliveryAddress,
    notes: po.notes,
    createdAt: po.createdAt ? new Date(po.createdAt) : null,
    updatedAt: po.updatedAt ? new Date(po.updatedAt) : null,
    vendor: po.vendor ? {
      id: po.vendor.id,
      name: po.vendor.name,
      email: po.vendor.email,
      phone: po.vendor.phone,
    } : null,
  };
}

export async function onGetPurchaseOrdersByProject(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const orders = await client.purchaseOrder.findMany({
      where: { projectId },
      include: {
        vendor: true,
        lines: true,
      },
      orderBy: { orderDate: "desc" },
    });
    return {
      status: 200,
      data: orders.map((order) => ({
        ...serializePO(order),
        lines: order.lines?.map((line: any) => ({
          ...line,
          quantity: toNumber(line.quantity),
          unitPrice: toNumber(line.unitPrice),
          taxRate: toNumber(line.taxRate),
          subtotal: toNumber(line.subtotal),
          totalAmount: toNumber(line.totalAmount),
        })),
      })),
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to fetch purchase orders" };
  }
}

type POLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

type CreatePOInput = {
  projectId: number;
  vendorId: number;
  expectedDate?: Date;
  lines: POLine[];
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
};

async function nextPONumber() {
  const last = await client.purchaseOrder.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const n = (last?.id ?? 0) + 1;
  return `PO-${String(n).padStart(4, "0")}`;
}

export async function onCreatePurchaseOrder(input: CreatePOInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const po = await client.purchaseOrder.create({
      data: {
        orderNumber: await nextPONumber(),
        projectId: input.projectId,
        vendorId: input.vendorId,
        orderDate: new Date(),
        expectedDate: input.expectedDate,
        status: "DRAFT",
        paymentTerms: input.paymentTerms,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        lines: {
          create: input.lines.map((line, idx) => {
            const subtotal = line.quantity * line.unitPrice;
            const tax = subtotal * ((line.taxRate ?? 0) / 100);
            const total = subtotal + tax;

            return {
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate ?? 0,
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
    const subtotal = po.lines.reduce((sum, line) => sum + toNumber(line.subtotal), 0);
    const taxAmount = po.lines.reduce(
      (sum, line) => sum + (toNumber(line.subtotal) * toNumber(line.taxRate)) / 100,
      0
    );
    const totalAmount = po.lines.reduce((sum, line) => sum + toNumber(line.totalAmount), 0);

    // Update PO with totals
    await client.purchaseOrder.update({
      where: { id: po.id },
      data: {
        subtotal,
        taxAmount,
        totalAmount,
      },
    });

    const updated = await client.purchaseOrder.findUnique({
      where: { id: po.id },
      include: {
        vendor: true,
        lines: true,
      },
    });

    return {
      status: 201,
      data: updated
        ? {
            ...serializePO(updated),
            lines: updated.lines.map((line) => ({
              ...line,
              quantity: toNumber(line.quantity),
              unitPrice: toNumber(line.unitPrice),
              taxRate: toNumber(line.taxRate),
              subtotal: toNumber(line.subtotal),
              totalAmount: toNumber(line.totalAmount),
            })),
          }
        : null,
      message: "Purchase order created",
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to create purchase order" };
  }
}

export async function onUpdatePurchaseOrderStatus({ id, status }: { id: number; status: PurchaseOrderStatus }) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };
    const po = await client.purchaseOrder.update({ where: { id }, data: { status } });
    return { status: 200, data: serializePO(po), message: "Purchase order updated" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to update purchase order" };
  }
}

export async function onDeletePurchaseOrder(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    await client.purchaseOrder.delete({ where: { id } });
    return { status: 200, message: "Purchase order deleted" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to delete purchase order" };
  }
}