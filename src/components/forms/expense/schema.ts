import z from "zod";
import { ExpenseCategory } from "@prisma/client/index-browser";

export const ExpenseFormSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(2),
  expenseDate: z.date(),
  amount: z.number().positive(),
  taxAmount: z.number().optional().default(0),
  isBillable: z.boolean().optional().default(false),
});

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>;