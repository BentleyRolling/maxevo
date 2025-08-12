import { Router } from "express";
import crypto from "crypto";
import yaml from "yaml";
import fs from "fs";
import { ChatRequestZ } from "../schemas/zod.js";
import { checkAndDecrement } from "../lib/usage.js";
import { unifyVoice } from "../orchestrator/unify.js";
import { runOrchestrated } from "../orchestrator/agents/coordinator.js";
import { planQueries } from "../orchestrator/genius/plan.js";
import { searchAndFetch } from "../orchestrator/genius/search.js";
import { rankClusterDedup } from "../orchestrator/genius/rank.js";
import { summarizeSources } from "../orchestrator/genius/summarize.js";
import { synthesizeAnswer } from "../orchestrator/genius/synthesize.js";
import { quickQC } from "../orchestrator/qc/quick.js";
import { deepQC } from "../orchestrator/qc/deep.js";
import { applyRepairs } from "../orchestrator/qc/repair.js";
export const chat = Router();
// Load policy configuration
const policy = yaml.parse(fs.readFileSync("src/config/policy.yaml", "utf8"));
chat.post("/api/chat", async (req, res) => {
    try {
        const body = ChatRequestZ.parse(req.body);
        const userId = req.headers["x-user-id"] || "";
        if (!userId) {
            return res.status(401).json({
                error: true,
                code: "UNAUTHORIZED",
                message: "User ID required"
            });
        }
        // Check usage limits
        if (body.genius_mode) {
            const r = await checkAndDecrement(userId, "genius", policy);
            if (!r.allowed) {
                return res.status(402).json({
                    error: true,
                    code: "LIMIT_EXCEEDED",
                    feature: "genius",
                    message: "Genius mode limit exceeded"
                });
            }
        }
        if (body.honesty_mode) {
            const r = await checkAndDecrement(userId, "genius", policy);
            if (!r.allowed) {
                return res.status(402).json({
                    error: true,
                    code: "LIMIT_EXCEEDED",
                    feature: "honesty",
                    message: "Honesty mode limit exceeded"
                });
            }
        }
        if (body.qc_mode !== "off") {
            const r = await checkAndDecrement(userId, "qc", policy);
            if (!r.allowed) {
                return res.status(402).json({
                    error: true,
                    code: "LIMIT_EXCEEDED",
                    feature: "qc",
                    message: "QC mode limit exceeded"
                });
            }
        }
        const startTime = Date.now();
        let draftText = "";
        let widgets = [];
        // Execute main pipeline
        if (body.genius_mode) {
            // Genius Mode: Deep research pipeline
            const plan = planQueries(body.messages);
            const sources = await searchAndFetch(plan);
            const rankedSources = rankClusterDedup(sources, plan);
            const summaries = await summarizeSources(rankedSources);
            draftText = synthesizeAnswer(body.messages, summaries);
            // Generate research widgets
            widgets = [{
                    id: "research-sources",
                    type: "CardList",
                    data: {
                        items: rankedSources.slice(0, 5).map(s => ({
                            title: s.title,
                            subtitle: s.source,
                            url: s.url
                        }))
                    }
                }];
        }
        else {
            // Standard orchestrated execution
            const result = await runOrchestrated("respond", { messages: body.messages }, { qc: body.qc_mode, honestyMode: body.honesty_mode });
            draftText = result.text;
            widgets = result.widgets || [];
        }
        // Apply QC if enabled
        if (body.qc_mode === "quick") {
            const qcResult = await quickQC(draftText);
            if (!qcResult.pass) {
                draftText = await applyRepairs(draftText, qcResult.minimal_fixes);
            }
        }
        else if (body.qc_mode === "deep") {
            const qcResult = await deepQC(draftText, { messages: body.messages });
            if (!qcResult.pass) {
                // For deep QC, add confidence information to response
                widgets.push({
                    id: "qc-analysis",
                    type: "Table",
                    data: {
                        columns: ["Metric", "Value"],
                        rows: [
                            { Metric: "Confidence", Value: `${Math.round(qcResult.confidence * 100)}%` },
                            { Metric: "Issues Found", Value: qcResult.reasons.length.toString() },
                            { Metric: "Sources Checked", Value: qcResult.evidence.length.toString() }
                        ]
                    }
                });
            }
        }
        // Apply voice unification
        const finalText = unifyVoice(draftText, { honesty: body.honesty_mode });
        // Build response envelope
        const response = {
            agent: "Max",
            message: finalText,
            workspace: {
                jobId: crypto.randomUUID(),
                widgets,
                suggestedActions: widgets.length > 0 ? [{ id: "export" }] : undefined
            },
            meta: {
                latency_ms: Date.now() - startTime,
                tokens_estimated: Math.floor(finalText.length / 4), // Rough estimate
                models_used: body.genius_mode ? ["genius-pipeline"] : ["standard-orchestrator"]
            }
        };
        return res.json(response);
    }
    catch (e) {
        console.error("Chat API error:", e);
        return res.status(400).json({
            error: true,
            code: "INVALID_REQUEST",
            message: e.message || "Request processing failed"
        });
    }
});
//# sourceMappingURL=chat.js.map