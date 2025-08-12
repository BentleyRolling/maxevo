type Role = "bulk_low_risk" | "coder_executor" | "cheap_qc" | "tool_calling_strict" | "adjudicator";
export declare function estimateUSD(modelKey: string, inTok: number, outTok: number): number;
export declare function pickModelForRole(role: Role): string;
export {};
//# sourceMappingURL=router.d.ts.map