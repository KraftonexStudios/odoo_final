"use client";
import React, { useState } from "react";
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
import { Save, X, PlusCircle, Trash2, FileText } from "lucide-react";
import { useCreateVendorBill } from "@/hooks/vendor-bills";
import { usePartnersByType } from "@/hooks/partners";
import { usePurchaseOrders } from "@/hooks/purchase-orders";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const BillLineSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
});

const VendorBillFormSchema = z.object({
  vendorId: z.number({ required_error: "Vendor is required" }),
  purchaseOrderId: z.number().optional().nullable(),
  vendorReference: z.string().optional(),
  dueDate: z.date({ required_error: "Due date is required" }),
  lines: z.array(BillLineSchema).min(1, "At least one line item required"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type VendorBillFormValues = z.infer<typeof VendorBillFormSchema>;

type Props = {
  projectId: number;
  trigger?: React.ReactNode;
};

export const VendorBillSheetForm = ({ projectId, trigger }: Props) => {
  const { mutate: createBill, isPending } = useCreateVendorBill();
  const { data: vendors, isLoading: loadingVendors } = usePartnersByType("VENDOR");
  const { data: purchaseOrders } = usePurchaseOrders(projectId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<VendorBillFormValues>({
    resolver: zodResolver(VendorBillFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      vendorId: undefined,
      purchaseOrderId: undefined,
      vendorReference: "",
      dueDate: undefined,
      lines: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
      paymentTerms: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const [open, setOpen] = useState(false);

  const lines = watch("lines");
  const selectedVendorId = watch("vendorId");
  const selectedPOId = watch("purchaseOrderId");
  
  const subtotal = lines?.reduce((sum, line) => 
    sum + ((line.quantity || 0) * (line.unitPrice || 0)), 0
  ) || 0;

  const taxAmount = lines?.reduce((sum, line) => {
    const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
    return sum + (lineTotal * ((line.taxRate || 0) / 100));
  }, 0) || 0;

  const totalAmount = subtotal + taxAmount;

  const onSubmitted = handleSubmit((values) => {
    createBill(
      {
        projectId,
        vendorId: values.vendorId,
        purchaseOrderId: values.purchaseOrderId || undefined,
        vendorReference: values.vendorReference || undefined,
        dueDate: values.dueDate,
        lines: values.lines,
        paymentTerms: values.paymentTerms || undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || <Button variant="default">New Vendor Bill</Button>}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Vendor Bill
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={onSubmitted} className="space-y-6 py-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Vendor *</FieldLabel>
              <Select
                onValueChange={(v) => setValue("vendorId", Number(v))}
                disabled={loadingVendors || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <span className="text-xs text-red-500">
                  {errors.vendorId.message}
                </span>
              )}
            </Field>

            <Field>
              <FieldLabel>Purchase Order (Optional)</FieldLabel>
              <Select
                onValueChange={(v) => setValue("purchaseOrderId", v ? Number(v) : null)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to purchase order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {purchaseOrders?.data?.map((po) => (
                    <SelectItem key={po.id} value={String(po.id)}>
                      {po.orderNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Vendor Reference</FieldLabel>
              <Input
                placeholder="Vendor's invoice number"
                {...register("vendorReference")}
                disabled={isPending}
              />
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
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch("dueDate") ? (
                      format(watch("dueDate"), "dd/MM/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch("dueDate")}
                    onSelect={(date) => setValue("dueDate", date as Date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <span className="text-xs text-red-500">
                  {errors.dueDate.message}
                </span>
              )}
            </Field>
          </FieldGroup>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-4">
              <FieldLabel>Line Items *</FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0 })}
                disabled={isPending}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Line {idx + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(idx)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <FieldLabel>Description</FieldLabel>
                      <Input
                        placeholder="Item description"
                        {...register(`lines.${idx}.description`)}
                        disabled={isPending}
                      />
                      {errors.lines?.[idx]?.description && (
                        <span className="text-xs text-red-500">
                          {errors.lines[idx]?.description?.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <FieldLabel>Quantity</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...register(`lines.${idx}.quantity`, { valueAsNumber: true })}
                        disabled={isPending}
                      />
                    </div>

                    <div>
                      <FieldLabel>Unit Price</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register(`lines.${idx}.unitPrice`, { valueAsNumber: true })}
                        disabled={isPending}
                      />
                    </div>

                    <div>
                      <FieldLabel>Tax Rate (%)</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...register(`lines.${idx}.taxRate`, { valueAsNumber: true })}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    Line Total: $
                    {(
                      (lines[idx]?.quantity || 0) *
                      (lines[idx]?.unitPrice || 0) *
                      (1 + (lines[idx]?.taxRate || 0) / 100)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {errors.lines && (
              <span className="text-xs text-red-500 mt-2">
                {errors.lines.message}
              </span>
            )}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Payment Terms</FieldLabel>
              <Textarea
                placeholder="e.g., Net 30, Due on receipt"
                {...register("paymentTerms")}
                disabled={isPending}
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                placeholder="Additional notes"
                {...register("notes")}
                disabled={isPending}
                rows={3}
              />
            </Field>
          </FieldGroup>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Creating..." : "Create Bill"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

