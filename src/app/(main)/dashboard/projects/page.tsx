
import { onFetchProjects } from "@/actions/project.action";
import { ProjectsClient } from "./client";
import { unstable_noStore as noStore } from "next/cache";

export default async function ProjectsPage() {
  noStore(); // Prevent static generation
  
  const result = await onFetchProjects();
  const projects = result.status === 200 ? (result.data || []) : [];

  console.log("[DASHBOARD_PROJECTS] Result:", result.status, "Projects count:", projects.length);

  return <ProjectsClient projects={projects} />;
}
