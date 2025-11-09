"use client";
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceFormSchema, type InvoiceFormValues, type InvoiceLineValues } from "./schema";
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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, X, Plus, Trash2, FileText, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateInvoice } from "@/hooks/invoices";
import { usePartnersByType } from "@/hooks/partners";
import { useSalesOrders } from "@/hooks/sales-orders";

type Props = {
  projectId: number;
  trigger?: React.ReactNode;
};

export const InvoiceSheetForm = ({ projectId, trigger }: Props) => {
  const { mutate: createInvoice, isPending } = useCreateInvoice(projectId);
  const { data: customers, isLoading: loadingCustomers } = usePartnersByType("CUSTOMER");
  const { data: salesOrdersData, isLoading: loadingSalesOrders } = useSalesOrders(projectId);
  const salesOrders = salesOrdersData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema) as any,
    defaultValues: {
      lines: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 }],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const lines = watch("lines");

  // Calculate totals
  const calculateLineTotal = (line: InvoiceLineValues) => {
    const subtotal = line.quantity * line.unitPrice;
    const discount = subtotal * (line.discountRate / 100);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * (line.taxRate / 100);
    return taxableAmount + tax;
  };

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const totalDiscount = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice * (line.discountRate / 100),
    0
  );
  const totalTax = lines.reduce(
    (sum, line) =>
      sum +
      (line.quantity * line.unitPrice - line.quantity * line.unitPrice * (line.discountRate / 100)) *
        (line.taxRate / 100),
    0
  );
  const total = subtotal - totalDiscount + totalTax;

  const [open, setOpen] = useState(false);

  const onSubmitted = handleSubmit((values) => {
    createInvoice({
      projectId,
      customerId: values.customerId,
      salesOrderId: values.salesOrderId ?? undefined,
      dueDate: values.dueDate,
      paymentTerms: values.paymentTerms,
      notes: values.notes,
      lines: values.lines.map((line) => ({
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        taxRate: Number(line.taxRate),
        discountRate: Number(line.discountRate),
      })),
    } as any);
    setOpen(false);
    reset();
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Invoice
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Customer Invoice
          </SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={onSubmitted}>
          <input type="hidden" {...register("customerId", { valueAsNumber: true })} />
          <input type="hidden" {...register("salesOrderId", { valueAsNumber: true })} />

          {/* Header */}
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Customer *</FieldLabel>
                <Select
                  disabled={loadingCustomers}
                  value={watch("customerId")?.toString() || ""}
                  onValueChange={(value) => setValue("customerId", Number(value))}
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
              <Field>
                <FieldLabel>Due Date *</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("dueDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("dueDate") ? (
                        format(new Date(watch("dueDate")!), "dd/MM/yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("dueDate") ? new Date(watch("dueDate")!) : undefined}
                      onSelect={(date) => setValue("dueDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dueDate && (
                  <span className="text-xs text-red-500">{errors.dueDate.message}</span>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Sales Order</FieldLabel>
                <Select
                  disabled={loadingSalesOrders}
                  value={watch("salesOrderId")?.toString() || "none"}
                  onValueChange={(value) =>
                    setValue("salesOrderId", value === "none" ? undefined : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked Sales Order</SelectItem>
                    {salesOrders.map((order: any) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.orderNumber} - ${order.totalAmount?.toFixed(2) || "0.00"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Payment Terms</FieldLabel>
                <Input placeholder="Net 30" {...register("paymentTerms")} />
              </Field>
            </div>
          </FieldGroup>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Line Items</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Field className="flex-1">
                    <FieldLabel>Description</FieldLabel>
                    <Input
                      placeholder="Item description"
                      {...register(`lines.${index}.description`)}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="mt-7"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <Field>
                    <FieldLabel>Qty</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Unit Price</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Tax %</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.taxRate`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Discount %</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.discountRate`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Line Total</FieldLabel>
                    <div className="text-sm font-mono bg-muted rounded-md h-10 flex items-center px-3">
                      ${calculateLineTotal(lines[index]).toFixed(2)}
                    </div>
                  </Field>
                </div>
              </Card>
            ))}

            {errors.lines && (
              <span className="text-xs text-red-500">
                {errors.lines.message || "Add at least one line item"}
              </span>
            )}
          </div>

          {/* Totals */}
          <Card className="p-4 bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span className="font-mono">-${totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span className="font-mono">${totalTax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </Card>

          {/* Notes */}
          <FieldGroup>
            <Field>
              <FieldLabel>Payment Terms</FieldLabel>
              <Textarea rows={2} placeholder="Payment terms" {...register("paymentTerms")} />
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea rows={2} placeholder="Additional notes" {...register("notes")} />
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
              {isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default InvoiceSheetForm;

