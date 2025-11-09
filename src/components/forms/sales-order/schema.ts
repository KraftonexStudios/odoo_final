import z from "zod";

export const SOLineSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
  discountRate: z.number().min(0).max(100).default(0),
});

export const SalesOrderFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  validUntil: z.date().optional().nullable(),
  lines: z.array(SOLineSchema).min(1, "At least one line item is required"),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type SOLineValues = z.infer<typeof SOLineSchema>;
export type SalesOrderFormValues = z.infer<typeof SalesOrderFormSchema>;

