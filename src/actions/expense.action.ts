"use server";
import { client } from "@/lib/prisma/client";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client/index.js";
import { auth } from "@clerk/nextjs/server";

function serializeExpense(e: any) {
  if (!e) return e;
  return {
    ...e,
    amount: e.amount ? Number(e.amount) : 0,
    taxAmount: e.taxAmount ? Number(e.taxAmount) : 0,
    totalAmount: e.totalAmount ? Number(e.totalAmount) : 0,
    markupPercentage: e.markupPercentage ? Number(e.markupPercentage) : 0,
    billableAmount: e.billableAmount ? Number(e.billableAmount) : 0,
  };
}

export async function onGetExpensesByProject(projectId: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const items = await client.expense.findMany({
      where: { projectId },
      orderBy: { expenseDate: "desc" },
    });
    return { status: 200, data: items.map(serializeExpense) };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to fetch expenses" };
  }
}

export async function onGetMyExpenses() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    // Get user from database
    const user = await client.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) return { status: 404, message: "User not found" };

    const items = await client.expense.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    });
    return { status: 200, data: items.map(serializeExpense) };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to fetch expenses" };
  }
}

type CreateExpenseInput = {
  projectId: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: Date;
  amount: number;
  taxAmount?: number;
  isBillable?: boolean;
  receiptImage?: File | null;
};

async function nextExpenseNumber() {
  const last = await client.expense.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  const n = (last?.id ?? 0) + 1;
  return `EXP-${String(n).padStart(3, "0")}`;
}

export async function onCreateExpense(input: CreateExpenseInput) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    // Get user from database
    const user = await client.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) return { status: 404, message: "User not found" };

    // Handle receipt image
    let receiptBuffer: Buffer | undefined = undefined;
    if (input.receiptImage) {
      const bytes = await input.receiptImage.arrayBuffer();
      receiptBuffer = Buffer.from(bytes);
    }

    const exp = await client.expense.create({
      data: {
        expenseNumber: await nextExpenseNumber(),
        projectId: input.projectId,
        userId: user.id,
        category: input.category,
        description: input.description,
        expenseDate: input.expenseDate,
        amount: input.amount,
        taxAmount: input.taxAmount ?? 0,
        totalAmount: (input.amount ?? 0) + (input.taxAmount ?? 0),
        isBillable: input.isBillable ?? false,
        status: "SUBMITTED",
        receipt: receiptBuffer,
      },
    });
    return { status: 201, data: serializeExpense(exp), message: "Expense created" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to create expense" };
  }
}

export async function onUpdateExpenseStatus({ id, status }: { id: number; status: ExpenseStatus }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const exp = await client.expense.update({ where: { id }, data: { status } });
    return { status: 200, data: serializeExpense(exp), message: "Expense updated" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to update expense" };
  }
}

export async function onDeleteExpense(id: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    await client.expense.delete({ where: { id } });
    return { status: 200, message: "Expense deleted" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to delete expense" };
  }
}

// Approval workflow
export async function onApproveExpense(id: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await client.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) return { status: 404, message: "User not found" };
    
    // Only ADMIN and PROJECT_MANAGER can approve
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can approve expenses" };
    }

    const expense = await client.expense.findUnique({
      where: { id },
      select: { userId: true, totalAmount: true, projectId: true },
    });

    if (!expense) return { status: 404, message: "Expense not found" };

    const updatedExpense = await client.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.APPROVED,
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    });

    // Notify the user who submitted the expense
    if (expense.userId) {
      await notifyExpenseStatus(
        expense.userId,
        "APPROVED",
        Number(expense.totalAmount),
        id,
        expense.projectId
      ).catch((err) => console.error("[NOTIFY_EXPENSE_APPROVED]", err));
    }

    return { status: 200, data: serializeExpense(updatedExpense), message: "Expense approved" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to approve expense" };
  }
}

export async function onRejectExpense(id: number, reason: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await client.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) return { status: 404, message: "User not found" };
    
    // Only ADMIN and PROJECT_MANAGER can reject
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can reject expenses" };
    }

    const expense = await client.expense.findUnique({
      where: { id },
      select: { userId: true, totalAmount: true, projectId: true },
    });

    if (!expense) return { status: 404, message: "Expense not found" };

    const updatedExpense = await client.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        rejectedReason: reason,
      },
    });

    // Notify the user who submitted the expense
    if (expense.userId) {
      await notifyExpenseStatus(
        expense.userId,
        "REJECTED",
        Number(expense.totalAmount),
        id,
        expense.projectId
      ).catch((err) => console.error("[NOTIFY_EXPENSE_REJECTED]", err));
    }

    return { status: 200, data: serializeExpense(updatedExpense), message: "Expense rejected" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to reject expense" };
  }
}

export async function onGetPendingExpenses(projectId?: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const expenses = await client.expense.findMany({
      where: {
        status: ExpenseStatus.SUBMITTED,
        ...(projectId && { projectId }),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { status: 200, data: expenses.map(serializeExpense) };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to fetch pending expenses" };
  }
}