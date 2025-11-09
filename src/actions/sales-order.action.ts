"use server";
import { client } from "@/lib/prisma/client";
import { SalesOrderStatus } from "@prisma/client/index.js";
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

function serializeSO(so: any) {
  if (!so) return so;
  return {
    id: so.id,
    orderNumber: so.orderNumber,
    projectId: so.projectId,
    customerId: so.customerId,
    orderDate: so.orderDate ? new Date(so.orderDate) : null,
    validUntil: so.validUntil ? new Date(so.validUntil) : null,
    confirmedDate: so.confirmedDate ? new Date(so.confirmedDate) : null,
    status: so.status,
    subtotal: toNumber(so.subtotal),
    taxAmount: toNumber(so.taxAmount),
    discountAmount: toNumber(so.discountAmount),
    totalAmount: toNumber(so.totalAmount),
    paymentTerms: so.paymentTerms,
    deliveryTerms: so.deliveryTerms,
    notes: so.notes,
    createdAt: so.createdAt ? new Date(so.createdAt) : null,
    updatedAt: so.updatedAt ? new Date(so.updatedAt) : null,
    customer: so.customer ? {
      id: so.customer.id,
      name: so.customer.name,
      email: so.customer.email,
      phone: so.customer.phone,
    } : null,
  };
}

export async function onGetSalesOrdersByProject(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const orders = await client.salesOrder.findMany({
      where: { projectId },
      include: {
        customer: true,
        lines: true,
      },
      orderBy: { orderDate: "desc" },
    });
    return {
      status: 200,
      data: orders.map((order) => ({
        ...serializeSO(order),
        lines: order.lines?.map((line: any) => ({
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
    return { status: 500, message: "Failed to fetch sales orders" };
  }
}

type SOLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
};

type CreateSOInput = {
  projectId: number;
  customerId: number;
  validUntil?: Date;
  lines: SOLine[];
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
};

async function nextSONumber() {
  const last = await client.salesOrder.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const n = (last?.id ?? 0) + 1;
  return `SO-${String(n).padStart(4, "0")}`;
}

export async function onCreateSalesOrder(input: CreateSOInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const so = await client.salesOrder.create({
      data: {
        orderNumber: await nextSONumber(),
        projectId: input.projectId,
        customerId: input.customerId,
        orderDate: new Date(),
        validUntil: input.validUntil,
        status: "DRAFT",
        paymentTerms: input.paymentTerms,
        deliveryTerms: input.deliveryTerms,
        notes: input.notes,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
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
    const subtotal = so.lines.reduce((sum, line) => sum + Number(line.subtotal), 0);
    const taxAmount = so.lines.reduce(
      (sum, line) => sum + (Number(line.subtotal) * Number(line.taxRate)) / 100,
      0
    );
    const discountAmount = so.lines.reduce(
      (sum, line) => sum + (Number(line.subtotal) * Number(line.discountRate)) / 100,
      0
    );
    const totalAmount = so.lines.reduce((sum, line) => sum + Number(line.totalAmount), 0);

    // Update SO with totals
    await client.salesOrder.update({
      where: { id: so.id },
      data: {
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
      },
    });

    const updated = await client.salesOrder.findUnique({
      where: { id: so.id },
      include: {
        customer: true,
        lines: true,
      },
    });

    return {
      status: 201,
      data: updated
        ? {
            ...serializeSO(updated),
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
      message: "Sales order created",
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to create sales order" };
  }
}

export async function onUpdateSalesOrderStatus({ id, status }: { id: number; status: SalesOrderStatus }) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };
    await client.salesOrder.update({ where: { id }, data: { status } });
    const so = await client.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
      },
    });
    return {
      status: 200,
      data: so
        ? {
            ...serializeSO(so),
            lines: so.lines.map((line) => ({
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
      message: "Sales order updated",
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to update sales order" };
  }
}

export async function onDeleteSalesOrder(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    await client.salesOrder.delete({ where: { id } });
    return { status: 200, message: "Sales order deleted" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to delete sales order" };
  }
}