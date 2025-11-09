"use server";
import { client as prisma } from "@/lib/prisma/client";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { revalidatePath } from "next/cache";

export async function onGetMilestonesByProject(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: "asc" },
    });

    return {
      status: 200,
      data: milestones.map((m) => ({
        ...m,
        dueDate: new Date(m.dueDate),
        completedAt: m.completedAt ? new Date(m.completedAt) : null,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      })),
    };
  } catch (error) {
    console.error("[GET_MILESTONES]", error);
    return { status: 500, message: "Failed to fetch milestones" };
  }
}

type CreateMilestoneInput = {
  projectId: number;
  title: string;
  description?: string;
  dueDate: Date;
};

export async function onCreateMilestone(input: CreateMilestoneInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Only ADMIN and PROJECT_MANAGER can create milestones
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can create milestones" };
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        isCompleted: false,
      },
    });

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return {
      status: 201,
      data: {
        ...milestone,
        dueDate: new Date(milestone.dueDate),
        completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
        createdAt: new Date(milestone.createdAt),
        updatedAt: new Date(milestone.updatedAt),
      },
      message: "Milestone created",
    };
  } catch (error) {
    console.error("[CREATE_MILESTONE]", error);
    return { status: 500, message: "Failed to create milestone" };
  }
}

export async function onUpdateMilestone(
  id: number,
  input: Partial<CreateMilestoneInput> & { status?: string }
) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Only ADMIN and PROJECT_MANAGER can update milestones
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can update milestones" };
    }

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.dueDate && { dueDate: input.dueDate }),
      },
    });

    revalidatePath(`/dashboard/projects/${milestone.projectId}`);
    return {
      status: 200,
      data: {
        ...milestone,
        dueDate: new Date(milestone.dueDate),
        completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
        createdAt: new Date(milestone.createdAt),
        updatedAt: new Date(milestone.updatedAt),
      },
      message: "Milestone updated",
    };
  } catch (error) {
    console.error("[UPDATE_MILESTONE]", error);
    return { status: 500, message: "Failed to update milestone" };
  }
}

export async function onDeleteMilestone(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Only ADMIN and PROJECT_MANAGER can delete milestones
    if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
      return { status: 403, message: "Forbidden - Only admins and project managers can delete milestones" };
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      select: { projectId: true },
    });

    await prisma.milestone.delete({
      where: { id },
    });

    if (milestone) {
      revalidatePath(`/dashboard/projects/${milestone.projectId}`);
    }
    return { status: 200, message: "Milestone deleted" };
  } catch (error) {
    console.error("[DELETE_MILESTONE]", error);
    return { status: 500, message: "Failed to delete milestone" };
  }
}

