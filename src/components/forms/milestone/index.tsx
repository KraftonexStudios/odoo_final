"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Save, X, Target } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCreateMilestone, useUpdateMilestone } from "@/hooks/milestones";
import type { Milestone } from "@prisma/client/index-browser";

const MilestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date(),
});

type MilestoneFormValues = z.infer<typeof MilestoneSchema>;

type Props = {
  projectId: number;
  milestone?: Milestone;
  trigger?: React.ReactNode;
};

export const MilestoneForm = ({ projectId, milestone, trigger }: Props) => {
  const isEdit = !!milestone;
  const { mutate: create, isPending: creating } = useCreateMilestone(projectId);
  const { mutate: update, isPending: updating } = useUpdateMilestone(projectId);
  const isPending = creating || updating;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MilestoneFormValues>({
    resolver: zodResolver(MilestoneSchema),
    defaultValues: milestone
      ? {
          title: milestone.title,
          description: milestone.description || "",
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : new Date(),
        }
      : {
          title: "",
          description: "",
          dueDate: new Date(),
        },
  });

  const [open, setOpen] = useState(false);

  const onSubmit = (data: MilestoneFormValues) => {
    if (isEdit) {
      update(
        { id: milestone.id, ...data },
        {
          onSuccess: () => {
            setOpen(false);
            reset();
          },
        }
      );
    } else {
      create(
        { projectId, ...data },
        {
          onSuccess: () => {
            setOpen(false);
            reset();
          },
        }
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Target className="h-4 w-4" />
            {isEdit ? "Edit Milestone" : "New Milestone"}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isEdit ? "Edit Milestone" : "New Milestone"}
          </SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Title *</FieldLabel>
              <Input
                placeholder="e.g., Phase 1 Complete"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                placeholder="What needs to be accomplished?"
                rows={4}
                {...register("description")}
              />
            </Field>

            <Field>
              <FieldLabel>Due Date *</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
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
                    onSelect={(date) => setValue("dueDate", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </Field>
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
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default MilestoneForm;

