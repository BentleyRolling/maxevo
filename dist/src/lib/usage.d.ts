import { Plan } from "@prisma/client";
export declare function getPlanLimits(plan: Plan, cfg: any): Promise<{
    genius: any;
    qc: any;
}>;
export declare function checkAndDecrement(userId: string, feature: "genius" | "qc", cfg: any): Promise<{
    allowed: boolean;
    remaining: number;
}>;
//# sourceMappingURL=usage.d.ts.map