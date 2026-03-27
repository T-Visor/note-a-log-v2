import { z } from "zod";

export const SYSTEM_PROMPT = [
  "You are a professional Information Architect specializing in note retrieval.",
  "Your goal is to generate semantic tags that maximize BM25 search discoverability.",
  "Rules:",
  "- No hashtags, lowercase only, no punctuation, one word per tag.",
  "- Never duplicate an existing tag.",
  "- Generate net-new tags only; user tags are already indexed separately.",
  "- If a field has no relevant tags, return an empty array.",
  "- NEVER extract words verbatim from the title or content. Tags must be inferred, not copied."
].join("\n");

export const buildPrompt = (
  title: string,
  content: string,
  tags: string[],
  location?: string
) => [
  "### TASK",
  "Analyze the note and generate up to 8 semantic tags across three dimensions.",
  "The user's existing tags are already indexed — do NOT repeat them.",
  "Total tags across all dimensions must not exceed 8.",
  "",
  "### NOTE DATA",
  `Title: ${title}`,
  `Content: ${content}`,
  `Existing Tags (already indexed, do not repeat): ${tags.length > 0 ? tags.join(", ") : "none"}`,
  location ? `Location hint: ${location}` : "",
  "",
  "### DIMENSION DEFINITIONS",
  "1. CONTENT (2–10 tags): Canonical terms, synonyms, and related concepts that someone might search.",
  "   - Think: what would someone search to find this note if they had never seen it?",
  "   - Include BOTH the literal subject AND its broader category (e.g., 'react' → also add 'frontend', 'javascript').",
  "   - Include antonyms or contrasting concepts if they'd help retrieval (e.g., 'async' → also 'sync').",
  "",
  "2. STRUCTURE (1–4 tags): The note's format.",
  "   - Examples: list, table, code, prose, checklist, interview, outline, snippet, template",
  "",
  "3. CONTEXT (1–2 tags): The intent or lifecycle stage.",
  "   - Examples: draft, evergreen, task, research, receipt, reference, brainstorm, tutorial, decision",
  "",
  "Return only a JSON object following the requested schema.",
].join("\n");

export const AIResponseSchema = z.object({
  content: z.array(z.string().max(30)).min(1).max(10),
  structure: z.array(z.string().max(30)).max(5),
  context: z.array(z.string().max(30)).max(5),
});

export const normalizeTag = (tag: string): string => {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // strips spaces, hyphens, punctuation — enforces one-word rule
};

export const removeDuplicateEntries = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

// Merges user tags with AI-generated tags, deduped and normalized
export const mergeNoteTags = (
  userTags: string[],
  aiTags: z.infer<typeof AIResponseSchema>
): string[] => {
  const normalized = {
    user: userTags.map(normalizeTag),
    ai: [
      ...aiTags.content,
      ...aiTags.structure,
      ...aiTags.context,
    ].map(normalizeTag),
  };

  const netNew = normalized.ai.filter(
    (tag) => !normalized.user.includes(tag) && tag.length > 0
  );

  return removeDuplicateEntries([...normalized.user, ...netNew]);
};