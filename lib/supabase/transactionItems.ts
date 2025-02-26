"use server"

import prisma from "@/utils/db"
import { TransactionItemCreateInput, TransactionItemUpdateInput } from "@/types/transactionItems"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { revalidatePath } from "next/cache"
import { Decimal } from "@prisma/client/runtime/library"

// Helper function to convert Decimal to number and handle dates
const convertDecimalToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  
  if (obj instanceof Decimal) {
    return Number(obj)
  }

  if (obj instanceof Date) {
    return obj.toISOString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDecimalToNumber)
  }
  
  const converted: any = {}
  for (const key in obj) {
    converted[key] = convertDecimalToNumber(obj[key])
  }
  return converted
}

export async function addTransactionItem(
  transactionId: string,
  data: TransactionItemCreateInput
) {
  try {
    const { getOrganization } = getKindeServerSession()
    const org = await getOrganization()
    
    if (!org?.orgCode) throw new Error("No organization found")

    const item = await prisma.transactionItems.create({
      data: {
        ...data,
        transaction_id: transactionId,
      },
      include: {
        item: {
          select: {
            name: true,
            sku: true,
            unit_of_measure: true,
          },
        },
      },
    })

    // Update transaction total
    await updateTransactionTotal(transactionId)
    
    revalidatePath(`/dashboard/transactions/${transactionId}`)
    return { data: convertDecimalToNumber(item), error: null }
  } catch (error) {
    console.error('Error adding transaction item:', error)
    return { data: null, error: 'Failed to add item' }
  }
}

export async function updateTransactionItem(
  id: string,
  data: TransactionItemUpdateInput
) {
  try {
    const item = await prisma.transactionItems.update({
      where: { id },
      data,
      include: {
        item: {
          select: {
            name: true,
            sku: true,
            unit_of_measure: true,
          },
        },
      },
    })

    // Update transaction total
    await updateTransactionTotal(item.transaction_id)
    
    revalidatePath(`/dashboard/transactions/${item.transaction_id}`)
    return { data: convertDecimalToNumber(item), error: null }
  } catch (error) {
    console.error('Error updating transaction item:', error)
    return { data: null, error: 'Failed to update item' }
  }
}

export async function deleteTransactionItem(id: string) {
  try {
    const item = await prisma.transactionItems.delete({
      where: { id },
    })

    // Update transaction total
    await updateTransactionTotal(item.transaction_id)
    
    revalidatePath(`/dashboard/transactions/${item.transaction_id}`)
    return { error: null }
  } catch (error) {
    console.error('Error deleting transaction item:', error)
    return { error: 'Failed to delete item' }
  }
}

async function updateTransactionTotal(transactionId: string) {
  const items = await prisma.transactionItems.findMany({
    where: { transaction_id: transactionId },
  })

  const total = items.reduce((sum, item) => sum + Number(item.total), 0)

  await prisma.transactions.update({
    where: { id: transactionId },
    data: { total },
  })
} 