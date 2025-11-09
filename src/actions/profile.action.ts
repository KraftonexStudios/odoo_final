"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { client as prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { normalizeRole } from "@/lib/utils";

export const onGetCurrentUser = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { status: 401, message: "Unauthorized" };
    }

    // Get user from Clerk
    const clerkUser = await (await clerkClient()).users.getUser(userId);

    // Get user from Prisma using clerkId
    const prismaUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        hourlyRate: true,
      },
    });

    const user = {
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: prismaUser?.firstName || clerkUser.firstName || "",
      lastName: prismaUser?.lastName || clerkUser.lastName || "",
      avatar: prismaUser?.avatar || clerkUser.imageUrl || "",
      role: normalizeRole(clerkUser.publicMetadata.role as string | string[]),
      hourlyRate: prismaUser?.hourlyRate ? Number(prismaUser.hourlyRate) : 0,
    };

    return { status: 200, data: user };
  } catch (error) {
    console.error("[GET_CURRENT_USER]", error);
    return { status: 500, message: "Internal server error" };
  }
};

export const onUpdateProfile = async (data: {
  firstName: string;
  lastName: string;
  avatar?: string | null;
}) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { status: 401, message: "Unauthorized" };
    }

    // Update in Clerk
    await (await clerkClient()).users.updateUser(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Get user email for creation
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";

    // Update/Create in Prisma using clerkId
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar || null,
      },
      create: {
        clerkId: userId,
        email: email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar || null,
      },
    });

    revalidatePath("/");
    return { status: 200, message: "Profile updated successfully" };
  } catch (error) {
    console.error("[UPDATE_PROFILE]", error);
    return { status: 500, message: "Failed to update profile" };
  }
};

export const onUploadProfileImage = async (formData: FormData) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { status: 401, message: "Unauthorized" };
    }

    const file = formData.get("avatar") as File;
    if (!file) {
      return { status: 400, message: "No file provided" };
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Get user email for creation
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";

    // Update in Prisma using clerkId
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: { avatar: base64 },
      create: { 
        clerkId: userId, 
        email: email,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        avatar: base64 
      },
    });

    revalidatePath("/profile");
    revalidatePath("/");
    return { status: 200, message: "Profile image updated successfully", data: base64 };
  } catch (error) {
    console.error("[UPLOAD_PROFILE_IMAGE]", error);
    return { status: 500, message: "Failed to upload profile image" };
  }
};

