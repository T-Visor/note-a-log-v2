import { Block } from "@blocknote/core";

export interface Note {
  id: string;
  title: string;
  content: string;
  editorContent: Block[];
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type Theme = "system" | "dark" | "light";