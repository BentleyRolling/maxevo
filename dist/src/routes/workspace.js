import { Router } from "express";
export const workspace = Router();
workspace.get("/v1/workspace/stream/:jobId", async (req, res) => {
    const { jobId } = req.params;
    // Set up SSE headers
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control"
    });
    const send = (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    // Send initial event
    send({
        jobId,
        widgets: [],
        ts: Date.now()
    });
    // Send heartbeat every 15 seconds to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
    }, 15000);
    // TODO: Subscribe to actual workspace updates for this jobId
    // For now, send a sample update after 2 seconds
    setTimeout(() => {
        send({
            jobId,
            widgets: [{
                    id: "status",
                    type: "RichText",
                    data: { html: "<p>Workspace is ready and monitoring for updates.</p>" }
                }],
            suggestedActions: [{ id: "retry" }],
            ts: Date.now()
        });
    }, 2000);
    // Clean up on client disconnect
    req.on("close", () => {
        clearInterval(heartbeat);
        res.end();
    });
    req.on("error", (err) => {
        console.error("SSE connection error:", err);
        clearInterval(heartbeat);
        res.end();
    });
});
//# sourceMappingURL=workspace.js.map