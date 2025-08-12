import { quickQC } from "../qc/quick.js";
import { deepQC } from "../qc/deep.js";

export async function executeVerify(
  text: string, 
  context: any
): Promise<{
  verified: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
}> {
  const qcMode = context.qc_mode || "quick";
  
  try {
    if (qcMode === "quick") {
      const result = await quickQC(text);
      return {
        verified: result.pass,
        confidence: result.pass ? 0.8 : 0.4,
        issues: result.reasons,
        suggestions: result.minimal_fixes
      };
    } else if (qcMode === "deep") {
      const result = await deepQC(text, context);
      return {
        verified: result.pass,
        confidence: result.confidence,
        issues: result.reasons,
        suggestions: result.evidence.map((e: any) => `Verified against: ${e.title}`).slice(0, 3)
      };
    }
    
    // Fallback
    return {
      verified: true,
      confidence: 0.7,
      issues: [],
      suggestions: []
    };
  } catch (error) {
    return {
      verified: false,
      confidence: 0.1,
      issues: [`Verification failed: ${(error as Error).message}`],
      suggestions: ["Retry verification with different parameters"]
    };
  }
}