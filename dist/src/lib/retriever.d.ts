export type Retrieved = {
    url: string;
    title: string;
    snippet?: string;
    published_at?: string;
    source?: string;
    text?: string;
};
export declare function searchWeb(q: string): Promise<Retrieved[]>;
export declare function searchNews(q: string): Promise<Retrieved[]>;
export declare function fetchAndCache(key: string, fn: () => Promise<any>): Promise<any>;
export declare function normKey(obj: any): string;
//# sourceMappingURL=retriever.d.ts.map