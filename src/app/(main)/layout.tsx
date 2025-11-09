import Navbar from "@/components/shared/navbar";
import React from "react";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

const MainLayout = async ({ children }: Props) => {
  const user = await onAuthenticatedUser();
  

  if (user?.role === "ADMIN" ) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
