"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, X, Clock, Calendar as CalendarIcon } from "lucide-react";
import { useCreateTimesheet } from "@/hooks/timesheets";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TimesheetFormSchema = z.object({
  projectId: z.number(),
  taskId: z.number().optional().nullable(),
  date: z.date(),
  hours: z.number().min(0.1, "Hours must be at least 0.1").max(24, "Hours cannot exceed 24"),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

type TimesheetFormValues = z.infer<typeof TimesheetFormSchema>;

type Props = {
  projectId: number;
  taskId?: number;
  trigger?: React.ReactNode;
};

export const TimesheetForm = ({ projectId, taskId, trigger }: Props) => {
  const { mutate: createTimesheet, isPending } = useCreateTimesheet();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimesheetFormValues>({
    resolver: zodResolver(TimesheetFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      projectId,
      taskId: taskId || undefined,
      date: new Date(),
      hours: 1,
      description: "",
      isBillable: true,
    },
  });

  const [open, setOpen] = useState(false);

  const onSubmitted = handleSubmit((values) => {
    createTimesheet(values as any);
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Clock className="h-4 w-4" />
            Log Hours
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Time
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-6 py-4" onSubmit={onSubmitted}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Date *</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("date") ? (
                        format(new Date(watch("date")!), "dd/MM/yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("date") ? new Date(watch("date")!) : undefined}
                      onSelect={(date) => setValue("date", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && (
                  <span className="text-xs text-red-500">{errors.date.message}</span>
                )}
              </Field>

              <Field>
                <FieldLabel>Hours *</FieldLabel>
                <Input
                  type="number"
                  step="0.25"
                  min="0.1"
                  max="24"
                  placeholder="8.0"
                  {...register("hours", { valueAsNumber: true })}
                />
                {errors.hours && (
                  <span className="text-xs text-red-500">{errors.hours.message}</span>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                placeholder="What did you work on?"
                rows={3}
                {...register("description")}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!watch("isBillable")}
                onCheckedChange={(v) => setValue("isBillable", v)}
              />
              <Label>Billable to client</Label>
            </div>
          </FieldGroup>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} type="button">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-1" />
              {isPending ? "Logging..." : "Log Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetForm;

