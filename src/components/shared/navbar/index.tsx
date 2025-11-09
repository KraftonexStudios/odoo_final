"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NotificationsDialog } from "../notifications";
import {
  mainNavigation,
} from "@/lib/navigation-config";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ProfileDropdown } from "@/components/shared/profile-dropdown";
import { useUser } from "@clerk/nextjs";
import { normalizeRole } from "@/lib/utils";

const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const userRole = normalizeRole(user?.publicMetadata?.role as string | string[]);
  
  // Filter navigation items based on role
  const filteredNav = mainNavigation.filter((item) => {
    // If no roles specified, only show to ADMIN
    if (!item.roles) {
      return userRole === "ADMIN";
    }
    return item.roles.includes(userRole);
  });

  return (
    <nav className="sticky top-0 z-50 h-16 bg-background border-b">
      <div className="h-full flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <NotificationsDialog />
          <ProfileDropdown />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
