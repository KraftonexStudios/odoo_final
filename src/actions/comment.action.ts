"use server";
import { client as prisma } from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { notifyCommentAdded } from "@/lib/notifications";

export async function onGetCommentsByTask(taskId: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const comments = await prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { status: 200, data: comments };
  } catch (error) {
    console.error("[GET_COMMENTS_BY_TASK]", error);
    return { status: 500, message: "Failed to fetch comments" };
  }
}

export async function onCreateComment(taskId: number, content: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) return { status: 404, message: "User not found" };

    // Get task details for notification
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        assignedToId: true,
        projectId: true,
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Notify task assignee and project manager (if different from commenter)
    if (task) {
      const commenterName = `${comment.user.firstName} ${comment.user.lastName}`;
      const usersToNotify: number[] = [];

      if (task.assignedToId && task.assignedToId !== user.id) {
        usersToNotify.push(task.assignedToId);
      }

      if (task.project.projectManagerId && task.project.projectManagerId !== user.id && !usersToNotify.includes(task.project.projectManagerId)) {
        usersToNotify.push(task.project.projectManagerId);
      }

      // Send notifications to all relevant users
      await Promise.all(
        usersToNotify.map((userId) =>
          notifyCommentAdded(
            userId,
            commenterName,
            task.title,
            task.id,
            task.projectId
          ).catch((err) => console.error("[NOTIFY_COMMENT_ADDED]", err))
        )
      );
    }

    revalidatePath(`/dashboard/projects`);
    return { status: 201, data: comment, message: "Comment added" };
  } catch (error) {
    console.error("[CREATE_COMMENT]", error);
    return { status: 500, message: "Failed to create comment" };
  }
}

export async function onUpdateComment(id: number, content: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return { status: 200, data: comment, message: "Comment updated" };
  } catch (error) {
    console.error("[UPDATE_COMMENT]", error);
    return { status: 500, message: "Failed to update comment" };
  }
}

export async function onDeleteComment(id: number) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { status: 401, message: "Unauthorized" };

    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { status: 200, message: "Comment deleted" };
  } catch (error) {
    console.error("[DELETE_COMMENT]", error);
    return { status: 500, message: "Failed to delete comment" };
  }
}

