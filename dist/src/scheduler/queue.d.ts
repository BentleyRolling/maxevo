type Job = {
    id: string;
    type: string;
    runAt?: Date;
    payload: any;
};
export declare function schedule(job: Job): void;
export declare function getQueueStatus(): {
    pending: number;
    processing: boolean;
};
export declare function getJob(id: string): Job | undefined;
export declare function removeJob(id: string): boolean;
export {};
//# sourceMappingURL=queue.d.ts.map