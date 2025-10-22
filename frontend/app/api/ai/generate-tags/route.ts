import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { Note } from "@/types";
import { z } from "zod";

/* Test with the following curl call:
curl -X POST http://localhost:3000/api/ai/generate-tags \                                                          
        -H "Content-Type: application/json" \
        -d '{"title": "hello", "content": "there", "tags": []}'
*/

const MODEL_NAME = "gemini-2.5-flash";
const SYSTEM_PROMPT = [
  "You are a content categorization and curation expert.",
  "Your ONLY output is a JSON array of keyword-style tags (strings).",
  "Write concise, search-friendly tags (1–10 words), no punctuation, no sentences.",
  "Prefer existing and prior-used tags when appropriate. Do not invent jargon.",
  "Avoid duplicates, plurals vs singular duplicates, and near-synonyms.",
  "No personally identifiable info; no private/sensitive data.",
].join("\n");

// Array of strings
const ArrayOfStringsSchema = z.object({
  tags: z.array(
    z.string().min(1).max(50)
  ).min(1).max(20),
});

const normalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
}

const removeDuplicateEntries = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
}

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const { title, content, tags } = await request.json();

  // Prepare a compact, explicit prompt with constraints.
  const PROMPT = [
    "TASK: Generate discoverability tags for the note below.",
    "",
    `Title: ${title}`,
    `Content: ${content}`,
    "",
    `Existing tags for this note (reuse when relevant): ${JSON.stringify(tags ?? [])}`,
    {/*`Prior-used tags across my notebook (prefer vocabulary that fits): ${JSON.stringify(priorUsedTags)}`*/ },
    "",
    "Rules:",
    "- Output must be a JSON object matching the schema { tags: string[] }.",
    "- Tags must be concise keywords suitable for search (1-10).",
    "- Favor relevant terms from the provided tag vocabularies.",
    "- Add new tags only if meaningfully missing.",
    "- Avoid duplicates, near-duplicates, and trivial words.",
    "- Do NOT include explanations or any fields other than { tags }.",
    "",
    "Return only the JSON object.",
  ].join("\n");

  const { object } = await generateObject({
    model: google(MODEL_NAME),
    system: SYSTEM_PROMPT,
    prompt: PROMPT,
    schema: ArrayOfStringsSchema,
    temperature: 0.2,
  });

  // Post-process: normalize + dedupe, ensure existing/prior relevant tags stay included.
  const tagsGeneratedByAI = Array.isArray(object.tags) ? object.tags : [];
  const mergedTagsForNote = removeDuplicateEntries([
    ...(tags ?? []),
    ...tagsGeneratedByAI,
  ].map(normalizeTag)).filter(Boolean);

  return NextResponse.json(mergedTagsForNote);
};