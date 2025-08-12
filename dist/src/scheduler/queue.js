import cron from "node-cron";
import { handleJob } from "./jobs.js";
const inMemQueue = [];
let isProcessing = false;
export function schedule(job) {
    inMemQueue.push(job);
}
export function getQueueStatus() {
    return { pending: inMemQueue.length, processing: isProcessing };
}
export function getJob(id) {
    return inMemQueue.find(j => j.id === id);
}
export function removeJob(id) {
    const index = inMemQueue.findIndex(j => j.id === id);
    if (index !== -1) {
        inMemQueue.splice(index, 1);
        return true;
    }
    return false;
}
// Process jobs every minute
cron.schedule("*/1 * * * *", async () => {
    if (isProcessing)
        return; // Prevent overlapping runs
    isProcessing = true;
    const now = Date.now();
    try {
        // Find jobs that are ready to run
        const readyJobs = inMemQueue.filter(j => !j.runAt || j.runAt.getTime() <= now);
        // Process ready jobs
        for (const job of readyJobs) {
            try {
                console.log(`Processing job ${job.id} of type ${job.type}`);
                await handleJob(job);
                // Remove completed job from queue
                const index = inMemQueue.indexOf(job);
                if (index !== -1) {
                    inMemQueue.splice(index, 1);
                }
            }
            catch (error) {
                console.error(`Job ${job.id} failed:`, error);
                // Keep failed jobs in queue for now (could implement retry logic)
            }
        }
    }
    finally {
        isProcessing = false;
    }
});
// Initial log
console.log("Task scheduler initialized - checking every minute for pending jobs");
//# sourceMappingURL=queue.js.map