"use server";
import { client as prisma } from "@/lib/prisma/client";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { revalidatePath } from "next/cache";

export async function onGetAttachmentsByTask(taskId: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return { status: 200, data: attachments };
  } catch (error) {
    console.error("[GET_ATTACHMENTS]", error);
    return { status: 500, message: "Failed to fetch attachments" };
  }
}

type CreateAttachmentInput = {
  taskId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
};

export async function onCreateAttachment(input: CreateAttachmentInput) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    const attachment = await prisma.attachment.create({
      data: {
        taskId: input.taskId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        uploadedBy: user.id as number,
      },
    });

    revalidatePath(`/dashboard/projects/[id]/tasks`);
    return { status: 201, data: attachment, message: "Attachment uploaded" };
  } catch (error) {
    console.error("[CREATE_ATTACHMENT]", error);
    return { status: 500, message: "Failed to upload attachment" };
  }
}

export async function onDeleteAttachment(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) return { status: 401, message: "Unauthorized" };

    // Check if user owns the attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      select: { uploadedBy: true },
    });

    if (!attachment) return { status: 404, message: "Attachment not found" };

    // Only allow deletion by uploader or admin
    if (attachment.uploadedBy !== user.id && user.role !== "ADMIN") {
      return { status: 403, message: "Forbidden - You can only delete your own attachments" };
    }

    await prisma.attachment.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/projects/[id]/tasks`);
    return { status: 200, message: "Attachment deleted" };
  } catch (error) {
    console.error("[DELETE_ATTACHMENT]", error);
    return { status: 500, message: "Failed to delete attachment" };
  }
}

