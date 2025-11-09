"use server";
import { client } from "@/lib/prisma/client";
import { users } from "@clerk/clerk-sdk-node"; // Clerk server SDK
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client/index-browser";

export const onAuthenticatedUser = async () => {
  try {
    const clerk = await currentUser();
    if (!clerk) return { status: 404, message: "User not found" };

    const user = await client.user.findUnique({
      where: {
        clerkId: clerk.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });

    if (user)
      return {
        id: user.id,
        clerkId: clerk.id,
        image: user.avatar,
        name: user.firstName + " " + user.lastName,
        role: user.role,
        status: 200,
      };
    return {
      status: 404,
      message: "User not found",
    };
  } catch (error) {
    console.error("[AUTH_GET_USER]", error);
    return {
      status: 400,
      message: "User not found",
    };
  }
};

// Create a new user in the database
export const onSignupUser = async ({
  firstName,
  lastName,
  email,
  clerkUserId,
  role = "TEAM_MEMBER",
}: {
  firstName: string;
  lastName: string;
  email: string;
  clerkUserId: string;
  role: UserRole;
}) => {
  try {
    const user = await client.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email,
        clerkId: clerkUserId,
        role,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User created successfully",
        status: 200,
      };
    } else {
      return {
        success: false,
        message: "User creation failed",
        status: 400,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export async function updateClerkUserMetadata(clerkId: string, role: UserRole) {
  try {
    await users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: role, // Store as string, not array
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error };
  }
}
