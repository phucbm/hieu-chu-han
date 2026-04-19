import Dexie, { type Table } from "dexie";

export interface AIExplanation {
    simp: string;
    content: string;
    model: string;
    generatedAt: number;
}

class HchDatabase extends Dexie {
    aiExplanations!: Table<AIExplanation, string>;

    constructor() {
        super("HchDatabase");
        this.version(1).stores({
            aiExplanations: "simp, generatedAt",
        });
    }
}

export const db = new HchDatabase();
