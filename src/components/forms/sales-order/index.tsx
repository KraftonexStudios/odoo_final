"use client";
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, X, PlusCircle, Trash2, ShoppingCart, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SalesOrderStatus } from "@prisma/client/index-browser";
import { useCreateSalesOrder } from "@/hooks/sales-orders";
import { usePartnersByType } from "@/hooks/partners";
import { Separator } from "@/components/ui/separator";

const SOLineSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
  discountRate: z.number().min(0).max(100).default(0),
});

const SalesOrderFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  validUntil: z.date().optional().nullable(),
  lines: z.array(SOLineSchema).min(1, "At least one line item required"),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
});

type SOFormValues = z.infer<typeof SalesOrderFormSchema>;

type Props = {
  projectId: number;
  trigger?: React.ReactNode;
};

export const SalesOrderSheetForm = ({ projectId, trigger }: Props) => {
  const { mutate: createSO, isPending } = useCreateSalesOrder(projectId);
  const { data: customers, isLoading: loadingCustomers } = usePartnersByType("CUSTOMER");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<SOFormValues>({
    resolver: zodResolver(SalesOrderFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      customerId: undefined,
      validUntil: undefined,
      lines: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 }],
      paymentTerms: "",
      deliveryTerms: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const [open, setOpen] = useState(false);

  const lines = watch("lines");
  
  // Calculate totals
  const subtotal = lines?.reduce((sum, line) => {
    const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
    const discount = lineTotal * ((line.discountRate || 0) / 100);
    return sum + (lineTotal - discount);
  }, 0) || 0;

  const taxAmount = lines?.reduce((sum, line) => {
    const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
    const discount = lineTotal * ((line.discountRate || 0) / 100);
    const taxableAmount = lineTotal - discount;
    return sum + (taxableAmount * ((line.taxRate || 0) / 100));
  }, 0) || 0;

  const totalAmount = subtotal + taxAmount;

  const onSubmitted = handleSubmit((values) => {
    createSO({
      projectId,
      customerId: values.customerId,
      validUntil: values.validUntil,
      lines: values.lines,
      paymentTerms: values.paymentTerms,
      deliveryTerms: values.deliveryTerms,
      notes: values.notes,
    } as any);
    setOpen(false);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Sales Order
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Create Sales Order
          </SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={onSubmitted}>
          <FieldGroup>
            <Field>
              <FieldLabel>Customer *</FieldLabel>
              <Select
                value={watch("customerId")?.toString() || ""}
                onValueChange={(v) => setValue("customerId", parseInt(v))}
                disabled={loadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <span className="text-xs text-red-500">{errors.customerId.message}</span>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Valid Until</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("validUntil") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("validUntil") ? (
                        format(new Date(watch("validUntil")!), "dd/MM/yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("validUntil") ? new Date(watch("validUntil")!) : undefined}
                      onSelect={(date) => setValue("validUntil", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
          </FieldGroup>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Line Items</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 })}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                Add Line
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Line {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    placeholder="Item description"
                    {...register(`lines.${index}.description`)}
                  />
                </Field>

                <div className="grid grid-cols-4 gap-2">
                  <Field>
                    <FieldLabel>Qty</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Unit Price</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Tax %</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.taxRate`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Disc %</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.discountRate`, { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <div className="text-sm text-muted-foreground text-right">
                  Line Total: ${((lines[index]?.quantity || 0) * (lines[index]?.unitPrice || 0) * (1 - ((lines[index]?.discountRate || 0) / 100))).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span className="font-mono">${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="font-mono">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Payment Terms</FieldLabel>
              <Textarea
                placeholder="Net 30 days from invoice date"
                rows={2}
                {...register("paymentTerms")}
              />
            </Field>

            <Field>
              <FieldLabel>Delivery Terms</FieldLabel>
              <Textarea
                placeholder="Delivery terms and conditions"
                rows={2}
                {...register("deliveryTerms")}
              />
            </Field>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                placeholder="Additional notes"
                rows={2}
                {...register("notes")}
              />
            </Field>
          </FieldGroup>

          <SheetFooter className="flex gap-2">
            <SheetClose asChild>
              <Button variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? "Creating..." : "Create Sales Order"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default SalesOrderSheetForm;
