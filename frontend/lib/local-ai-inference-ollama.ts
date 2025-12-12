"use client";

import axios from "axios";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  ArrayOfStringsSchema,
  normalizeTag,
  removeDuplicateEntries,
} from "@/lib/ai-generated-tagging";

export const generateTagsOllama = async (
  title: string,
  content: string,
  ollamaURL: string,
  selectedAIModel: string,
  abortController: AbortController
) => {
  const host = ollamaURL || "http://localhost:11434";

  const payload = {
    model: selectedAIModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(title, content) }
    ],
    // @ts-ignore we want the AI model to always return an array of strings, forcing the type here
    format: zodToJsonSchema(ArrayOfStringsSchema),
    options: {
      temperature: 0.3
    },
    stream: false
  };

  const response = await axios.post(`${host}/api/chat`, payload, { 
      headers: { "Content-Type": "application/json" }, 
      signal: abortController.signal 
    }
  );

  const raw = response.data?.message?.content;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const tagsGeneratedByAI = Array.isArray(parsed.tags) ? parsed.tags : [];

  const cleaned = removeDuplicateEntries(
    tagsGeneratedByAI.map(normalizeTag)
  ).filter(Boolean);

  return cleaned as string[];
};