import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = createRouteMatcher([
  "/sign-in",
  "/sign-up",
  "/reset-pass(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl.clone();

  // When the path is root
  if (url.pathname === "/") {
    const session = await auth();
    if (!session.userId) {
      // Not logged in, redirect to sign-in page
      return NextResponse.redirect(new URL("/sign-in", req.url));
    } else {
      // Logged in, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  const isPublic = publicRoutes(req);
  const session = await auth();

  if (session.userId && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublic) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)", "/(api|trpc)(.*)"],
};