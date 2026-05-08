import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";
import * as blockNoteServer from "@blocknote/xl-ai/server";


const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 30;

export async function POST(request: Request) {
console.log("server exports:", Object.keys(blockNoteServer));
console.log("promptHelpers props:", Object.getOwnPropertyNames(blockNoteServer.promptHelpers));
  const { messages, toolDefinitions } = await request.json();

  const result = streamText({
    model: google("gemini-3.1-flash-lite-preview"), 
    system: (aiDocumentFormats as any).markdown.systemPrompt,
    messages: await convertToModelMessages(
      injectDocumentStateMessages(messages),
    ),
    tools: toolDefinitionsToToolSet(toolDefinitions),
    toolChoice: "required",
  });

  return result.toUIMessageStreamResponse();
}