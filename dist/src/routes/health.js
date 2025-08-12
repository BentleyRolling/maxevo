import { Router } from "express";
import { getQueueStatus } from "../scheduler/queue.js";
export const health = Router();
health.get("/api/health", async (req, res) => {
    try {
        const queueStatus = getQueueStatus();
        // TODO: Add checks for external services (database, Serper API, etc.)
        const checks = {
            database: await checkDatabase(),
            serper_api: checkSerperAPI(),
            scheduler: {
                status: "operational",
                ...queueStatus
            },
            models: {
                status: "operational", // TODO: Add model availability checks
                configured: ["openai:gpt-4o-mini", "anthropic:claude-3.5-sonnet", "anthropic:claude-3.5-haiku", "openai:gpt-4.1"]
            }
        };
        const allHealthy = Object.values(checks).every(check => typeof check === 'object' ? check.status === "operational" : check);
        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            checks
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});
async function checkDatabase() {
    try {
        const start = Date.now();
        // TODO: Add actual database ping
        const latency_ms = Date.now() - start;
        return { status: "operational", latency_ms };
    }
    catch (error) {
        return { status: "error" };
    }
}
function checkSerperAPI() {
    return {
        status: process.env.SERPER_API_KEY ? "operational" : "not_configured",
        configured: !!process.env.SERPER_API_KEY
    };
}
//# sourceMappingURL=health.js.map