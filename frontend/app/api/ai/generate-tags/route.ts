import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  ArrayOfStringsSchema,
  normalizeTag,
  removeDuplicateEntries
} from "@/lib/ai-generated-tagging";

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

  let MODEL: LanguageModel;

  if (!apiKey || !selectedAIModel) {
    // Use default model with server-side API key from environment
    const googleClient = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    });
    MODEL = googleClient("gemini-2.5-flash");
  } 
  else {
    const [MODEL_PROVIDER, MODEL_NAME] = selectedAIModel.split(":");

    if (MODEL_PROVIDER === "google") {
      const googleClient = createGoogleGenerativeAI({
        apiKey: apiKey
      });
      MODEL = googleClient(MODEL_NAME);
    } 
    else if (MODEL_PROVIDER === "openai") {
      const openaiClient = createOpenAI({
        apiKey: apiKey
      });
      MODEL = openaiClient(MODEL_NAME);
    } 
    else {
      return NextResponse.json(
        { error: "Unsupported model provider" },
        { status: 400 }
      );
    }
  }

  const { object } = await generateObject({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(title, content),
    schema: ArrayOfStringsSchema,
    temperature: 0.3,
  });

  const tagsGeneratedByAI = Array.isArray(object.tags) ? object.tags : [];
  const deDupedTagsGeneratedTags = removeDuplicateEntries([
    ...tagsGeneratedByAI,
  ].map(normalizeTag)).filter(Boolean);

  return NextResponse.json(deDupedTagsGeneratedTags);
};