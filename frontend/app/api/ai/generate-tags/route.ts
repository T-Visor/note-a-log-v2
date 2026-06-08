import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import { auth } from "@/lib/auth";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  AIResponseSchema,
  normalizeTag,
  removeDuplicateEntries
} from "@/lib/ai-generated-tagging";

export const POST = async (
  request: NextRequest
): Promise<NextResponse> => {
  // Check for active user session.
  const session = await auth.api.getSession({
    headers: request.headers
  });
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const {
    title,
    content,
    tags,
    locationTag,
    selectedAIModel,
    apiKey
  } = await request.json();

  console.log(`title: ${title}`);
  console.log(`content: ${content}`);
  console.log(`tags: ${tags.join()}`);
  console.log(`location: ${locationTag}`);

  if (title == null || content == null || tags == null) {
    return NextResponse.json(
      { error: "One or more required fields are missing or null." },
      { status: 400 }
    );
  }

  let MODEL: LanguageModel;

  if (!apiKey || !selectedAIModel) {
    // Use default model with server-side API key from environment
    const mistral = createMistral({
      apiKey: process.env.MISTRAL_API_KEY
    });
    MODEL = mistral("mistral-small-latest");
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
    prompt: buildPrompt(title, content, tags, locationTag),
    schema: AIResponseSchema,
    temperature: 0.3,
  });

  //const tagsGeneratedByAI = Array.isArray(object.tags) ? object.tags : [];
  console.log(object);
  const tagsGeneratedByAI = [
    ...(object.content ?? []),
    ...(object.context ?? []),
    ...(object.structure ?? []),
  ];

  const deDupedGeneratedTags = removeDuplicateEntries(
    [...tagsGeneratedByAI].map(normalizeTag)
  ).filter(Boolean);

  const existingTagsNormalized = tags.map(normalizeTag);

  const filteredGeneratedTags = deDupedGeneratedTags.filter(
    generatedTag => !existingTagsNormalized.includes(generatedTag)
  );

  return NextResponse.json(filteredGeneratedTags);
};