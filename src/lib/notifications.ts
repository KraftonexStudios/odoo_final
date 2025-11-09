/**
 * Helper functions to create notifications from various actions
 * These can be called from server actions to notify users
 */

import { onCreateNotification, type CreateNotificationPayload } from "@/actions/notification.action";
import { NotificationType } from "@prisma/client";

/**
 * Create a notification when a task is assigned
 */
export async function notifyTaskAssigned(
  userId: number,
  taskTitle: string,
  taskId: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "New Task Assigned",
    message: `You have been assigned to task: ${taskTitle}`,
    type: "TASK_ASSIGNED",
    taskId,
    projectId,
    metadata: { taskTitle },
  });
}

/**
 * Create a notification when task status changes
 */
export async function notifyTaskStatusChanged(
  userId: number,
  taskTitle: string,
  newStatus: string,
  taskId: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "Task Status Updated",
    message: `Task "${taskTitle}" status changed to ${newStatus}`,
    type: "TASK_STATUS_CHANGED",
    taskId,
    projectId,
    metadata: { taskTitle, newStatus },
  });
}

/**
 * Create a notification when a timesheet is approved/rejected
 */
export async function notifyTimesheetStatus(
  userId: number,
  status: "APPROVED" | "REJECTED",
  hours: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: `Timesheet ${status}`,
    message: `Your timesheet of ${hours} hours has been ${status.toLowerCase()}`,
    type: status === "APPROVED" ? "TIMESHEET_APPROVED" : "TIMESHEET_REJECTED",
    projectId,
    metadata: { hours, status },
  });
}

/**
 * Create a notification when an expense is approved/rejected
 */
export async function notifyExpenseStatus(
  userId: number,
  status: "APPROVED" | "REJECTED",
  amount: number,
  expenseId?: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: `Expense ${status}`,
    message: `Your expense of $${amount} has been ${status.toLowerCase()}`,
    type: status === "APPROVED" ? "EXPENSE_APPROVED" : "EXPENSE_REJECTED",
    projectId,
    metadata: { amount, status, expenseId },
  });
}

/**
 * Create a notification when a project is assigned
 */
export async function notifyProjectAssigned(
  userId: number,
  projectName: string,
  projectId: number
) {
  return await onCreateNotification({
    userId,
    title: "New Project Assigned",
    message: `You have been assigned to project: ${projectName}`,
    type: "PROJECT_ASSIGNED",
    projectId,
    metadata: { projectName },
  });
}

/**
 * Create a notification when a comment is added to a task
 */
export async function notifyCommentAdded(
  userId: number,
  commenterName: string,
  taskTitle: string,
  taskId: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "New Comment",
    message: `${commenterName} commented on task: ${taskTitle}`,
    type: "COMMENT_ADDED",
    taskId,
    projectId,
    metadata: { commenterName, taskTitle },
  });
}

/**
 * Create a notification for task due soon (call from a cron job or scheduled task)
 */
export async function notifyTaskDueSoon(
  userId: number,
  taskTitle: string,
  taskId: number,
  daysUntilDue: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "Task Due Soon",
    message: `Task "${taskTitle}" is due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`,
    type: "TASK_DUE_SOON",
    taskId,
    projectId,
    metadata: { taskTitle, daysUntilDue },
  });
}

/**
 * Create a notification for overdue task
 */
export async function notifyTaskOverdue(
  userId: number,
  taskTitle: string,
  taskId: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "Task Overdue",
    message: `Task "${taskTitle}" is now overdue`,
    type: "TASK_OVERDUE",
    taskId,
    projectId,
    metadata: { taskTitle },
  });
}

/**
 * Create a notification when invoice is created
 */
export async function notifyInvoiceCreated(
  userId: number,
  invoiceNumber: string,
  amount: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "Invoice Created",
    message: `Invoice ${invoiceNumber} for $${amount} has been created`,
    type: "INVOICE_CREATED",
    projectId,
    metadata: { invoiceNumber, amount },
  });
}

/**
 * Create a notification when invoice is paid
 */
export async function notifyInvoicePaid(
  userId: number,
  invoiceNumber: string,
  amount: number,
  projectId?: number
) {
  return await onCreateNotification({
    userId,
    title: "Invoice Paid",
    message: `Invoice ${invoiceNumber} for $${amount} has been paid`,
    type: "INVOICE_PAID",
    projectId,
    metadata: { invoiceNumber, amount },
  });
}

/**
 * Create a system alert notification
 */
export async function notifySystemAlert(
  userId: number,
  title: string,
  message: string,
  metadata?: any
) {
  return await onCreateNotification({
    userId,
    title,
    message,
    type: "SYSTEM_ALERT",
    metadata,
  });
}

