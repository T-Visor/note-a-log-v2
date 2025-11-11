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
) => {
  const host = ollamaURL || "http://localhost:11434";

  const payload = {
    model: selectedAIModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(title, content) }
    ],
    format: zodToJsonSchema(ArrayOfStringsSchema),
    options: {
      temperature: 0.3
    },
    stream: false
  };

  const response = await axios.post(`${host}/api/chat`, payload, {
    headers: { "Content-Type": "application/json" }
  });

  const tags = response.data?.message?.content;

  const tagsGeneratedByAI = Array.isArray(tags) ? tags : [];

  const cleaned = removeDuplicateEntries(
    tagsGeneratedByAI.map(normalizeTag)
  ).filter(Boolean);

  return cleaned;
};