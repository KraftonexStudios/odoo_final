import z from "zod";

export const POLineSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const PurchaseOrderFormSchema = z.object({
  vendorId: z.number().min(1, "Vendor is required"),
  expectedDate: z.date().optional().nullable(),
  lines: z.array(POLineSchema).min(1, "At least one line item is required"),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

export type POLineValues = z.infer<typeof POLineSchema>;
export type PurchaseOrderFormValues = z.infer<typeof PurchaseOrderFormSchema>;

