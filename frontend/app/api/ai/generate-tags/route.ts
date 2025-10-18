import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { Note } from "@/types";
import { z } from "zod";

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
const OutputSchema = z.object({
  tags: z.array(
    z.string().min(1).max(50)
  ).min(3).max(20),
});

// Aggregate prior-used tags from your notes database
const aggregatePriorTags = (previousNotes: Partial<Note>[]): string[] => {
  const set = new Set<string>();
  for (const note of previousNotes) {
    for (const tag of note.tags ?? []) set.add(tag);
  }
  return Array.from(set);
};

const normalizeTag = (tag: string): string  => {
  return tag.trim().toLowerCase();
}

const removeDuplicateEntries = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
}

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  // In real usage, parse these from request or your DB.
  const notesData: Partial<Note> = {
    id: "note-123",
    title: "Now this is a new note",
    content:
      "This is the coolest thing ever. That I will use for testing. I think this is cool.",
    tags: ["testing", "cool stuff"], // existing tags on this note
  };

  const previousNotes: Partial<Note>[] = [
    { id: "a", title: "API auth patterns", content: "JWT, sessions", tags: ["auth", "api", "security"] },
    { id: "b", title: "Fuse.js search config", content: "extended search", tags: ["search", "fusejs", "notes"] },
    { id: "c", title: "Next.js notes", content: "zustand, tags", tags: ["nextjs", "tags", "notes"] },
  ];

  const priorUsedTags = aggregatePriorTags(previousNotes);

  // Prepare a compact, explicit prompt with constraints.
  const PROMPT = [
    "TASK: Generate discoverability tags for the note below.",
    "",
    `Title: ${notesData.title}`,
    `Content: ${notesData.content}`,
    "",
    `Existing tags for this note (reuse when relevant): ${JSON.stringify(notesData.tags ?? [])}`,
    `Prior-used tags across my notebook (prefer vocabulary that fits): ${JSON.stringify(priorUsedTags)}`,
    "",
    "Rules:",
    "- Output must be a JSON object matching the schema { tags: string[] }.",
    "- Tags must be concise keywords suitable for search (1–10 words).",
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
    schema: OutputSchema,
    temperature: 0.2,
  });

  // Post-process: normalize + dedupe, ensure existing/prior relevant tags stay included.
  const fromModel = Array.isArray(object.tags) ? object.tags : [];
  const merged = removeDuplicateEntries([
    ...(notesData.tags ?? []),
    ...fromModel,
  ].map(normalizeTag)).filter(Boolean);

  return NextResponse.json({ response: merged });
};