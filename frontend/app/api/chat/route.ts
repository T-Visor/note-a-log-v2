/*import { createGoogleGenerativeAI } from "@ai-sdk/google";*/
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { convertToModelMessages, streamText } from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";
import { auth } from "@/lib/auth";

let AI_MODEL;
const GOOGLE = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
const MISTRAL = createMistral({
  apiKey: process.env.MISTRAL_API_KEY
})

export const maxDuration = 30;

export async function POST(request: Request) {
  // Check for active user session.
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return new Response("Unauthorized", { status: 401 });

  const { messages, toolDefinitions, selectedAIModel } = await request.json();
  const [MODEL_PROVIDER, MODEL_NAME] = selectedAIModel.split(":");

  console.log(MODEL_PROVIDER, MODEL_NAME)

  if (MODEL_PROVIDER === "mistral")
    AI_MODEL = MISTRAL(MODEL_NAME);
  else if (MODEL_PROVIDER === "google")
    AI_MODEL = GOOGLE(MODEL_NAME);
  else 
    AI_MODEL = MISTRAL("mistral-small-latest"); // default to Mistral

  const result = streamText({
    model: AI_MODEL,
    system: aiDocumentFormats.html.systemPrompt, // HTML is usually more reliable for BlockNote's internal parser
    messages: await convertToModelMessages(
      injectDocumentStateMessages(messages),
    ),
    tools: toolDefinitionsToToolSet(toolDefinitions),
    toolChoice: "required",
  });

  return result.toUIMessageStreamResponse();
}