import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function remember(
  userId: string, 
  key: string, 
  value: any, 
  tags: string[] = []
): Promise<void> {
  await prisma.memory.create({ 
    data: { 
      userId, 
      key, 
      value: JSON.stringify(value), 
      tags 
    } 
  });
}

export async function recall(userId: string, key: string): Promise<any> {
  const m = await prisma.memory.findFirst({ 
    where: { userId, key }, 
    orderBy: { updatedAt: "desc" } 
  });
  
  return m ? JSON.parse(m.value) : null;
}

export async function recallByTags(
  userId: string, 
  tags: string[], 
  limit: number = 10
): Promise<Array<{ key: string; value: any; tags: string[]; updatedAt: Date }>> {
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      tags: { hasSome: tags }
    },
    orderBy: { updatedAt: "desc" },
    take: limit
  });
  
  return memories.map((m: any) => ({
    key: m.key,
    value: JSON.parse(m.value),
    tags: m.tags,
    updatedAt: m.updatedAt
  }));
}

export async function updateMemory(
  userId: string, 
  key: string, 
  value: any, 
  tags?: string[]
): Promise<void> {
  await prisma.memory.updateMany({
    where: { userId, key },
    data: { 
      value: JSON.stringify(value),
      ...(tags && { tags }),
      updatedAt: new Date()
    }
  });
}

export async function forgetMemory(userId: string, key: string): Promise<void> {
  await prisma.memory.deleteMany({
    where: { userId, key }
  });
}