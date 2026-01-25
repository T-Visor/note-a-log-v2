import { z } from "zod";

export const SYSTEM_PROMPT = [
  "You are a content categorization and curation expert.",
  "Your ONLY output is a JSON array of keyword-style tags (strings).",
  "Write concise, search-friendly tags, no punctuation, no sentences.",
].join("\n");

export const buildPrompt = (
  title: string, 
  content: string,
  tags: string[],
  location?: string
) => [
  "TASK: Generate a rich set of discoverability tags for the note below. Optimize for resurfacing content among a sea of other notes.",
  "",
  `Title: ${title}`,
  `Content: ${content}`,
  `Existing tags: [${tags.join()}]`,
  `${location !== undefined ? "Location: " + location + "\n" : ""}`,
  "Rules:",
  "- Do NOT include explanations or any fields other than { tags }.",
  "- Avoid using keywords in the title or content",
  "- Return only the JSON object.",
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

export const removeDuplicateEntries = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};