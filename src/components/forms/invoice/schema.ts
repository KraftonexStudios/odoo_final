"use client";

import z from "zod";

// Line item schema
export const InvoiceLineSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
  discountRate: z.number().min(0).max(100).default(0),
});

// Main form schema
export const InvoiceFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  salesOrderId: z.number().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1, "At least one line item is required"),
});

// Inferred Types
export type InvoiceLineValues = z.infer<typeof InvoiceLineSchema>;
export type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;
