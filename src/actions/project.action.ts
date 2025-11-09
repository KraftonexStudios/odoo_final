"use server";
import { client } from "@/lib/prisma/client";
import { ProjectStatus, ProjectType } from "@prisma/client/index.js";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { notifyProjectAssigned } from "@/lib/notifications";

type CreateProjectInput = {
  name: string;
  description?: string | null;
  code?: string | null;
  type?: ProjectType;
  status?: ProjectStatus;
  priority?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetAmount?: number | null;
  budgetHours?: number | null;
  estimatedCost?: number | null;
  estimatedRevenue?: number | null;
  coverImageFile?: File | null;
  projectManagerId?: number | null;
  memberIds?: number[];
};

type UpdateProjectInput = CreateProjectInput & { id: number };

export async function onFetchProjects() {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      console.error("[FETCH_PROJECTS] User not authenticated");
      return { status: 401, message: "Unauthorized" };
    }

    console.log("[FETCH_PROJECTS] User ID:", user.id, "Role:", user.role);

    const userId = user.id;
    const userRole = user.role;

    console.log("[FETCH_PROJECTS] User ID:", userId, "Role:", userRole);

    // Build where clause based on role
    const whereClause: any = { deletedAt: null };

    if (userRole === "PROJECT_MANAGER") {
      // Project managers only see their managed projects
      whereClause.projectManagerId = userId;
    } else if (userRole === "TEAM_MEMBER") {
      // Team members see projects where they're members OR have assigned tasks
      const memberProjectIds = await client.projectMember.findMany({
        where: { userId, leftAt: null },
        select: { projectId: true },
      });

      const projectIds = memberProjectIds.map((m) => m.projectId);
      
      if (projectIds.length > 0) {
        whereClause.OR = [
          { id: { in: projectIds } },
          { tasks: { some: { assignedToId: userId } } },
        ];
      } else {
        // If no project memberships, only show projects with assigned tasks
        whereClause.tasks = {
          some: {
            assignedToId: userId,
          },
        };
      }
    }
    // SALES_FINANCE and ADMIN see all projects

    const projects = await client.project.findMany({
      where: whereClause,
      include: {
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[FETCH_PROJECTS] Projects fetched from DB:", projects.length);

    const serialized = projects.map((p) => {
      const { budgetAmount, budgetHours, estimatedCost, estimatedRevenue, coverImage, tasks, ...rest } = p;
      const completedTaskCount = tasks.filter((t) => t.status === "DONE").length;
      return {
        ...rest,
        budgetAmount: budgetAmount?.toNumber() ?? null,
        budgetHours: budgetHours?.toNumber() ?? null,
        estimatedCost: estimatedCost?.toNumber() ?? null,
        estimatedRevenue: estimatedRevenue?.toNumber() ?? null,
        coverImage: coverImage ? Buffer.from(coverImage).toString("base64") : null,
        taskCount: tasks.length,
        completedTaskCount,
        projectManager: p.projectManager,
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
        actualEndDate: p.actualEndDate ? new Date(p.actualEndDate) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
      };
    });
    
    console.log("[FETCH_PROJECTS] Serialized projects ready:", serialized.length);
    return { status: 200, data: serialized };
  } catch (error) {
    console.error("[FETCH_PROJECTS] Error:", error);
    return { status: 500, message: "Failed to fetch projects" };
  }
}

async function nextProjectCode() {
  // Get all projects with codes starting with PRJ-
  const projects = await client.project.findMany({
    where: { 
      code: { 
        startsWith: "PRJ-"
      } 
    },
    orderBy: { code: "desc" },
    take: 1,
  });
  
  const last = projects[0];
  if (!last || !last.code) return "PRJ-001";
  
  const parts = last.code.split('-');
  if (parts.length < 2) return "PRJ-001";
  
  const num = parseInt(parts[1]) + 1;
  if (isNaN(num)) return "PRJ-001";
  
  return `PRJ-${String(num).padStart(3, "0")}`;
}

export async function onCreateProject(input: CreateProjectInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Handle code: empty string should be treated as null/undefined for auto-generation
    const code = input.code && input.code.trim() !== "" 
      ? input.code.trim() 
      : await nextProjectCode();

    let image: Buffer | undefined = undefined;
    if (input.coverImageFile) {
      const ab = await input.coverImageFile.arrayBuffer();
      image = Buffer.from(ab);
    }

    const memberIds = Array.from(new Set(input.memberIds ?? []))
      .filter((id): id is number => typeof id === "number" && !Number.isNaN(id));

    const projectManagerId = (input.projectManagerId ?? user.id) as number;

    const project = await client.project.create({
      data: {
        name: input.name,
        description: input.description ?? undefined,
        code,
        type: input.type ?? "FIXED_PRICE",
        status: input.status ?? "PLANNED",
        priority: input.priority ?? 3,
        startDate: input.startDate ?? undefined,
        endDate: input.endDate ?? undefined,
        budgetAmount: input.budgetAmount ?? undefined,
        budgetHours: input.budgetHours ?? undefined,
        estimatedCost: input.estimatedCost ?? undefined,
        estimatedRevenue: input.estimatedRevenue ?? undefined,
        progressPercentage: 0,
        projectManagerId: projectManagerId,
        coverImage: image ? new Uint8Array(image) : null,
      },
    });

    if (memberIds.length > 0) {
      await client.projectMember.createMany({
        data: memberIds.map((userId) => ({
          projectId: project.id,
          userId,
        })),
        skipDuplicates: true,
      });

      // Notify all new project members
      await Promise.all(
        memberIds.map((userId) =>
          notifyProjectAssigned(
            userId,
            project.name,
            project.id
          ).catch((err) => console.error("[NOTIFY_PROJECT_ASSIGNED]", err))
        )
      );
    }

    const { budgetAmount, budgetHours, estimatedCost, estimatedRevenue, coverImage, ...rest } = project;
    const serializedProject = {
      ...rest,
      budgetAmount: budgetAmount?.toNumber() ?? null,
      budgetHours: budgetHours?.toNumber() ?? null,
      estimatedCost: estimatedCost?.toNumber() ?? null,
      estimatedRevenue: estimatedRevenue?.toNumber() ?? null,
      coverImage: coverImage
        ? Buffer.from(coverImage).toString("base64")
        : null,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.endDate ? new Date(project.endDate) : null,
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : null,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      deletedAt: project.deletedAt ? new Date(project.deletedAt) : null,
    } as any;
    return { status: 201, data: serializedProject, message: "Project created" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to create project" };
  }
}

export async function onUpdateProject(input: UpdateProjectInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    let coverImageBuffer: Buffer | undefined | null = undefined;
    if (input.coverImageFile) {
      const ab = await input.coverImageFile.arrayBuffer();
      coverImageBuffer = Buffer.from(ab);
    }

    const memberIds = Array.from(new Set(input.memberIds ?? []))
      .filter((id): id is number => typeof id === "number" && !Number.isNaN(id));

    // Handle code: if provided and not empty, update it
    const updateData: any = {
      name: input.name,
      description: input.description ?? undefined,
      type: input.type ?? undefined,
      status: input.status ?? undefined,
      priority: input.priority ?? undefined,
      startDate: input.startDate ?? undefined,
      endDate: input.endDate ?? undefined,
      budgetAmount: input.budgetAmount ?? undefined,
      budgetHours: input.budgetHours ?? undefined,
      estimatedCost: input.estimatedCost ?? undefined,
      estimatedRevenue: input.estimatedRevenue ?? undefined,
      projectManagerId: input.projectManagerId ?? undefined,
      coverImage: coverImageBuffer ? Buffer.from(coverImageBuffer) : null,
    };

    // Only update code if provided and not empty
    if (input.code && input.code.trim() !== "") {
      updateData.code = input.code.trim();
    }

    const project = await client.project.update({
      where: { id: input.id },
      data: updateData,
    });

    if (input.memberIds) {
      const existingMembers = await client.projectMember.findMany({
        where: { projectId: input.id },
        select: { userId: true },
      });
      const existingIds = existingMembers.map((member) => member.userId);

      const toRemove = existingIds.filter((id) => !memberIds.includes(id));
      const toAdd = memberIds.filter((id) => !existingIds.includes(id));

      await client.$transaction([
        ...(toRemove.length
          ? [
              client.projectMember.deleteMany({
                where: {
                  projectId: input.id,
                  userId: { in: toRemove },
                },
              }),
            ]
          : []),
        ...toAdd.map((userId) =>
          client.projectMember.create({
            data: {
              projectId: input.id,
              userId,
            },
          })
        ),
      ]);

      // Notify all newly added project members
      if (toAdd.length > 0) {
        const projectName = project.name;
        await Promise.all(
          toAdd.map((userId) =>
            notifyProjectAssigned(
              userId,
              projectName,
              input.id
            ).catch((err) => console.error("[NOTIFY_PROJECT_ASSIGNED]", err))
          )
        );
      }
    }

    const { budgetAmount, budgetHours, estimatedCost, estimatedRevenue, coverImage, ...rest } = project;
    const serializedProject = {
      ...rest,
      budgetAmount: budgetAmount?.toNumber() ?? null,
      budgetHours: budgetHours?.toNumber() ?? null,
      estimatedCost: estimatedCost?.toNumber() ?? null,
      estimatedRevenue: estimatedRevenue?.toNumber() ?? null,
      coverImage: coverImage
        ? Buffer.from(coverImage).toString("base64")
        : null,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.endDate ? new Date(project.endDate) : null,
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : null,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      deletedAt: project.deletedAt ? new Date(project.deletedAt) : null,
    } as any;
    return { status: 200, data: serializedProject, message: "Project updated" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to update project" };
  }
}

export async function onFetchProjectMembers(projectId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const members = await client.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return { status: 200, data: members };
  } catch (error) {
    console.error("[FETCH_PROJECT_MEMBERS]", error);
    return { status: 500, message: "Failed to fetch project members" };
  }
}

export async function onDeleteProject(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    await client.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { status: 200, message: "Project deleted" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to delete project" };
  }
}

export async function onRestoreProject(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const p = await client.project.update({
      where: { id },
      data: { deletedAt: null },
    });
    return { status: 200, data: p, message: "Project restored" };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to restore project" };
  }
}

export async function onGetProject(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const p = await client.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        members: {
          where: { userId: user.id, leftAt: null },
          select: { userId: true },
        },
      },
    });
    
    if (!p) return { status: 404, message: "Not found" };

    // Check access: ADMIN, SALES_FINANCE, project manager, or project member
    const hasAccess =
      user.role === "ADMIN" ||
      user.role === "SALES_FINANCE" ||
      p.projectManagerId === user.id ||
      p.members.length > 0;

    if (!hasAccess) {
      return { status: 403, message: "Forbidden - You don't have access to this project" };
    }
    const { budgetAmount, budgetHours, estimatedCost, estimatedRevenue, coverImage, ...rest } = p;
    const serialized = {
      ...rest,
      budgetAmount: budgetAmount?.toNumber() ?? null,
      budgetHours: budgetHours?.toNumber() ?? null,
      estimatedCost: estimatedCost?.toNumber() ?? null,
      estimatedRevenue: estimatedRevenue?.toNumber() ?? null,
      coverImage: coverImage ? Buffer.from(coverImage).toString("base64") : null,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
      actualEndDate: p.actualEndDate ? new Date(p.actualEndDate) : null,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
    } as any;
    return { status: 200, data: serialized };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Failed to get project" };
  }
}
