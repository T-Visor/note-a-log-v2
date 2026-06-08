/*import { createGoogleGenerativeAI } from "@ai-sdk/google";*/
import { createMistral } from '@ai-sdk/mistral';
import { convertToModelMessages, streamText } from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";
import { auth } from "@/lib/auth";

/*const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});*/

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY
})

export const maxDuration = 30;

export async function POST(request: Request) {
  // Check for active user session.
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return new Response("Unauthorized", { status: 401 });

  const { messages, toolDefinitions } = await request.json();

  const result = streamText({
    //model: google("gemini-3.1-flash-lite"), 
    model: mistral("mistral-small-latest"),
    system: aiDocumentFormats.html.systemPrompt, // HTML is usually more reliable for BlockNote's internal parser
    messages: await convertToModelMessages(
      injectDocumentStateMessages(messages),
    ),
    tools: toolDefinitionsToToolSet(toolDefinitions),
    toolChoice: "required",
  });

  return result.toUIMessageStreamResponse();
}