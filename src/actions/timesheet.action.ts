"use server";
import { client as prisma } from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { TimesheetStatus } from "@prisma/client/index.js";
import { revalidatePath } from "next/cache";
import { notifyTimesheetStatus } from "@/lib/notifications";

function serializeTimesheet(t: any) {
  if (!t) return t;
  return {
    ...t,
    hours: t.hours ? Number(t.hours) : 0,
    hourlyRate: t.hourlyRate ? Number(t.hourlyRate) : 0,
    cost: t.cost ? Number(t.cost) : 0,
    billableAmount: t.billableAmount ? Number(t.billableAmount) : 0,
  };
}

export async function onGetTimesheetsByProject(projectId: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const timesheets = await prisma.timesheet.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return { status: 200, data: timesheets.map(serializeTimesheet) };
  } catch (error) {
    console.error("[GET_TIMESHEETS_BY_PROJECT]", error);
    return { status: 500, message: "Failed to fetch timesheets" };
  }
}

export async function onGetTimesheetsByTask(taskId: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const timesheets = await prisma.timesheet.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return { status: 200, data: timesheets.map(serializeTimesheet) };
  } catch (error) {
    console.error("[GET_TIMESHEETS_BY_TASK]", error);
    return { status: 500, message: "Failed to fetch timesheets" };
  }
}

export async function onGetMyTimesheets(startDate?: Date, endDate?: Date) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) return { status: 404, message: "User not found" };

    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId: user.id,
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return { status: 200, data: timesheets.map(serializeTimesheet) };
  } catch (error) {
    console.error("[GET_MY_TIMESHEETS]", error);
    return { status: 500, message: "Failed to fetch timesheets" };
  }
}

type CreateTimesheetInput = {
  projectId: number;
  taskId?: number;
  date: Date;
  hours: number;
  description?: string;
  isBillable: boolean;
};

export async function onCreateTimesheet(input: CreateTimesheetInput) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, hourlyRate: true },
    });

    if (!user) return { status: 404, message: "User not found" };

    const cost = input.hours * Number(user.hourlyRate);
    const billableAmount = input.isBillable ? cost : 0;

    const timesheet = await prisma.timesheet.create({
      data: {
        projectId: input.projectId,
        taskId: input.taskId,
        userId: user.id,
        date: input.date,
        hours: input.hours,
        description: input.description,
        isBillable: input.isBillable,
        hourlyRate: user.hourlyRate,
        cost,
        billableAmount,
        status: TimesheetStatus.SUBMITTED,
      },
    });

    // Update task actual hours if taskId provided
    if (input.taskId) {
      await prisma.task.update({
        where: { id: input.taskId },
        data: {
          actualHours: {
            increment: input.hours,
          },
        },
      });
    }

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return { status: 201, data: serializeTimesheet(timesheet), message: "Timesheet logged" };
  } catch (error) {
    console.error("[CREATE_TIMESHEET]", error);
    return { status: 500, message: "Failed to create timesheet" };
  }
}

export async function onUpdateTimesheet(id: number, input: Partial<CreateTimesheetInput>) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        ...(input.date && { date: input.date }),
        ...(input.hours !== undefined && { hours: input.hours }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isBillable !== undefined && { isBillable: input.isBillable }),
      },
    });

    return { status: 200, data: serializeTimesheet(timesheet), message: "Timesheet updated" };
  } catch (error) {
    console.error("[UPDATE_TIMESHEET]", error);
    return { status: 500, message: "Failed to update timesheet" };
  }
}

export async function onDeleteTimesheet(id: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      select: { taskId: true, hours: true },
    });

    await prisma.timesheet.delete({
      where: { id },
    });

    // Decrement task actual hours if taskId exists
    if (timesheet?.taskId) {
      await prisma.task.update({
        where: { id: timesheet.taskId },
        data: {
          actualHours: {
            decrement: Number(timesheet.hours),
          },
        },
      });
    }

    return { status: 200, message: "Timesheet deleted" };
  } catch (error) {
    console.error("[DELETE_TIMESHEET]", error);
    return { status: 500, message: "Failed to delete timesheet" };
  }
}

// Approval workflow
export async function onApproveTimesheet(id: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) return { status: 404, message: "User not found" };
    
    // Only ADMIN and PROJECT_MANAGER can approve
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can approve timesheets" };
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      select: { userId: true, hours: true, projectId: true },
    });

    if (!timesheet) return { status: 404, message: "Timesheet not found" };

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.APPROVED,
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    });

    // Notify the user who submitted the timesheet
    if (timesheet.userId) {
      await notifyTimesheetStatus(
        timesheet.userId,
        "APPROVED",
        Number(timesheet.hours),
        timesheet.projectId
      ).catch((err) => console.error("[NOTIFY_TIMESHEET_APPROVED]", err));
    }

    return { status: 200, data: serializeTimesheet(updatedTimesheet), message: "Timesheet approved" };
  } catch (error) {
    console.error("[APPROVE_TIMESHEET]", error);
    return { status: 500, message: "Failed to approve timesheet" };
  }
}

export async function onRejectTimesheet(id: number, reason: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) return { status: 404, message: "User not found" };
    
    // Only ADMIN and PROJECT_MANAGER can reject
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can reject timesheets" };
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      select: { userId: true, hours: true, projectId: true },
    });

    if (!timesheet) return { status: 404, message: "Timesheet not found" };

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.REJECTED,
        rejectedReason: reason,
      },
    });

    // Notify the user who submitted the timesheet
    if (timesheet.userId) {
      await notifyTimesheetStatus(
        timesheet.userId,
        "REJECTED",
        Number(timesheet.hours),
        timesheet.projectId
      ).catch((err) => console.error("[NOTIFY_TIMESHEET_REJECTED]", err));
    }

    return { status: 200, data: serializeTimesheet(updatedTimesheet), message: "Timesheet rejected" };
  } catch (error) {
    console.error("[REJECT_TIMESHEET]", error);
    return { status: 500, message: "Failed to reject timesheet" };
  }
}

export async function onGetPendingTimesheets(projectId?: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const timesheets = await prisma.timesheet.findMany({
      where: {
        status: TimesheetStatus.SUBMITTED,
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
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return { status: 200, data: timesheets.map(serializeTimesheet) };
  } catch (error) {
    console.error("[GET_PENDING_TIMESHEETS]", error);
    return { status: 500, message: "Failed to fetch pending timesheets" };
  }
}

