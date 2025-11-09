import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Middleware handles role-based routing
  // This is just a fallback redirect
  redirect("/dashboard/projects");
}
