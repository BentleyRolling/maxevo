import yaml from "yaml";
import fs from "fs";
const cfg = yaml.parse(fs.readFileSync("src/config/models.yaml", "utf8"));
const models = cfg.models;
export function estimateUSD(modelKey, inTok, outTok) {
    const m = models[modelKey];
    if (!m)
        throw new Error(`Model ${modelKey} not found`);
    return (inTok / 1000) * m.cost.input_per_1k + (outTok / 1000) * m.cost.output_per_1k;
}
export function pickModelForRole(role) {
    const candidates = Object.entries(models).filter(([_, m]) => m.role === role);
    candidates.sort((a, b) => (a[1].cost.input_per_1k + a[1].cost.output_per_1k) -
        (b[1].cost.input_per_1k + b[1].cost.output_per_1k));
    if (!candidates.length)
        throw new Error(`No model for role ${role}`);
    return candidates[0][0];
}
//# sourceMappingURL=router.js.map