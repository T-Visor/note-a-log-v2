import { z } from "zod";

export const SYSTEM_PROMPT = [
  "You are a professional Information Architect.",
  "Your task is to increase the 'searchable surface area' of a note by generating unique, atomic tags.",  
  "No hashtags, lowercase only, no punctuation, use kebab-case for multi-word tags.",
  "Do NOT repeat keywords from the note content itself, derive synonyms and unique keywords."
].join("\n");

export const buildPrompt = (
  title: string, 
  content: string,
  tags: string[],
  location?: string
) => [
  "### TASK",
  "Analyze the note below and generate specific tags across three dimensions: Content, Structure, and Context.",
  "",
  "### NOTE DATA",
  `Title: ${title}`,
  `Content: ${content}`,
  `Existing User Tags: ${tags.length > 0 ? tags.join(", ") : "none"}`,
  location ? `Reference Location: ${location}` : "",
  "",
  "### CATEGORY DEFINITIONS",
  "1. CONTENT: High-level topics, synonyms, and niche jargon NOT mentioned in the text (e.g., if the text is about 'React', use 'frontend-frameworks' or 'typescript-ecosystem').",
  "2. STRUCTURE: The format of the note (e.g., list, table, code-heavy, brief, interview).",
  "3. CONTEXT: The intent or stage (e.g., draft, evergreen, work-task, research, receipt).",
  "",
  "Return only a JSON object following the requested schema."
].join("\n");

// Array of strings
export const AIResponseSchema = z.object({
  content: z.array(z.string().max(30)).min(1),
  structure: z.array(z.string().max(30)), // e.g., "checklist", "tabular", "long-form"
  context: z.array(z.string().max(30)),   // e.g., "professional", "brainstorm", "tutorial"
});

export const normalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
};

export const removeDuplicateEntries = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};