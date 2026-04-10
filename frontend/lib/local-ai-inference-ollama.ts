"use client";

import axios from "axios";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  AIResponseSchema,
  normalizeTag,
  removeDuplicateEntries,
} from "@/lib/ai-generated-tagging";

export const generateTagsOllama = async (
  title: string,
  content: string,
  tags: string[],
  ollamaURL: string,
  selectedAIModel: string,
  abortController: AbortController
) => {
  const host = ollamaURL || "http://localhost:11434";
  const schema = zodToJsonSchema(AIResponseSchema as any);
  delete (schema as any).$schema;

  const payload = {
    model: selectedAIModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(title, content, tags) }
    ],
    // @ts-ignore we want the AI model to always return an array of strings, forcing the type here
    format: schema,
    options: {
      temperature: 0.3
    },
    stream: false
  };

  const response = await axios.post(`${host}/api/chat`, payload, {
    headers: { "Content-Type": "application/json" },
    signal: abortController.signal
  });

  console.log("full response:", response);
  console.log("response.data:", response.data);
  console.log("message:", response.data?.message);
  console.log("content:", response.data?.message?.content);

  const raw = response.data?.message?.content;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  //const tagsGeneratedByAI = Array.isArray(parsed.tags) ? parsed.tags : [];
  const tagsGeneratedByAI = [
    ...(Array.isArray(parsed.content) ? parsed.content : []),
    ...(Array.isArray(parsed.context) ? parsed.context : []),
    ...(Array.isArray(parsed.structure) ? parsed.structure : []),
  ];

  const deDupedGeneratedTags = removeDuplicateEntries(
    [...tagsGeneratedByAI].map(normalizeTag)
  ).filter(Boolean);

  const existingTagsNormalized = tags.map(normalizeTag);

  const filteredGeneratedTags = deDupedGeneratedTags.filter(
    generatedTag => !existingTagsNormalized.includes(generatedTag)
  );

  return filteredGeneratedTags as string[];
};