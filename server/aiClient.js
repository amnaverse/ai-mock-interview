const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function askAI({ system, prompt, maxOutputTokens = 600 }) {
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!key || !model) throw new Error("AI_API_KEY or AI_MODEL missing in .env");

  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens },
    }),
  });

  if (!res.ok) {
    console.error("AI API error:", res.status, await res.text());
    throw new Error(`AI request failed (${res.status})`);
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text.trim()) throw new Error("Empty AI response");
  return text.trim();
}