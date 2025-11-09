import { onAuthenticatedUser } from "@/actions/auth.action";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const AdminLayout = async ({ children }: Props) => {
  noStore(); // Prevent static generation
  const user = await onAuthenticatedUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard/projects");
  }
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
