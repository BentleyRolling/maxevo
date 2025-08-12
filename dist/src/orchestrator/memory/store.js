import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function remember(userId, key, value, tags = []) {
    await prisma.memory.create({
        data: {
            userId,
            key,
            value: JSON.stringify(value),
            tags
        }
    });
}
export async function recall(userId, key) {
    const m = await prisma.memory.findFirst({
        where: { userId, key },
        orderBy: { updatedAt: "desc" }
    });
    return m ? JSON.parse(m.value) : null;
}
export async function recallByTags(userId, tags, limit = 10) {
    const memories = await prisma.memory.findMany({
        where: {
            userId,
            tags: { hasSome: tags }
        },
        orderBy: { updatedAt: "desc" },
        take: limit
    });
    return memories.map(m => ({
        key: m.key,
        value: JSON.parse(m.value),
        tags: m.tags,
        updatedAt: m.updatedAt
    }));
}
export async function updateMemory(userId, key, value, tags) {
    await prisma.memory.updateMany({
        where: { userId, key },
        data: {
            value: JSON.stringify(value),
            ...(tags && { tags }),
            updatedAt: new Date()
        }
    });
}
export async function forgetMemory(userId, key) {
    await prisma.memory.deleteMany({
        where: { userId, key }
    });
}
//# sourceMappingURL=store.js.map