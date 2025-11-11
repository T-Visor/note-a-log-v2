import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  ArrayOfStringsSchema,
  normalizeTag,
  removeDuplicateEntries
} from "@/lib/ai-generated-tagging";

let MODEL: LanguageModel;
let MODEL_PROVIDER = "";
let MODEL_NAME = "";

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

  console.log(buildPrompt(title, content));

  const { object } = await generateObject({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(title, content),
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