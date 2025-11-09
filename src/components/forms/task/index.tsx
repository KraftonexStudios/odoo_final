"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskFormSchema, type TaskFormValues } from "./schema";
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
import { Button } from "@/components/ui/button";
import { Save, X, Calendar as CalendarIcon } from "lucide-react";
import type { TaskPriority } from "@prisma/client/index-browser";
import { useCreateTask, useUpdateTask } from "@/hooks/tasks";
import { EditorProvider } from "@/components/kibo-ui/editor";
import { onFetchProjectMembers } from "@/actions/project.action";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  projectId: number;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
  task?: any;
};

export const TaskSheetForm = ({ projectId, trigger, mode = "create", task }: Props) => {
  const { mutate: createTask, isPending: isCreating } = useCreateTask(projectId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask(projectId);
  const isPending = isCreating || isUpdating;
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch project members when form opens
  useEffect(() => {
    if (open) {
      onFetchProjectMembers(projectId).then((result) => {
        if (result.status === 200) {
          setProjectMembers(result.data || []);
        }
      });
    }
  }, [open, projectId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      assignedToId: task?.assignedToId,
      priority: (task?.priority || "MEDIUM") as TaskPriority,
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      estimatedHours: task?.estimatedHours || 0,
    },
  });

  // Reset form when task changes (for edit mode)
  useEffect(() => {
    if (task) {
      reset({
        title: task.title || "",
        description: task.description || "",
        assignedToId: task.assignedToId,
        priority: (task.priority || "MEDIUM") as TaskPriority,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        estimatedHours: task.estimatedHours || 0,
      });
    }
  }, [task, reset]);

  const onSubmitted = handleSubmit((values) => {
    if (mode === "edit" && task) {
      updateTask({ id: Number(task.id), projectId, ...values as any });
    } else {
      createTask({ projectId, ...values as any });
    }
    setOpen(false);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? <Button variant="default">{mode === "edit" ? "Edit Task" : "New Task"}</Button>}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit Task" : "New Task"}</SheetTitle>
        </SheetHeader>
        <form className="space-y-6 py-6" onSubmit={onSubmitted}>
          <FieldGroup>
            <Field>
              <FieldLabel>Title *</FieldLabel>
              <Input placeholder="Task title" {...register("title")} />
              {errors.title && (
                <span className="text-xs text-red-500">{errors.title.message}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <EditorProvider
                    content={field.value || ""}
                    onUpdate={({ editor }) => {
                      const html = editor.getHTML();
                      field.onChange(html === "<p></p>" ? "" : html);
                    }}
                    slotAfter={<></>}
                    editorProps={{
                      attributes: {
                        class: "min-h-[150px] max-h-[300px] overflow-y-auto prose prose-sm focus:outline-none p-4 border rounded-md",
                      },
                    }}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Assign To</FieldLabel>
              <Select
                value={watch("assignedToId")?.toString() || "unassigned"}
                onValueChange={(v) => setValue("assignedToId", v === "unassigned" ? undefined : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId.toString()}>
                      {member.user?.firstName} {member.user?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  value={watch("priority") ?? "MEDIUM"}
                  onValueChange={(v) => setValue("priority", v as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Estimated Hours</FieldLabel>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  {...register("estimatedHours", { valueAsNumber: true })}
                />
              </Field>
            </div>

              <Field>
                <FieldLabel>Due Date</FieldLabel>
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
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default TaskSheetForm;

