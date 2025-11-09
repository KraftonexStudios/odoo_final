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
import { Save, X, PlusCircle, Trash2, Receipt, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreatePurchaseOrder } from "@/hooks/purchase-orders";
import { usePartnersByType } from "@/hooks/partners";
import { Separator } from "@/components/ui/separator";

const POLineSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
});

const PurchaseOrderFormSchema = z.object({
  vendorId: z.number({ required_error: "Vendor is required" }),
  expectedDelivery: z.date().optional().nullable(),
  lines: z.array(POLineSchema).min(1, "At least one line item required"),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

type POFormValues = z.infer<typeof PurchaseOrderFormSchema>;

type Props = {
  projectId: number;
  trigger?: React.ReactNode;
};

export const PurchaseOrderSheetForm = ({ projectId, trigger }: Props) => {
  const { mutate: createPO, isPending } = useCreatePurchaseOrder();
  const { data: vendors, isLoading: loadingVendors } = usePartnersByType("VENDOR");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<POFormValues>({
    resolver: zodResolver(PurchaseOrderFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      vendorId: undefined,
      expectedDelivery: undefined,
      lines: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
      paymentTerms: "",
      deliveryAddress: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const [open, setOpen] = useState(false);

  const lines = watch("lines");
  
  const subtotal = lines?.reduce((sum, line) => 
    sum + ((line.quantity || 0) * (line.unitPrice || 0)), 0
  ) || 0;

  const taxAmount = lines?.reduce((sum, line) => {
    const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
    return sum + (lineTotal * ((line.taxRate || 0) / 100));
  }, 0) || 0;

  const totalAmount = subtotal + taxAmount;

  const onSubmitted = handleSubmit((values) => {
    createPO({
      projectId,
      vendorId: values.vendorId,
      expectedDelivery: values.expectedDelivery,
      lines: values.lines,
      paymentTerms: values.paymentTerms,
      deliveryAddress: values.deliveryAddress,
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
            New Purchase Order
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Purchase Order
          </SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={onSubmitted}>
          <FieldGroup>
            <Field>
              <FieldLabel>Vendor *</FieldLabel>
              <Select
                value={watch("vendorId")?.toString() || ""}
                onValueChange={(v) => setValue("vendorId", parseInt(v))}
                disabled={loadingVendors}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <span className="text-xs text-red-500">{errors.vendorId.message}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>Expected Delivery</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watch("expectedDelivery") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch("expectedDelivery") ? (
                      format(new Date(watch("expectedDelivery")!), "dd/MM/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch("expectedDelivery") ? new Date(watch("expectedDelivery")!) : undefined}
                    onSelect={(date) => setValue("expectedDelivery", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
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
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0 })}
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

                <div className="grid grid-cols-3 gap-2">
                  <Field>
                    <FieldLabel>Quantity</FieldLabel>
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
                </div>

                <div className="text-sm text-muted-foreground text-right">
                  Line Total: ${((lines[index]?.quantity || 0) * (lines[index]?.unitPrice || 0)).toFixed(2)}
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
              <Textarea rows={2} {...register("paymentTerms")} />
            </Field>

            <Field>
              <FieldLabel>Delivery Address</FieldLabel>
              <Textarea rows={2} {...register("deliveryAddress")} />
            </Field>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea rows={2} {...register("notes")} />
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
              {isPending ? "Creating..." : "Create Purchase Order"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PurchaseOrderSheetForm;
