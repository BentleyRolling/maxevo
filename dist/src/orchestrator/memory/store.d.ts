export declare function remember(userId: string, key: string, value: any, tags?: string[]): Promise<void>;
export declare function recall(userId: string, key: string): Promise<any>;
export declare function recallByTags(userId: string, tags: string[], limit?: number): Promise<Array<{
    key: string;
    value: any;
    tags: string[];
    updatedAt: Date;
}>>;
export declare function updateMemory(userId: string, key: string, value: any, tags?: string[]): Promise<void>;
export declare function forgetMemory(userId: string, key: string): Promise<void>;
//# sourceMappingURL=store.d.ts.map