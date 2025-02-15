"use server"

import prisma from "@/utils/db"
import { Item } from "@/types/items"
import { revalidatePath } from "next/cache"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { DimensionUnit, WeightUnit } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export async function getItems() {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    const items = await prisma.items.findMany({
      where: {
        org_id: org.orgCode
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching items:', error)
    return { data: null, error: 'Failed to fetch items' }
  }
}

export async function createItem(data: Partial<Item>) {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    const itemData = {
      name: data.name!,
      sku: data.sku!,
      type: data.type!,
      unit_of_measure: data.unit_of_measure!,
      description: data.description,
      status: data.status || 'DRAFT',
      org_id: org.orgCode,
      ...(data.price && { price: new Decimal(data.price) }),
      ...(data.weight && { weight: new Decimal(data.weight) }),
      ...(data.weight_unit && { weight_unit: data.weight_unit as WeightUnit }),
      ...(data.length && { length: new Decimal(data.length) }),
      ...(data.width && { width: new Decimal(data.width) }),
      ...(data.depth && { depth: new Decimal(data.depth) }),
      ...(data.length_unit && { length_unit: data.length_unit as DimensionUnit }),
      ...(data.width_unit && { width_unit: data.width_unit as DimensionUnit }),
      ...(data.depth_unit && { depth_unit: data.depth_unit as DimensionUnit }),
    }

    const item = await prisma.items.create({
      data: itemData,
    })
    revalidatePath('/dashboard/items')
    return { data: item, error: null }
  } catch (error) {
    console.error('Error creating item:', error)
    return { data: null, error: 'Failed to create item' }
  }
}

export async function updateItem(id: string, data: Partial<Item>) {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    // Only include defined fields in the update
    const updateData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const item = await prisma.items.update({
      where: { 
        id,
        org_id: org.orgCode
      },
      data: updateData,
    })
    revalidatePath('/dashboard/items')
    return { data: item, error: null }
  } catch (error) {
    console.error('Error updating item:', error)
    return { data: null, error: 'Failed to update item' }
  }
}

export async function deleteItem(id: string) {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    await prisma.items.delete({
      where: { 
        id,
        org_id: org.orgCode // Ensure users can only delete their org's items
      },
    })
    revalidatePath('/dashboard/items')
    return { error: null }
  } catch (error) {
    console.error('Error deleting item:', error)
    return { error: 'Failed to delete item' }
  }
}

export async function getItemById(id: string) {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    const item = await prisma.items.findUnique({
      where: { 
        id,
        org_id: org.orgCode // Ensure users can only view their org's items
      },
    })
    return { data: item, error: null }
  } catch (error) {
    console.error('Error fetching item:', error)
    return { data: null, error: 'Failed to fetch item' }
  }
}

export async function createInitialItem(orgId: string, orgName: string) {
  try {
    const item = await prisma.items.create({
      data: {
        org_id: orgId,
        name: `${orgName}'s First Product!`,
        description: "This is your first product! Edit or delete it to get started.",
        sku: "FIRST-001",
        type: "PHYSICAL",
        price: "9.99",
        status: "ACTIVE",
        unit_of_measure: "EACH",
        weight: "1",
        weight_unit: "POUND",
        length: "10",
        width: "10",
        depth: "10",
        length_unit: "INCH",
        width_unit: "INCH", 
        depth_unit: "INCH",
        front_image_url: "https://aftkzcdfjeidbfutfhfw.supabase.co/storage/v1/object/public/media//FirstProductImage.png",
        tags: ["first", "sample"],
        metadata: {
          isInitialItem: true
        }
      }
    })

    return { data: item, error: null }
  } catch (error) {
    console.error('Error creating initial item:', error)
    return { data: null, error: 'Failed to create initial item' }
  }
}

export async function getItemTransactions(itemId: string) {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    const transactions = await prisma.transactionItems.findMany({
      where: {
        item_id: itemId,
        item: {
          org_id: org.orgCode
        }
      },
      include: {
        transaction: true,
        item: {
          select: {
            name: true,
            sku: true
          }
        }
      },
    })

    return { 
      data: transactions.map(transaction => ({
        ...transaction,
        unit_price: Number(transaction.unit_price),
        total: Number(transaction.total),
        discount: transaction.discount ? Number(transaction.discount) : null
      })), 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching item transactions:', error)
    return { data: null, error: 'Failed to fetch item transactions' }
  }
}
