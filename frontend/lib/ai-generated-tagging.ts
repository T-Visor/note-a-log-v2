import { z } from "zod";

export const SYSTEM_PROMPT = [
  "You are a professional Information Architect.",
  "Your goal is to maximize note discoverability through multi-dimensional tagging.",
  "Rules: No hashtags, lowercase only, no punctuation, use kebab-case for multi-word tags.",
].join("\n");

export const buildPrompt = (
  title: string, 
  content: string,
  tags: string[],
  location?: string
) => [
  "### TASK",
  "Analyze the note below and generate specific tags across four dimensions: Location, Content, Structure, and Context.",
  "",
  "### NOTE DATA",
  `Title: ${title}`,
  `Content: ${content}`,
  `Existing User Tags: ${tags.length > 0 ? tags.join(", ") : "none"}`,
  location ? `Reference Location: ${location}` : "",
  "",
  "### CATEGORY DEFINITIONS",
  "1. LOCATION: Do not return the city/state verbatim. Infer the region, scale, or timezone (e.g., 'east-coast', 'emea', 'international', 'tri-state-area', 'remote').",
  "2. CONTENT: High-level topics, synonyms, and niche jargon NOT mentioned in the text (e.g., if the text is about 'React', use 'frontend-frameworks' or 'typescript-ecosystem').",
  "3. STRUCTURE: The format of the note (e.g., list, table, code-heavy, brief, interview).",
  "4. CONTEXT: The intent or stage (e.g., draft, evergreen, work-task, research, receipt).",
  "",
  "Return only a JSON object following the requested schema."
].join("\n");

// Array of strings
export const AIResponseSchema = z.object({
  location: z.array(z.string().max(30)),
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