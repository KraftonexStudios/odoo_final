"use client";

import { onDeleteProject } from "@/actions/project.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderKanban,
  Search,
  LayoutGrid,
  LayoutList,
  Pencil,
  Trash2,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { base64ToDataUrl } from "@/lib/utils";
import ProjectSheetForm from "@/components/forms/project";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Project, ProjectStatus } from "@prisma/client";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FolderKanban as FolderKanbanIcon } from "lucide-react";

type ViewMode = "list" | "grid";

type SerializedProject = Omit<Project, "budgetAmount" | "budgetHours" | "estimatedCost" | "estimatedRevenue" | "coverImage"> & {
  budgetAmount: number | null;
  budgetHours: number | null;
  estimatedCost: number | null;
  estimatedRevenue: number | null;
  coverImage: string | null; // base64 string
  taskCount?: number;
  expenseCount?: number;
  soCount?: number;
  poCount?: number;
  projectManager?: {
    id: number;
    clerkId: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "ON_HOLD":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
};

export function ProjectsManagementClient({ projects }: { projects: SerializedProject[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredProjects = projects.filter(
    (project) =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    startTransition(async () => {
      const result = await onDeleteProject(id);
      if (result.status === 200) {
        toast.success("Project deleted successfully");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete project");
      }
    });
  };

  return (
    <>
      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name or code..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {projects.filter((p) => p.status === "IN_PROGRESS").length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {projects.filter((p) => p.status === "COMPLETED").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + ((p as any).taskCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Display */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>PM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-96">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FolderKanbanIcon className="h-8 w-8" />
                          </EmptyMedia>
                          <EmptyTitle>No projects found</EmptyTitle>
                          <EmptyDescription>
                            {searchQuery
                              ? `No projects match "${searchQuery}". Try adjusting your search.`
                              : "Get started by creating your first project."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        {project.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {(project as any).projectManager && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                (project as any).projectManager.avatar?.startsWith("data:")
                                  ? (project as any).projectManager.avatar
                                  : (project as any).projectManager.avatar?.startsWith("http")
                                  ? (project as any).projectManager.avatar
                                  : base64ToDataUrl((project as any).projectManager.avatar)
                              }
                            />
                            <AvatarFallback>
                              {(project as any).projectManager.firstName?.[0]}
                              {(project as any).projectManager.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {(project as any).projectManager.firstName}{" "}
                            {(project as any).projectManager.lastName}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.type}</Badge>
                    </TableCell>
                    <TableCell>{(project as any).taskCount || 0}</TableCell>
                    <TableCell className="font-mono">
                      ${project.budgetAmount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isPending}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/projects/${project.id}`}>
                            <DropdownMenuItem>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <ProjectSheetForm
                            mode="edit"
                            project={project as any}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600"
                            disabled={isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderKanbanIcon className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>No projects found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery
                      ? `No projects match "${searchQuery}". Try adjusting your search.`
                      : "Get started by creating your first project."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0 relative">
                <div className="aspect-video bg-muted relative">
                  {project.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={base64ToDataUrl(project.coverImage)}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <FolderKanban className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge variant="outline">{project.type}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-background/80"
                        disabled={isPending}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/admin/projects/${project.id}`}>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </Link>
                      <ProjectSheetForm
                        mode="edit"
                        project={project as any}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600"
                        disabled={isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.code}
                  </p>
                </div>
                {project.endDate && (
                  <div className="text-sm text-muted-foreground">
                    Due: {new Date(project.endDate).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(project as any).projectManager && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            (project as any).projectManager.avatar?.startsWith("data:")
                              ? (project as any).projectManager.avatar
                              : (project as any).projectManager.avatar?.startsWith("http")
                              ? (project as any).projectManager.avatar
                              : base64ToDataUrl((project as any).projectManager.avatar)
                          }
                        />
                        <AvatarFallback>
                          {(project as any).projectManager.firstName?.[0]}
                          {(project as any).projectManager.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(project as any).taskCount || 0} tasks
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )
      )}
    </>
  );
}

