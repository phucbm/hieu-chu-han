/**
 * notebook-types.ts — Shared TypeScript interfaces for the Notebook feature.
 * Framework-agnostic. No React/Next.js imports.
 */

export interface NotebookGroup {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: "manual" | "lyrics";
  sortOrder: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookLyrics {
  id: string;
  groupId: string;
  content: string;
  youtubeUrl?: string;
  translation?: string;
  translatedAt?: string;
  autoExtract: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WordEtymologyLinks {
  word: string;
  etymologicalRelated: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserWordExtended {
  id: string;
  userId: string;
  simp: string;
  viewCount: number;
  firstViewedAt: string;
  lastViewedAt: string;
  groupIds: string[];
  note?: string;
  customLinks: string[];
}
