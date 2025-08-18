import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { chat } from "./src/routes/chat.js";
import { workspace } from "./src/routes/workspace.js";
import { health } from "./src/routes/health.js";

// Import scheduler to initialize cron jobs
import "./src/scheduler/queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from maxevo-ui build directory
app.use(express.static(path.join(__dirname, 'maxevo-ui/dist')));

// API Routes
app.use(chat);
app.use(workspace);
app.use(health);

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "MaxEvo AI Agent Platform",
    version: "1.0.0",
    agent: "Max",
    capabilities: [
      "genius_mode",
      "qc_mode",
      "honesty_mode",
      "multi_agent_orchestration",
      "persistent_memory",
      "task_scheduling",
      "workspace_integration"
    ],
    endpoints: {
      chat: "/api/chat",
      workspace_stream: "/v1/workspace/stream/:jobId",
      health: "/api/health"
    }
  });
});

// Serve MaxEvo UI for all other routes (SPA fallback)
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, 'maxevo-ui/dist/index.html');
  console.log(`Serving SPA for ${req.path}, index.html path: ${indexPath}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`Error serving index.html: ${err.message}`);
      console.error(`Current working directory: ${process.cwd()}`);
      console.error(`__dirname: ${__dirname}`);
      console.error(`Looking for file at: ${indexPath}`);
      res.status(500).json({
        error: true,
        code: "UI_NOT_FOUND",
        message: "MaxEvo UI not found. Build may have failed.",
        debug: {
          path: indexPath,
          cwd: process.cwd(),
          dirname: __dirname
        }
      });
    }
  });
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: true,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred"
  });
});

// 404 handler for missing static files
app.use((req: any, res: any, next: any) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MaxEvo server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🔄 Workspace Stream: http://localhost:${PORT}/v1/workspace/stream/:jobId`);
  
  // Show required environment variables
  console.log("\n📋 Environment check:");
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Not set'}`);
  console.log(`SERPER_API_KEY: ${process.env.SERPER_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`MAXEVO_DATA_DIR: ${process.env.MAXEVO_DATA_DIR || '/data (default)'}`);
});