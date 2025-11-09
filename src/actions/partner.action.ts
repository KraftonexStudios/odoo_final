"use server";
import { client as prisma } from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { PartnerType } from "@prisma/client/index.js";
import { revalidatePath } from "next/cache";

type CreatePartnerInput = {
  name: string;
  type: PartnerType;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTermDays?: number;
};

type UpdatePartnerInput = CreatePartnerInput & { id: number };

export async function onFetchAllPartners() {
  try {
    const { userId } = await auth();
    if (!userId) return { status: 401, message: "Unauthorized" };

    const partners = await prisma.partner.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            salesOrders: true,
            purchaseOrders: true,
            customerInvoices: true,
            vendorBills: true,
          },
        },
      },
    });

    return { status: 200, data: partners };
  } catch (error) {
    console.error("[FETCH_ALL_PARTNERS]", error);
    return { status: 500, message: "Failed to fetch partners" };
  }
}

export async function onFetchPartnersByType(type: PartnerType) {
  try {
    const { userId } = await auth();
    if (!userId) return { status: 401, message: "Unauthorized" };

    const partners = await prisma.partner.findMany({
      where: {
        OR: [{ type }, { type: "BOTH" }],
      },
      orderBy: { name: "asc" },
    });

    return { status: 200, data: partners };
  } catch (error) {
    console.error("[FETCH_PARTNERS_BY_TYPE]", error);
    return { status: 500, message: "Failed to fetch partners" };
  }
}

export async function onCreatePartner(input: CreatePartnerInput) {
  try {
    const { userId } = await auth();
    if (!userId) return { status: 401, message: "Unauthorized" };

    const partner = await prisma.partner.create({
      data: {
        name: input.name,
        type: input.type,
        email: input.email,
        phone: input.phone,
        address: input.address,
        taxId: input.taxId,
        paymentTermDays: input.paymentTermDays ?? 30,
      },
    });

    revalidatePath("/settings/partners");
    return { status: 201, data: partner, message: "Partner created successfully" };
  } catch (error) {
    console.error("[CREATE_PARTNER]", error);
    return { status: 500, message: "Failed to create partner" };
  }
}

export async function onUpdatePartner(input: UpdatePartnerInput) {
  try {
    const { userId } = await auth();
    if (!userId) return { status: 401, message: "Unauthorized" };

    const partner = await prisma.partner.update({
      where: { id: input.id },
      data: {
        name: input.name,
        type: input.type,
        email: input.email,
        phone: input.phone,
        address: input.address,
        taxId: input.taxId,
        paymentTermDays: input.paymentTermDays,
      },
    });

    revalidatePath("/settings/partners");
    return { status: 200, data: partner, message: "Partner updated successfully" };
  } catch (error) {
    console.error("[UPDATE_PARTNER]", error);
    return { status: 500, message: "Failed to update partner" };
  }
}

export async function onDeletePartner(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { status: 401, message: "Unauthorized" };

    await prisma.partner.delete({
      where: { id },
    });

    revalidatePath("/settings/partners");
    return { status: 200, message: "Partner deleted successfully" };
  } catch (error) {
    console.error("[DELETE_PARTNER]", error);
    return { status: 500, message: "Failed to delete partner" };
  }
}
