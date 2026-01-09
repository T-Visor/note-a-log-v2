import { z } from "zod";

export const SYSTEM_PROMPT = [
  "You are a content categorization and curation expert.",
  "Your ONLY output is a JSON array of keyword-style tags (strings).",
  "Write concise, search-friendly tags, no punctuation, no sentences.",
].join("\n");

export const buildPrompt = (
  title: string, 
  content: string,
  tags: string[]
) => [
  "TASK: Generate a rich set of discoverability tags for the note below.",
  "",
  `Title: ${title}`,
  `Content: ${content}`,
  `Existing tags: [${tags.join()}]`,
  "",
  "Rules:",
  "- Do NOT include explanations or any fields other than { tags }.",
  "- Avoid using keywords in the title or content",
  "- Avoid using existing tags",
  "Return only the JSON object.",
].join("\n");

// Array of strings
export const ArrayOfStringsSchema = z.object({
  tags: z.array(
    z.string().min(1).max(50)
  ).min(1),
});

export const normalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
};

export const removeDuplicateEntries = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
};