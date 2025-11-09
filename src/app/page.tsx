import { redirect } from "next/navigation";
import { onAuthenticatedUser } from "@/actions/auth.action";

export default async function Home() {
  const user = await onAuthenticatedUser();

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/dashboard/projects");
}
