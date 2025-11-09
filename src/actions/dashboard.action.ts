"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { client as prisma } from "@/lib/prisma/client";
import { TaskStatus } from "@prisma/client";
import { normalizeRole } from "@/lib/utils";

// ============================================
// PROJECT MANAGER DASHBOARD
// ============================================

export const onFetchProjectManagerDashboard = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { status: 401, message: "Unauthorized" };
    }

    // Verify role
    const user = await (await clerkClient()).users.getUser(userId);
    const role = normalizeRole(user.publicMetadata.role as string | string[]);
    
    if (role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Project Manager only" };
    }

    const [projects, pendingExpenses, taskStats, overdueTasks] = await Promise.all([
      prisma.project.findMany({
        where: {
          projectManager: {
            clerkId: userId,
          },
          deletedAt: null,
        },
        include: {
          tasks: true,
          expenses: {
            where: { status: "PENDING" },
          },
          _count: {
            select: {
              tasks: true,
              expenses: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.expense.count({
        where: {
          project: {
            projectManager: {
              clerkId: userId,
            },
          },
          status: "PENDING",
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: {
          project: {
            projectManager: {
              clerkId: userId,
            },
          },
        },
        _count: true,
      }),
      prisma.task.count({
        where: {
          project: {
            projectManager: {
              clerkId: userId,
            },
          },
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: TaskStatus.DONE,
        },
        },
      }),
    ]);

    const serialized = projects.map((p) => ({
      ...p,
      budgetAmount: p.budgetAmount ? Number(p.budgetAmount) : null,
      budgetHours: p.budgetHours ? Number(p.budgetHours) : null,
      estimatedCost: p.estimatedCost ? Number(p.estimatedCost) : null,
      estimatedRevenue: p.estimatedRevenue ? Number(p.estimatedRevenue) : null,
      createdAt: p.createdAt ? new Date(p.createdAt) : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : null,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
      tasks: p.tasks.map((t) => ({
        ...t,
        estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
        actualHours: t.actualHours ? Number(t.actualHours) : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : null,
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      })),
      expenses: p.expenses.map((e) => ({
        ...e,
        amount: e.amount ? Number(e.amount) : 0,
        taxAmount: e.taxAmount ? Number(e.taxAmount) : 0,
        expenseDate: e.expenseDate ? new Date(e.expenseDate) : null,
        createdAt: e.createdAt ? new Date(e.createdAt) : null,
      })),
    }));

    return {
      status: 200,
      data: {
        projects: serialized,
        stats: {
          totalProjects: projects.length,
          activeProjects: projects.filter((p) => p.status === "IN_PROGRESS").length,
          pendingExpenses,
          overdueTasks,
          taskStats: taskStats.map((t) => ({
            status: t.status,
            count: t._count,
          })),
        },
      },
    };
  } catch (error) {
    console.error("[PM_DASHBOARD]", error);
    return { status: 500, message: "Internal server error" };
  }
};

// ============================================
// TEAM MEMBER DASHBOARD
// ============================================

export const onFetchTeamMemberDashboard = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { status: 401, message: "Unauthorized" };
    }

    // Verify role
    const user = await (await clerkClient()).users.getUser(userId);
    const role = normalizeRole(user.publicMetadata.role as string | string[]);
    
    if (role !== "TEAM_MEMBER") {
      return { status: 403, message: "Forbidden - Team Member only" };
    }

    // Fetch dashboard resources in parallel
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [tasks, expenses, hoursThisWeek] = await Promise.all([
      prisma.task.findMany({
        where: {
          assignedTo: {
            clerkId: userId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.expense.findMany({
        where: {
          user: {
            clerkId: userId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.task.aggregate({
        where: {
          assignedTo: {
            clerkId: userId,
          },
          updatedAt: {
            gte: weekStart,
          },
        },
        _sum: {
          actualHours: true,
        },
      }),
    ]);

    // Get task statistics
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.NEW).length;
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE
    ).length;

    const serializedTasks = tasks.map((t) => ({
      ...t,
      estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
      actualHours: t.actualHours ? Number(t.actualHours) : null,
      createdAt: t.createdAt ? new Date(t.createdAt) : null,
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
    }));

    const serializedExpenses = expenses.map((e) => ({
      ...e,
      amount: e.amount ? Number(e.amount) : 0,
      taxAmount: e.taxAmount ? Number(e.taxAmount) : 0,
      expenseDate: e.expenseDate ? new Date(e.expenseDate) : null,
      createdAt: e.createdAt ? new Date(e.createdAt) : null,
    }));

    return {
      status: 200,
      data: {
        tasks: serializedTasks,
        expenses: serializedExpenses,
        stats: {
          todoTasks,
          inProgressTasks,
          completedTasks,
          overdueTasks,
          hoursThisWeek: hoursThisWeek._sum.actualHours
            ? Number(hoursThisWeek._sum.actualHours)
            : 0,
        },
      },
    };
  } catch (error) {
    console.error("[TM_DASHBOARD]", error);
    return { status: 500, message: "Internal server error" };
  }
};

// ============================================
// SALES / FINANCE DASHBOARD
// ============================================

export const onFetchSalesFinanceDashboard = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { status: 401, message: "Unauthorized" };
    }

    // Verify role
    const user = await (await clerkClient()).users.getUser(userId);
    const role = normalizeRole(user.publicMetadata.role as string | string[]);
    
    if (role !== "SALES_FINANCE") {
      return { status: 403, message: "Forbidden - Sales/Finance only" };
    }

    // Fetch all projects with financial data
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        budgetAmount: true,
        _count: {
          select: {
            invoices: true,
            salesOrders: true,
            purchaseOrders: true,
            expenses: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get financial statistics
    const [invoiceStats, salesOrderStats, purchaseOrderStats, expenseStats] =
      await Promise.all([
        prisma.invoice.aggregate({
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.salesOrder.aggregate({
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.purchaseOrder.aggregate({
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    // Get recent financial documents
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const recentSalesOrders = await prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const serializedProjects = projects.map((p) => ({
      ...p,
      budgetAmount: p.budgetAmount ? Number(p.budgetAmount) : null,
    }));

    return {
      status: 200,
      data: {
        projects: serializedProjects,
        stats: {
          totalInvoices: invoiceStats._count,
          totalInvoiceAmount: invoiceStats._sum.totalAmount
            ? Number(invoiceStats._sum.totalAmount)
            : 0,
          totalSalesOrders: salesOrderStats._count,
          totalSalesOrderAmount: salesOrderStats._sum.totalAmount
            ? Number(salesOrderStats._sum.totalAmount)
            : 0,
          totalPurchaseOrders: purchaseOrderStats._count,
          totalPurchaseOrderAmount: purchaseOrderStats._sum.totalAmount
            ? Number(purchaseOrderStats._sum.totalAmount)
            : 0,
          totalExpenses: expenseStats._count,
          totalExpenseAmount: expenseStats._sum.amount
            ? Number(expenseStats._sum.amount)
            : 0,
        },
        recentInvoices: recentInvoices.map((i) => ({
          ...i,
          subtotal: i.subtotal ? Number(i.subtotal) : 0,
          taxAmount: i.taxAmount ? Number(i.taxAmount) : 0,
          totalAmount: i.totalAmount ? Number(i.totalAmount) : 0,
          invoiceDate: i.invoiceDate ? new Date(i.invoiceDate) : null,
          dueDate: i.dueDate ? new Date(i.dueDate) : null,
          createdAt: i.createdAt ? new Date(i.createdAt) : null,
        })),
        recentSalesOrders: recentSalesOrders.map((so) => ({
          ...so,
          subtotal: so.subtotal ? Number(so.subtotal) : 0,
          taxAmount: so.taxAmount ? Number(so.taxAmount) : 0,
          totalAmount: so.totalAmount ? Number(so.totalAmount) : 0,
          orderDate: so.orderDate ? new Date(so.orderDate) : null,
          expectedDeliveryDate: so.expectedDeliveryDate
            ? new Date(so.expectedDeliveryDate)
            : null,
          createdAt: so.createdAt ? new Date(so.createdAt) : null,
        })),
      },
    };
  } catch (error) {
    console.error("[SF_DASHBOARD]", error);
    return { status: 500, message: "Internal server error" };
  }
};

