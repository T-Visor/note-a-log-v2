"use client"

import { Ollama } from "ollama";
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  SYSTEM_PROMPT,
  buildPrompt,
  ArrayOfStringsSchema,
  normalizeTag,
  removeDuplicateEntries
} from "@/lib/ai-generated-tagging";

export const generateTagsOllama = async (
  title: string,
  content: string,
  ollamaURL: string,
  selectedAIModel: string,
) => {
  const ollama = new Ollama({ host: ollamaURL || "http://localhost:11434"})
  const response = await ollama.chat({
    model: selectedAIModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(title, content)}
    ],
    format: zodToJsonSchema(ArrayOfStringsSchema),
    options: {
      temperature: 0.3
    }
  })

  const tags = response.message.content;

  // Post-process: normalize + dedupe, ensure existing/prior relevant tags stay included.
  const tagsGeneratedByAI = Array.isArray(tags) ? tags : [];
  const deDupedTagsGeneratedTags = removeDuplicateEntries([
    ...tagsGeneratedByAI,
  ].map(normalizeTag)).filter(Boolean);

  return deDupedTagsGeneratedTags;
};