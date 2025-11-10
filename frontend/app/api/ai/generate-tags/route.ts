import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import { z } from "zod";

let MODEL: LanguageModel;
let MODEL_PROVIDER = "";
let MODEL_NAME = "";

const SYSTEM_PROMPT = [
  "You are a content categorization and curation expert.",
  "Your ONLY output is a JSON array of keyword-style tags (strings).",
  "Write concise, search-friendly tags, no punctuation, no sentences.",
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
  const {
    title,
    content,
    tags,
    selectedAIModel,
    apiKey
  } = await request.json();

  if (title == null || content == null || tags == null) {
    return NextResponse.json(
      { error: "One or more required fields are missing or null." },
      { status: 400 }
    );
  }

  [MODEL_PROVIDER, MODEL_NAME] = selectedAIModel.split(":");

  if (MODEL_PROVIDER === "google") {
    MODEL = google(MODEL_NAME);
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
  }
  else if (MODEL_PROVIDER === "openai") {
    MODEL = openai(MODEL_NAME);
    process.env.OPENAI_API_KEY = apiKey;
  }

  // Prepare a compact, explicit prompt with constraints.
  const PROMPT = [
    "TASK: Generate a rich set of discoverability tags for the note below.",
    "",
    `Title: ${title}`,
    `Content: ${content}`,
    "",
    {/*`Existing tags for this note (reuse when relevant): ${JSON.stringify(tags ?? [])}`,*/ },
    {/*`Prior-used tags across my notebook (prefer vocabulary that fits): ${JSON.stringify(priorUsedTags)}`*/ },
    "",
    "Rules:",
    "- Output must be a JSON object matching the schema { tags: string[] }.",
    "- Avoid using keywords from the title or content",
    "- Do NOT include explanations or any fields other than { tags }.",
    "",
    "Return only the JSON object.",
  ].join("\n");

  const { object } = await generateObject({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: PROMPT,
    schema: ArrayOfStringsSchema,
    temperature: 0.3,
  });

  // Post-process: normalize + dedupe, ensure existing/prior relevant tags stay included.
  const tagsGeneratedByAI = Array.isArray(object.tags) ? object.tags : [];
  const deDupedTagsGeneratedTags = removeDuplicateEntries([
    ...tagsGeneratedByAI,
  ].map(normalizeTag)).filter(Boolean);

  return NextResponse.json(deDupedTagsGeneratedTags);
};