import { PrismaClient } from "@prisma/client";
import type { Plan } from "@prisma/client";
const prisma = new PrismaClient();

export async function getPlanLimits(plan: Plan, cfg: any) {
  const key = String(plan).toLowerCase();
  const p = cfg.plans[key] ?? cfg.plans["free"];
  return { genius: p.genius_monthly, qc: p.qc_monthly };
}

export async function checkAndDecrement(userId: string, feature: "genius"|"qc", cfg: any) {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`;
  
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { counters: true } 
  });
  
  if (!user) throw new Error("UNAUTHORIZED");
  
  const limits = await getPlanLimits(user.plan, cfg);

  const c = await prisma.counter.upsert({
    where: { userId },
    update: {},
    create: { userId, monthKey },
  });

  const used = feature === "genius" ? c.geniusUsed : c.qcUsed;
  const limit = feature === "genius" ? limits.genius : limits.qc;
  
  if (used >= limit) return { allowed: false, remaining: 0 };

  await prisma.counter.update({
    where: { userId },
    data: feature === "genius"
      ? { geniusUsed: { increment: 1 }, monthKey }
      : { qcUsed: { increment: 1 }, monthKey },
  });
  
  return { allowed: true, remaining: Math.max(0, limit - (used + 1)) };
}