import z from "zod";
import { TaskPriority } from "@prisma/client/index-browser";

export const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.number().optional(),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  dueDate: z.date().optional().nullable(),
  estimatedHours: z.number().min(0).optional(),
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

