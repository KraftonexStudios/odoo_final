"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Save, X } from "lucide-react";
import { PartnerType } from "@prisma/client/index-browser";
import { useCreatePartner, useUpdatePartner } from "@/hooks/partners";

const PartnerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(PartnerType),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  paymentTermDays: z.number().min(0).default(30),
});

type PartnerFormValues = z.infer<typeof PartnerFormSchema>;

type Props = {
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
  partner?: any;
};

export const PartnerSheetForm = ({ trigger, mode = "create", partner }: Props) => {
  const { mutate: createPartner, isPending: isCreating } = useCreatePartner();
  const { mutate: updatePartner, isPending: isUpdating } = useUpdatePartner();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(PartnerFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      name: partner?.name || "",
      type: (partner?.type || "CUSTOMER") as PartnerType,
      email: partner?.email || "",
      phone: partner?.phone || "",
      address: partner?.address || "",
      taxId: partner?.taxId || "",
      paymentTermDays: partner?.paymentTermDays || 30,
    },
  });

  useEffect(() => {
    if (partner) {
      reset({
        name: partner.name || "",
        type: (partner.type || "CUSTOMER") as PartnerType,
        email: partner.email || "",
        phone: partner.phone || "",
        address: partner.address || "",
        taxId: partner.taxId || "",
        paymentTermDays: partner.paymentTermDays || 30,
      });
    }
  }, [partner, reset]);

  const [open, setOpen] = useState(false);

  const onSubmitted = handleSubmit((values) => {
    if (mode === "edit" && partner) {
      updatePartner({ id: Number(partner.id), ...values as any });
    } else {
      createPartner(values as any);
    }
    setOpen(false);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Create Partner" : "Edit Partner"}
          </SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={onSubmitted}>
          <FieldGroup>
            <Field>
              <FieldLabel>Name *</FieldLabel>
              <Input placeholder="Partner name" {...register("name")} />
              {errors.name && (
                <span className="text-xs text-red-500">{errors.name.message}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>Type *</FieldLabel>
              <Select
                value={watch("type") ?? "CUSTOMER"}
                onValueChange={(v) => setValue("type", v as PartnerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" placeholder="email@example.com" {...register("email")} />
                {errors.email && (
                  <span className="text-xs text-red-500">{errors.email.message}</span>
                )}
              </Field>

              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input placeholder="+1 234 567 8900" {...register("phone")} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Address</FieldLabel>
              <Textarea
                placeholder="Full address..."
                rows={2}
                {...register("address")}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Tax ID</FieldLabel>
                <Input placeholder="Tax/VAT ID" {...register("taxId")} />
              </Field>

              <Field>
                <FieldLabel>Payment Terms (Days)</FieldLabel>
                <Input
                  type="number"
                  placeholder="30"
                  {...register("paymentTermDays", { valueAsNumber: true })}
                />
              </Field>
            </div>
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
              {mode === "create"
                ? isPending
                  ? "Creating..."
                  : "Create Partner"
                : isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PartnerSheetForm;

