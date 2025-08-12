import yaml from "yaml";
import fs from "fs";

type Role = "bulk_low_risk"|"coder_executor"|"cheap_qc"|"tool_calling_strict"|"adjudicator";

type ModelCfg = { 
  role: Role; 
  max_context: number; 
  cost: { input_per_1k: number; output_per_1k: number }
};

const cfg = yaml.parse(fs.readFileSync("src/config/models.yaml", "utf8"));
const models: Record<string, ModelCfg> = cfg.models;

export function estimateUSD(modelKey: string, inTok: number, outTok: number) {
  const m = models[modelKey];
  if (!m) throw new Error(`Model ${modelKey} not found`);
  return (inTok/1000) * m.cost.input_per_1k + (outTok/1000) * m.cost.output_per_1k;
}

export function pickModelForRole(role: Role) {
  const candidates = Object.entries(models).filter(([_, m]) => m.role === role);
  candidates.sort((a, b) => 
    (a[1].cost.input_per_1k + a[1].cost.output_per_1k) - 
    (b[1].cost.input_per_1k + b[1].cost.output_per_1k)
  );
  
  if (!candidates.length) throw new Error(`No model for role ${role}`);
  return candidates[0][0];
}