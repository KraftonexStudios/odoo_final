import z from "zod";
import { ProjectStatus, ProjectType } from "@prisma/client/index-browser";

export const ProjectFormSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  type: z.nativeEnum(ProjectType).default("FIXED_PRICE"),
  status: z.nativeEnum(ProjectStatus).default("PLANNED"),
  priority: z.number().min(1).max(5).default(3),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  budgetAmount: z.number().optional().nullable(),
  budgetHours: z.number().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  estimatedRevenue: z.number().optional().nullable(),
  coverImageFile: z.any().optional().nullable(),
  projectManagerId: z.number().optional().nullable(),
  memberIds: z.array(z.number()).optional().default([]),
});

export type ProjectFormValues = z.infer<typeof ProjectFormSchema>;