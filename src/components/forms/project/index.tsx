"use client";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectFormSchema, type ProjectFormValues } from "./schema";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Field,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { onCreateProject, onUpdateProject } from "@/actions/project.action";
import { onFetchAllUsers } from "@/actions/admin.action";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";
import type {
  Project,
  ProjectStatus,
  ProjectType,
} from "@prisma/client/index-browser";
import { base64ToDataUrl, cn, formatRole } from "@/lib/utils";
import { 
  Image as ImageIcon, 
  PlusCircle, 
  Save, 
  Upload, 
  X,
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Layers,
  CheckCircle2,
  ChevronDown,
  Users
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Props = {
  mode?: "create" | "edit";
  project?: (Project & {
    coverImage?: string | null;
    members?: Array<{
      id: number;
      userId: number;
      user?: {
        id: number;
        clerkId: string;
        firstName: string | null;
        lastName: string | null;
        avatar?: string | null;
      };
    }>;
  });
  trigger?: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

export const ProjectSheetForm = ({
  mode = "create",
  project,
  trigger,
  onClose,
  className,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isAdmin, isProjectManager, role, isLoaded } = useRole();
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("[ProjectForm] Role check:", { role, isAdmin, isLoaded });
  }, [role, isAdmin, isLoaded]);

  // Fetch users for admin and project managers
  useEffect(() => {
    if ((isAdmin || isProjectManager) && isLoaded) {
      console.log("[ProjectForm] Fetching admin users...");
      setLoadingUsers(true);
      onFetchAllUsers().then((result) => {
        console.log("[ProjectForm] Users fetched:", result);
        if (result.status === 200) {
          setAdminUsers(result.data || []);
        }
        setLoadingUsers(false);
      });
    }
  }, [isAdmin, isProjectManager, isLoaded]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema) as any,
    mode: "onTouched",
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      code: project?.code ?? "",
      type: (project?.type ?? "FIXED_PRICE") as ProjectType,
      status: (project?.status ?? "PLANNED") as ProjectStatus,
      priority: project?.priority ?? 3,
      startDate: project?.startDate ? new Date(project.startDate) : undefined,
      endDate: project?.endDate ? new Date(project.endDate) : undefined,
      budgetAmount: project?.budgetAmount ? Number(project.budgetAmount) : undefined,
      budgetHours: project?.budgetHours ? Number(project.budgetHours) : undefined,
      estimatedCost: project?.estimatedCost ? Number(project.estimatedCost) : undefined,
      estimatedRevenue: project?.estimatedRevenue ? Number(project.estimatedRevenue) : undefined,
      coverImageFile: undefined,
      projectManagerId: project?.projectManagerId ?? undefined,
      memberIds: project?.members?.map((member) => member.userId) ?? [],
    },
  });

  // Reset form when project changes (for edit mode)
  useEffect(() => {
    if (project) {
      reset({
        name: project.name ?? "",
        description: project.description ?? "",
        code: project.code ?? "",
        type: (project.type ?? "FIXED_PRICE") as ProjectType,
        status: (project.status ?? "PLANNED") as ProjectStatus,
        priority: project.priority ?? 3,
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
        budgetHours: project.budgetHours ? Number(project.budgetHours) : undefined,
        estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : undefined,
        estimatedRevenue: project.estimatedRevenue ? Number(project.estimatedRevenue) : undefined,
        coverImageFile: undefined,
        projectManagerId: project.projectManagerId ?? undefined,
        memberIds: project.members?.map((member) => member.userId) ?? [],
      });
    }
  }, [project, reset]);

  const [open, setOpen] = useState(false);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  const managerOptions = useMemo(
    () =>
      adminUsers
        .filter((user: any) => user?.prismaId)
        .filter(
          (user: any) =>
            user.role === "PROJECT_MANAGER" ||
            user.role === "ADMIN"
        ),
    [adminUsers]
  );

  const memberOptions = useMemo(
    () => {
      if (isProjectManager && !isAdmin) {
        // Project managers can only assign SALES_FINANCE role
        return adminUsers
          .filter((user: any) => user?.prismaId)
          .filter((user: any) => user.role === "SALES_FINANCE");
      }
      // Admins can assign any role except ADMIN
      return adminUsers
        .filter((user: any) => user?.prismaId)
        .filter(
          (user: any) =>
            user.role === "TEAM_MEMBER" ||
            user.role === "PROJECT_MANAGER" ||
            user.role === "SALES_FINANCE"
        );
    },
    [adminUsers, isProjectManager, isAdmin]
  );

  const onSubmitted = handleSubmit(async (values) => {
    const uniqueMemberIds = Array.from(
      new Set(values.memberIds ?? [])
    ).filter((id): id is number => typeof id === "number" && !Number.isNaN(id));

    startTransition(async () => {
      const payload = {
        ...values,
        projectManagerId: values.projectManagerId ?? undefined,
        memberIds: uniqueMemberIds,
        coverImageFile:
          values.coverImageFile instanceof FileList
            ? values.coverImageFile[0]
            : (values.coverImageFile as unknown as File | null),
      };

      if (mode === "create") {
        const result = await onCreateProject(payload as any);
        if (result.status === 201 || result.status === 200) {
          toast.success("Project created successfully");
          setOpen(false);
          onClose?.();
          router.refresh();
        } else {
          toast.error(result.message || "Failed to create project");
        }
      } else if (project) {
        const result = await onUpdateProject({
          id: project.id,
          ...payload,
        } as any);
        if (result.status === 200) {
          toast.success("Project updated successfully");
          setOpen(false);
          onClose?.();
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update project");
        }
      }
    });
  });

  // React 19 compiler handles this automatically
  const file = watch("coverImageFile");
  const selectedManagerId = watch("projectManagerId");
  const selectedMemberIds = watch("memberIds") ?? [];
  const imagePreview = file instanceof FileList && file.length > 0
    ? URL.createObjectURL(file[0])
    : base64ToDataUrl(project?.coverImage ?? undefined);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="default"
            size="sm"
            className={cn("gap-2", className)}
          >
            <PlusCircle className="h-4 w-4" /> New Project
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-2xl px-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </SheetTitle>
        </SheetHeader>
        <form className="space-y-5 py-4" onSubmit={onSubmitted}>
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basic Information</h3>
            </div>
            
            <Field>
              <FieldLabel className="text-xs">Project Name *</FieldLabel>
              <Input 
                className="h-9 text-sm"
                placeholder="e.g., Website Redesign 2025" 
                {...register("name")} 
              />
              {errors.name && (
                <span className="text-xs text-red-500">{errors.name.message}</span>
              )}
            </Field>

            <Field>
              <FieldLabel className="text-xs">Description</FieldLabel>
              <Textarea
                className="text-sm resize-none"
                rows={2}
                placeholder="Brief description..."
                {...register("description")}
              />
            </Field>

            <div className="grid grid-cols-4 gap-3">
              <Field>
                <FieldLabel className="text-xs">Code</FieldLabel>
                <Input
                  className="h-9 text-sm"
                  placeholder="AUTO"
                  {...register("code")}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Priority</FieldLabel>
                <Input
                  className="h-9 text-sm text-center"
                  type="number"
                  min={1}
                  max={5}
                  placeholder="3"
                  {...register("priority", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Type</FieldLabel>
                <Select
                  value={watch("type") ?? "FIXED_PRICE"}
                  onValueChange={(v) => setValue("type", v as any)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_PRICE">Fixed Price</SelectItem>
                    <SelectItem value="TIME_AND_MATERIAL">Time & Material</SelectItem>
                    <SelectItem value="RETAINER">Retainer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="text-xs">Status</FieldLabel>
                <Select
                  value={watch("status") ?? "PLANNED"}
                  onValueChange={(v) => setValue("status", v as any)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {(isAdmin || isProjectManager) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Team Assignment
                </h3>
              </div>

              {isAdmin && (
                <Field>
                  <FieldLabel className="text-xs">Project Manager *</FieldLabel>
                  <Select
                    value={selectedManagerId ? String(selectedManagerId) : undefined}
                    onValueChange={(v) =>
                      setValue(
                        "projectManagerId",
                        v ? Number(v) : null,
                        { shouldDirty: true }
                      )
                    }
                    disabled={loadingUsers}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue
                        placeholder={
                          loadingUsers ? "Loading managers..." : "Assign project manager"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingUsers && (
                        <SelectItem value="__loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {!loadingUsers && managerOptions.length === 0 && (
                        <SelectItem value="__no-manager" disabled>
                          No eligible managers available
                        </SelectItem>
                      )}
                      {!loadingUsers &&
                        managerOptions.map((manager: any) => (
                          <SelectItem
                            key={manager.prismaId}
                            value={String(manager.prismaId)}
                          >
                            {manager.firstName} {manager.lastName}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({formatRole(manager.role)})
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field>
                <FieldLabel className="text-xs">
                  {isProjectManager && !isAdmin 
                    ? "Sales & Finance Members" 
                    : "Project Members"}
                </FieldLabel>
                <Popover
                  open={memberPopoverOpen}
                  onOpenChange={setMemberPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-9 text-sm"
                      disabled={loadingUsers || memberOptions.length === 0}
                    >
                      <span>
                        {selectedMemberIds.length > 0
                          ? `${selectedMemberIds.length} member${selectedMemberIds.length === 1 ? "" : "s"} selected`
                          : isProjectManager && !isAdmin 
                            ? "Select Sales & Finance members" 
                            : "Select members"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3" align="start">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {loadingUsers && (
                        <p className="text-xs text-muted-foreground">
                          Loading members...
                        </p>
                      )}
                      {!loadingUsers && memberOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No team members available
                        </p>
                      )}
                      {!loadingUsers &&
                        memberOptions.map((member: any) => {
                          if (!member.prismaId) return null;
                          const isSelected = selectedMemberIds.includes(
                            Number(member.prismaId)
                          );
                          return (
                            <Label
                              key={member.prismaId}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const current = watch("memberIds") ?? [];
                                  const next = checked
                                    ? Array.from(
                                        new Set([
                                          ...current,
                                          Number(member.prismaId),
                                        ])
                                      )
                                    : current.filter(
                                        (id: number) =>
                                          id !== Number(member.prismaId)
                                      );
                                  setValue("memberIds", next, {
                                    shouldDirty: true,
                                  });
                                }}
                              />
                              <span>
                                {member.firstName} {member.lastName}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({formatRole(member.role)})
                                </span>
                              </span>
                            </Label>
                          );
                        })}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedMemberIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedMemberIds.map((memberId: number) => {
                      const member = memberOptions.find(
                        (opt: any) => Number(opt.prismaId) === memberId
                      );
                      if (!member) return null;
                      return (
                        <Badge 
                          key={memberId} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {member.firstName} {member.lastName}
                          <span className="ml-1 opacity-70">
                            ({formatRole(member.role)})
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </Field>
            </div>
          )}

          {/* Budget & Financials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Budget & Financials</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <Field>
                <FieldLabel className="text-xs">Budget</FieldLabel>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  {...register("budgetAmount", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Hours</FieldLabel>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  step="0.5"
                  placeholder="500"
                  {...register("budgetHours", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Est. Revenue</FieldLabel>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  step="0.01"
                  placeholder="75000"
                  {...register("estimatedRevenue", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">Est. Cost</FieldLabel>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  step="0.01"
                  placeholder="40000"
                  {...register("estimatedCost", { valueAsNumber: true })}
                />
              </Field>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-xs">Start Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left font-normal text-sm",
                        !watch("startDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {watch("startDate") 
                        ? format(new Date(watch("startDate")!), "dd/MM/yyyy").toUpperCase()
                        : "DD/MM/YYYY"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={watch("startDate") ? new Date(watch("startDate")!) : undefined}
                      onSelect={(date) => setValue("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <FieldLabel className="text-xs">End Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left font-normal text-sm",
                        !watch("endDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {watch("endDate") 
                        ? format(new Date(watch("endDate")!), "dd/MM/yyyy").toUpperCase()
                        : "DD/MM/YYYY"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={watch("endDate") ? new Date(watch("endDate")!) : undefined}
                      onSelect={(date) => setValue("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover Image</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => document.getElementById("cover-upload")?.click()}
              >
                <Upload className="h-3 w-3" />
                {imagePreview ? "Change" : "Upload"}
                {imagePreview && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              </Button>
              <Input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setValue("coverImageFile", e.target.files);
                }}
              />
            </div>
            
            {imagePreview && (
              <div className="aspect-video border overflow-hidden bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <Separator className="my-4" />
          <SheetFooter className="flex flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="submit"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={isPending}
            >
              <Save className="h-3 w-3" />
              {mode === "create"
                ? isPending
                  ? "CREATING..."
                  : "CREATE PROJECT"
                : isPending
                ? "SAVING..."
                : "SAVE CHANGES"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectSheetForm;
