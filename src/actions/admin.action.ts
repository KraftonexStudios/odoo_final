"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { client as prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { normalizeRole } from "@/lib/utils";
import { TaskStatus, UserRole } from "@prisma/client";
import { onAuthenticatedUser } from "@/actions/auth.action";

// ============================================
// USER MANAGEMENT
// ============================================

export const onFetchAllUsers = async () => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      console.error("[ADMIN_FETCH_USERS] User not authenticated");
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[ADMIN_FETCH_USERS] User role:", role);
    
    if (role !== "ADMIN") {
      console.error("[ADMIN_FETCH_USERS] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    // Fetch all users from Clerk
    const clerkUsers = await (await clerkClient()).users.getUserList();
    
    // Fetch all users from Prisma to get hourly rates
    const prismaUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        firstName: true,
        lastName: true,
        hourlyRate: true,
      },
    });

    console.log("[ADMIN_FETCH_USERS] Clerk users fetched:", clerkUsers.data.length);
    console.log("[ADMIN_FETCH_USERS] Prisma users fetched:", prismaUsers.length);

    // Merge data
    const users = clerkUsers.data.map((clerkUser) => {
      const prismaUser = prismaUsers.find((pu) => pu.clerkId === clerkUser.id);
      const role = normalizeRole(clerkUser.publicMetadata.role as string | string[]);
      return {
        id: clerkUser.id,
        prismaId: prismaUser?.id ?? null,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: prismaUser?.firstName || clerkUser.firstName || "",
        lastName: prismaUser?.lastName || clerkUser.lastName || "",
        avatar: clerkUser.imageUrl || "",
        role,
        hourlyRate: prismaUser?.hourlyRate ? Number(prismaUser.hourlyRate) : 0,
        createdAt: clerkUser.createdAt,
      };
    });

    console.log("[ADMIN_FETCH_USERS] Merged users ready:", users.length);
    return { status: 200, data: users };
  } catch (error) {
    console.error("[ADMIN_FETCH_USERS]", error);
    return { status: 500, message: "Internal server error" };
  }
};

export const onUpdateUserRole = async (
  targetUserId: string,
  newRole: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "SALES_FINANCE"
) => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[UPDATE_USER_ROLE] Current user role:", role);
    
    if (role !== "ADMIN") {
      console.error("[UPDATE_USER_ROLE] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    // Get user details from Clerk first
    const clerk = await (await clerkClient()).users.getUser(targetUserId);
    
    // Update user role in Clerk
    await (await clerkClient()).users.updateUser(targetUserId, {
      publicMetadata: { role: newRole },
    });

    // Also update role in Prisma database to keep them in sync
    await prisma.user.upsert({
      where: { id: user.id as number },
      update: { role: newRole as UserRole },
      create: {
        clerkId: targetUserId,
        email: clerk.emailAddresses[0]?.emailAddress || "",
        firstName: clerk.firstName || "",
        lastName: clerk.lastName || "",
        role: newRole as UserRole,
      },
    });

    console.log("[UPDATE_USER_ROLE] Role updated in both Clerk and Prisma for user:", targetUserId);

    revalidatePath("/admin/users");
    return { status: 200, message: "User role updated successfully" };
  } catch (error) {
    console.error("[ADMIN_UPDATE_USER_ROLE]", error);
    return { status: 500, message: "Failed to update user role" };
  }
};

export const onUpdateUserHourlyRate = async (
  targetUserId: string,
  hourlyRate: number
) => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[UPDATE_HOURLY_RATE] Current user role:", role);
    
    if (role !== "ADMIN") {
      console.error("[UPDATE_HOURLY_RATE] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    // Update hourly rate in Prisma
    await prisma.user.upsert({
      where: { clerkId: targetUserId },
      update: { hourlyRate },
      create: {
        clerkId: targetUserId,
        email: "", // Will be updated by webhook
        firstName: "",
        lastName: "",
        hourlyRate,
      },
    });

    revalidatePath("/admin/users");
    return { status: 200, message: "Hourly rate updated successfully" };
  } catch (error) {
    console.error("[ADMIN_UPDATE_HOURLY_RATE]", error);
    return { status: 500, message: "Failed to update hourly rate" };
  }
};

// ============================================
// PROJECT MANAGEMENT
// ============================================

export const onFetchAllProjectsAdmin = async () => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      console.error("[ADMIN_FETCH_PROJECTS] User not authenticated");
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[ADMIN_FETCH_PROJECTS] User role:", role);
    
    if (role !== "ADMIN") {
      console.error("[ADMIN_FETCH_PROJECTS] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        projectManager: {
          select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        tasks: true,
        expenses: true,
        salesOrders: true,
        purchaseOrders: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                clerkId: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            expenses: true,
            salesOrders: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[ADMIN_FETCH_PROJECTS] Projects fetched from DB:", projects.length);

    // Helper function to convert Decimal to number
    const toNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === "number") return value;
      if (typeof value === "string") return Number(value);
      if (typeof value === "object" && typeof value.toNumber === "function") {
        return value.toNumber();
      }
      return Number(value);
    };

    // Serialize data - explicitly list all fields to avoid Decimal objects
    const serialized = projects.map((p) => {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        code: p.code,
        coverImage: p.coverImage ? Buffer.from(p.coverImage).toString("base64") : null,
        type: p.type,
        status: p.status,
        priority: p.priority,
        progressPercentage: p.progressPercentage,
        projectManagerId: p.projectManagerId,
        budgetAmount: toNumber(p.budgetAmount),
        budgetHours: toNumber(p.budgetHours),
        estimatedCost: toNumber(p.estimatedCost),
        estimatedRevenue: toNumber(p.estimatedRevenue),
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
        actualEndDate: p.actualEndDate ? new Date(p.actualEndDate) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
        taskCount: p._count.tasks,
        expenseCount: p._count.expenses,
        soCount: p._count.salesOrders,
        poCount: p._count.purchaseOrders,
        projectManager: p.projectManager ? {
          id: p.projectManager.id,
          clerkId: p.projectManager.clerkId,
          firstName: p.projectManager.firstName,
          lastName: p.projectManager.lastName,
          avatar: p.projectManager.avatar,
        } : null,
        tasks: p.tasks.map((t) => {
          return {
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            description: t.description,
            assignedToId: t.assignedToId,
            assignedBy: t.assignedBy,
            status: t.status,
            priority: t.priority,
            sortOrder: t.sortOrder,
            startDate: t.startDate ? new Date(t.startDate) : null,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
            blockReason: t.blockReason,
            blockedAt: t.blockedAt ? new Date(t.blockedAt) : null,
            estimatedHours: toNumber(t.estimatedHours),
            actualHours: toNumber(t.actualHours),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
          };
        }),
        members: p.members.map((member) => {
          return {
            id: member.id,
            projectId: member.projectId,
            userId: member.userId,
            role: member.role,
            allocationPercentage: member.allocationPercentage,
            hourlyRate: toNumber(member.hourlyRate) ?? 0,
            joinedAt: new Date(member.joinedAt),
            leftAt: member.leftAt ? new Date(member.leftAt) : null,
            user: member.user ? {
              id: member.user.id,
              clerkId: member.user.clerkId,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              avatar: member.user.avatar,
            } : null,
          };
        }),
      };
    });

    console.log("[ADMIN_FETCH_PROJECTS] Serialized projects ready:", serialized.length);
    return { status: 200, data: serialized };
  } catch (error) {
    console.error("[ADMIN_FETCH_ALL_PROJECTS]", error);
    return { status: 500, message: "Internal server error" };
  }
};

// ============================================
// TASK MANAGEMENT
// ============================================

export const onFetchAllTasksAdmin = async () => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      console.error("[ADMIN_FETCH_TASKS] User not authenticated");
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[ADMIN_FETCH_TASKS] User role:", role);
    
    if (role !== "ADMIN") {
      console.error("[ADMIN_FETCH_TASKS] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    const tasks = await prisma.task.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[ADMIN_FETCH_TASKS] Tasks fetched from DB:", tasks.length);

    // Helper function to convert Decimal to number
    const toNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === "number") return value;
      if (typeof value === "string") return Number(value);
      if (typeof value === "object" && typeof value.toNumber === "function") {
        return value.toNumber();
      }
      return Number(value);
    };

    // Serialize data - explicitly list all fields to avoid Decimal objects
    const serialized = tasks.map((t) => {
      return {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description,
        assignedToId: t.assignedToId,
        assignedBy: t.assignedBy,
        status: t.status,
        priority: t.priority,
        sortOrder: t.sortOrder,
        startDate: t.startDate ? new Date(t.startDate) : null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
        blockReason: t.blockReason,
        blockedAt: t.blockedAt ? new Date(t.blockedAt) : null,
        estimatedHours: toNumber(t.estimatedHours),
        actualHours: toNumber(t.actualHours),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
      };
    });

    console.log("[ADMIN_FETCH_TASKS] Serialized tasks ready:", serialized.length);
    return { status: 200, data: serialized };
  } catch (error) {
    console.error("[ADMIN_FETCH_ALL_TASKS]", error);
    return { status: 500, message: "Internal server error" };
  }
};

export const onGetTaskDetailsAdmin = async (taskId: string) => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[ADMIN_GET_TASK_DETAILS] User role:", role);
    
    if (role !== "ADMIN") {
      console.error("[ADMIN_GET_TASK_DETAILS] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!task) {
      return { status: 404, message: "Task not found" };
    }

    // Helper function to convert Decimal to number
    const toNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === "number") return value;
      if (typeof value === "string") return Number(value);
      if (typeof value === "object" && typeof value.toNumber === "function") {
        return value.toNumber();
      }
      return Number(value);
    };

    // Serialize data - explicitly list all fields to avoid Decimal objects
    const serialized = {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      assignedToId: task.assignedToId,
      assignedBy: task.assignedBy,
      status: task.status,
      priority: task.priority,
      sortOrder: task.sortOrder,
      startDate: task.startDate ? new Date(task.startDate) : null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      blockReason: task.blockReason,
      blockedAt: task.blockedAt ? new Date(task.blockedAt) : null,
      estimatedHours: toNumber(task.estimatedHours),
      actualHours: toNumber(task.actualHours),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      deletedAt: task.deletedAt ? new Date(task.deletedAt) : null,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        clerkId: task.assignedTo.clerkId,
        firstName: task.assignedTo.firstName,
        lastName: task.assignedTo.lastName,
        avatar: task.assignedTo.avatar,
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
        description: task.project.description,
        code: task.project.code,
        type: task.project.type,
        status: task.project.status,
        priority: task.project.priority,
        progressPercentage: task.project.progressPercentage,
        projectManagerId: task.project.projectManagerId,
        budgetAmount: toNumber(task.project.budgetAmount),
        budgetHours: toNumber(task.project.budgetHours),
        estimatedCost: toNumber(task.project.estimatedCost),
        estimatedRevenue: toNumber(task.project.estimatedRevenue),
        startDate: task.project.startDate ? new Date(task.project.startDate) : null,
        endDate: task.project.endDate ? new Date(task.project.endDate) : null,
        actualEndDate: task.project.actualEndDate ? new Date(task.project.actualEndDate) : null,
        createdAt: new Date(task.project.createdAt),
        updatedAt: new Date(task.project.updatedAt),
        deletedAt: task.project.deletedAt ? new Date(task.project.deletedAt) : null,
        coverImage: task.project.coverImage ? Buffer.from(task.project.coverImage).toString("base64") : null,
      } : null,
    };

    return { status: 200, data: serialized };
  } catch (error) {
    console.error("[ADMIN_GET_TASK_DETAILS]", error);
    return { status: 500, message: "Internal server error" };
  }
};

// ============================================
// DASHBOARD STATS
// ============================================

export const onFetchDashboardStats = async () => {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      console.error("[ADMIN_FETCH_DASHBOARD_STATS] User not authenticated");
      return { status: 401, message: "Unauthorized" };
    }

    // Check if user is admin
    const role = user.role;
    
    console.log("[ADMIN_FETCH_DASHBOARD_STATS] User role:", role);
    
    if (role !== "ADMIN") {
      console.error("[ADMIN_FETCH_DASHBOARD_STATS] User is not admin:", role);
      return { status: 403, message: "Forbidden - Admin only" };
    }

    // Fetch all stats in parallel
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalExpenses,
      totalUsers,
      projectsByStatus,
      tasksByPriority,
      recentActivities,
    ] = await Promise.all([
      // Projects
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { status: "IN_PROGRESS", deletedAt: null } }),
      prisma.project.count({ where: { status: "COMPLETED", deletedAt: null } }),
      
      // Tasks
      prisma.task.count(),
      prisma.task.count({ where: { status: TaskStatus.DONE } }),
      prisma.task.count({
        where: {
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
      
      // Financials
      prisma.expense.count(),
      
      // Users
      prisma.user.count(),
      
      // Aggregations
      prisma.project.groupBy({
        by: ["status"],
        _count: true,
        where: { deletedAt: null },
      }),
      prisma.task.groupBy({
        by: ["priority"],
        _count: true,
      }),
      
      // Recent activities (last 10 projects)
      prisma.project.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      }),
    ]);

    // Calculate financial totals
    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true, taxAmount: true },
    });

    const stats = {
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        totalExpenses,
        totalUsers,
      },
      financials: {
        totalExpenseAmount: expenses._sum.amount ? Number(expenses._sum.amount) : 0,
        totalExpenseTax: expenses._sum.taxAmount ? Number(expenses._sum.taxAmount) : 0,
      },
      projectsByStatus: projectsByStatus.map((p: any) => ({
        status: p.status,
        count: p._count,
      })),
      tasksByPriority: tasksByPriority.map((t: any) => ({
        priority: t.priority,
        count: t._count,
      })),
      recentActivities: recentActivities.map((a: any) => ({
        ...a,
        updatedAt: new Date(a.updatedAt),
      })),
    };

    return { status: 200, data: stats };
  } catch (error) {
    console.error("[ADMIN_FETCH_DASHBOARD_STATS]", error);
    return { status: 500, message: "Internal server error" };
  }
};

