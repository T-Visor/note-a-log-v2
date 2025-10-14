Yes — this **is possible with the Vercel AI SDK**, and it's a great choice if you're using **Next.js or React** with edge functions and want to stream AI responses into the UI in real time.

---

## ✅ Summary of What We'll Build

We'll:

* Prompt the AI to return **newline-separated tags** (one per line).
* Use the **Vercel AI SDK** (based on `ai/vercel-edge`) to stream the response from the backend to the frontend.
* Parse and display tags **live** in React.

---

## 🧱 Backend: Vercel AI SDK API Route (Edge Function)

Create a route in your `app/api/generate-tags/route.ts` (or `.js`).

```ts
// app/api/generate-tags/route.ts

import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { input } = await req.json();

  const prompt = `Generate relevant tags for the following content. Output each tag on a new line, no punctuation or formatting:\n\n"${input}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4', // or gpt-3.5-turbo
    stream: true,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

---

## 🖼️ Frontend: React Component with Live Tag Streaming

```tsx
'use client';

import { useState } from 'react';

export default function TagGenerator() {
  const [input, setInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTags = async () => {
    setTags([]);
    setLoading(true);

    const res = await fetch('/api/generate-tags', {
      method: 'POST',
      body: JSON.stringify({ input }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');

      // Keep incomplete last line in buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const tag = line.trim();
        if (tag && !tags.includes(tag)) {
          setTags(prev => [...prev, tag]);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter content to tag..."
        className="w-full p-2 border rounded"
        rows={4}
      />
      <button
        onClick={generateTags}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Generating...' : 'Generate Tags'}
      </button>

      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="bg-gray-200 px-3 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## 👀 Example Output (Live in React):

When you type something like:

> "A guide to traveling in New York City with tips on food, transport, and culture."

You'll get streamed tags like:

```
travel
new york
city guide
food
transport
culture
```

These will show up one by one in the React component as they stream in.

---

## 🔐 Notes

* Make sure your OpenAI key is set in `.env` as `OPENAI_API_KEY`.
* You can also tweak the prompt to return JSON or comma-delimited tags if needed — but **newline-separated tags** are best for live streaming display.

---

## ✅ You Now Have:

* Real-time AI-powered tag generation
* Streaming output using Vercel AI SDK
* A clean, async React UI

---

Would you like this turned into a reusable component or enhanced with error handling, tag deduplication, or even GPT function calling for structured output?

