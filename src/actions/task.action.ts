"use server";
import { client } from "@/lib/prisma/client";
import { TaskStatus, TaskPriority } from "@prisma/client/index.js";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { notifyTaskAssigned, notifyTaskStatusChanged } from "@/lib/notifications";

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && typeof (value as any).toNumber === "function") {
    return (value as any).toNumber();
  }
  return Number(value);
};

function serializeTask(t: any) {
  if (!t) return t;
  return {
    ...t,
    estimatedHours: toNumber(t.estimatedHours),
    actualHours: toNumber(t.actualHours),
  };
}

export async function onGetTasksByProject(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Check if user has access to this project
    const project = await client.project.findUnique({
      where: { id: projectId },
      select: {
        projectManagerId: true,
        members: {
          where: { userId: user.id, leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!project) return { status: 404, message: "Project not found" };

    // Check access: ADMIN, SALES_FINANCE, project manager, or project member
    const hasAccess =
      user.role === "ADMIN" ||
      user.role === "SALES_FINANCE" ||
      project.projectManagerId === user.id ||
      project.members.length > 0;

    if (!hasAccess) {
      return { status: 403, message: "Forbidden - You don't have access to this project" };
    }

    const tasks = await client.task.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });
    return { status: 200, data: tasks.map(serializeTask) };
  } catch (error) {
    console.error("[GET_TASKS_BY_PROJECT]", error);
    return { status: 500, message: "Failed to fetch tasks" };
  }
}

type CreateTaskInput = {
  projectId: number;
  title: string;
  description?: string;
  assignedToId?: number;
  priority?: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
};

export async function onCreateTask(input: CreateTaskInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Check if user has access to this project
    const project = await client.project.findUnique({
      where: { id: input.projectId },
      select: {
        projectManagerId: true,
        members: {
          where: { userId: user.id, leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!project) return { status: 404, message: "Project not found" };

    // Only ADMIN, PROJECT_MANAGER (of this project), or SALES_FINANCE can create tasks
    const canCreate =
      user.role === "ADMIN" ||
      user.role === "SALES_FINANCE" ||
      project.projectManagerId === user.id;

    if (!canCreate) {
      return { status: 403, message: "Forbidden - Only admins, project managers, and sales/finance can create tasks" };
    }

    const maxOrder = await client.task.findFirst({
      where: { projectId: input.projectId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const task = await client.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        assignedToId: input.assignedToId,
        assignedBy: user.id,
        priority: input.priority ?? "MEDIUM",
        dueDate: input.dueDate,
        estimatedHours: input.estimatedHours ?? 0,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        status: "NEW",
      },
    });

    // Notify user if task is assigned
    if (input.assignedToId && input.assignedToId !== user.id) {
      await notifyTaskAssigned(
        input.assignedToId,
        task.title,
        task.id,
        input.projectId
      ).catch((err) => console.error("[NOTIFY_TASK_ASSIGNED]", err));
    }

    return { status: 201, data: serializeTask(task), message: "Task created" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to create task" };
  }
}

type UpdateTaskInput = CreateTaskInput & { id: number };

export async function onUpdateTask(input: UpdateTaskInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Check if user has access to this task's project
    const task = await client.task.findUnique({
      where: { id: input.id },
      include: {
        project: {
          select: {
            projectManagerId: true,
            members: {
              where: { userId: user.id, leftAt: null },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!task) return { status: 404, message: "Task not found" };

    // Check access: ADMIN, SALES_FINANCE, project manager, or assigned user (for own tasks)
    const hasAccess =
      user.role === "ADMIN" ||
      user.role === "SALES_FINANCE" ||
      task.project.projectManagerId === user.id ||
      task.assignedToId === user.id;

    if (!hasAccess) {
      return { status: 403, message: "Forbidden - You don't have access to update this task" };
    }

    // Get old task data to check for assignment changes
    const oldTask = await client.task.findUnique({
      where: { id: input.id },
      select: { assignedToId: true, projectId: true },
    });

    const updatedTask = await client.task.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description,
        assignedToId: input.assignedToId,
        priority: input.priority,
        dueDate: input.dueDate,
        estimatedHours: input.estimatedHours,
      },
    });

    // Notify user if task assignment changed
    if (input.assignedToId && input.assignedToId !== oldTask?.assignedToId && input.assignedToId !== user.id) {
      await notifyTaskAssigned(
        input.assignedToId,
        updatedTask.title,
        updatedTask.id,
        oldTask?.projectId || updatedTask.projectId
      ).catch((err) => console.error("[NOTIFY_TASK_ASSIGNED]", err));
    }

    return { status: 200, data: serializeTask(updatedTask), message: "Task updated" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to update task" };
  }
}

export async function onUpdateTaskStatus({ id, status }: { id: number; status: TaskStatus }) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Check if user has access to this task's project
    const task = await client.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    if (!task) return { status: 404, message: "Task not found" };

    // Check access: ADMIN, SALES_FINANCE, project manager, or assigned user (for own tasks)
    const hasAccess =
      user.role === "ADMIN" ||
      user.role === "SALES_FINANCE" ||
      task.project.projectManagerId === user.id ||
      task.assignedToId === user.id;

    if (!hasAccess) {
      return { status: 403, message: "Forbidden - You don't have access to update this task" };
    }

    const oldStatus = task.status;
    const t = await client.task.update({
      where: { id },
      data: { status },
    });

    // Notify project manager and assigned user if status changed
    if (oldStatus !== status) {
      const usersToNotify: number[] = [];
      
      if (t.assignedToId && t.assignedToId !== user.id) {
        usersToNotify.push(t.assignedToId);
      }

      if (task.project.projectManagerId && task.project.projectManagerId !== user.id && !usersToNotify.includes(task.project.projectManagerId)) {
        usersToNotify.push(task.project.projectManagerId);
      }

      // Send notifications to all relevant users
      await Promise.all(
        usersToNotify.map((userId) =>
          notifyTaskStatusChanged(
            userId,
            t.title,
            status,
            t.id,
            t.projectId
          ).catch((err) => console.error("[NOTIFY_TASK_STATUS_CHANGED]", err))
        )
      );
    }

    return { status: 200, data: serializeTask(t), message: "Task updated" };
  } catch (error) {
    console.error("[UPDATE_TASK_STATUS]", error);
    return { status: 500, message: "Failed to update task" };
  }
}

export async function onDeleteTask(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Check if user has access to this task's project
    const task = await client.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    if (!task) return { status: 404, message: "Task not found" };

    // Only ADMIN, SALES_FINANCE, or project manager can delete tasks
    const canDelete =
      user.role === "ADMIN" ||
      user.role === "SALES_FINANCE" ||
      task.project.projectManagerId === user.id;

    if (!canDelete) {
      return { status: 403, message: "Forbidden - Only admins, sales/finance, and project managers can delete tasks" };
    }

    await client.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { status: 200, message: "Task deleted" };
  } catch (error) {
    console.error("[DELETE_TASK]", error);
    return { status: 500, message: "Failed to delete task" };
  }
}

export async function onGetMyTasks() {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Get tasks assigned to user, but only from projects they have access to
    const memberProjectIds = await client.projectMember.findMany({
      where: { userId: user.id, leftAt: null },
      select: { projectId: true },
    });

    const projectIds = memberProjectIds.map((m) => m.projectId);
    
    // Also include projects where user is project manager
    const managedProjects = await client.project.findMany({
      where: { projectManagerId: user.id },
      select: { id: true },
    });
    
    const allAccessibleProjectIds = [
      ...projectIds,
      ...managedProjects.map((p) => p.id),
    ];

    // If user has no accessible projects, return empty array
    if (allAccessibleProjectIds.length === 0) {
      return { status: 200, data: [] };
    }

    const tasks = await client.task.findMany({
      where: {
        assignedToId: user.id,
        deletedAt: null,
        projectId: { in: allAccessibleProjectIds },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return { status: 200, data: tasks.map(serializeTask) };
  } catch (error) {
    console.error("[GET_MY_TASKS]", error);
    return { status: 500, message: "Failed to fetch my tasks" };
  }
}

export async function onGetAllTasks() {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Get tasks based on role
    let tasks;
    if (user.role === "ADMIN") {
      // Admin sees all tasks
      tasks = await client.task.findMany({
        where: { deletedAt: null },
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: "asc" },
      });
    } else if (user.role === "PROJECT_MANAGER") {
      // PM sees tasks from their projects
      tasks = await client.task.findMany({
        where: {
          deletedAt: null,
          project: {
            projectManagerId: user.id,
          },
        },
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: "asc" },
      });
    } else {
      // Team members see tasks from projects they're members of
      const projectIds = await client.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });

      tasks = await client.task.findMany({
        where: {
          deletedAt: null,
          projectId: {
            in: projectIds.map((p) => p.projectId),
          },
        },
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: "asc" },
      });
    }

    return { status: 200, data: tasks.map(serializeTask) };
  } catch (error) {
    console.error("[GET_ALL_TASKS]", error);
    return { status: 500, message: "Failed to fetch tasks" };
  }
}