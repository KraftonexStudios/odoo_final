"use client";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseFormSchema, type ExpenseFormValues } from "./schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, X, Upload, FileImage, Calendar as CalendarIcon } from "lucide-react";
import type { ExpenseCategory } from "@prisma/client/index-browser";
import { useCreateExpense } from "@/hooks/expenses";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  projectId: number;
  trigger?: React.ReactNode;
};

export const ExpenseSheetForm = ({ projectId, trigger }: Props) => {
  const { mutate: createExpense, isPending } = useCreateExpense();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      category: "TRAVEL" as ExpenseCategory,
      description: "",
      expenseDate: new Date(),
      amount: 0,
      taxAmount: 0,
      isBillable: false,
    },
  });

  const [open, setOpen] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense(
      {
        projectId,
        ...data,
        receiptImage,
      } as any,
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          removeImage();
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? <Button variant="default">New Expense</Button>}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Expense</SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={watch("category") ?? "TRAVEL"}
                  onValueChange={(v) => setValue("category", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "TRAVEL",
                        "MEALS",
                        "ACCOMMODATION",
                        "SUPPLIES",
                        "EQUIPMENT",
                        "SOFTWARE",
                        "OTHER",
                      ] as ExpenseCategory[]
                    ).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("expenseDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("expenseDate") ? (
                        format(new Date(watch("expenseDate")!), "dd/MM/yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("expenseDate") ? new Date(watch("expenseDate")!) : undefined}
                      onSelect={(date) => setValue("expenseDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                placeholder="What was this expense for?"
                {...register("description")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Amount</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel>Tax</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register("taxAmount", { valueAsNumber: true })}
                />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!watch("isBillable")}
                onCheckedChange={(v) => setValue("isBillable", v)}
              />
              <span className="text-sm">Billable</span>
            </div>

            {/* Receipt Image Upload */}
            <div className="space-y-2">
              <FieldLabel>Receipt Image (Optional)</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {receiptPreview ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={receiptPreview}
                      alt="Receipt preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove Receipt
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Receipt Image
                </Button>
              )}
            </div>
          </FieldGroup>
          <SheetFooter className="flex gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" className="gap-2" disabled={isPending}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Expense"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ExpenseSheetForm;

