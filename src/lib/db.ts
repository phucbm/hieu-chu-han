import Dexie, { type Table } from "dexie";

export interface AIExplanation {
    simp: string;
    content: string;
    model: string;
    generatedAt: number;
}

export interface AIUsageLog {
    id?: number;
    calledAt: number;
}

class HchDatabase extends Dexie {
    aiExplanations!: Table<AIExplanation, string>;
    aiUsageLog!: Table<AIUsageLog, number>;

    constructor() {
        super("HchDatabase");
        this.version(1).stores({
            aiExplanations: "simp, generatedAt",
        });
        this.version(2).stores({
            aiExplanations: "simp, generatedAt",
            aiUsageLog: "++id, calledAt",
        });
    }
}

export const db = new HchDatabase();
