interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS")
      return new Response(null, { headers: cors });
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405, headers: cors });

    try {
      const body = (await request.json()) as {
        system: string;
        user: string;
        schema: unknown;
        model?: string;
        temperature?: number;
      };
      const {
        system,
        user,
        schema,
        model = "gemini-2.5-flash",
        temperature = 0.3,
      } = body;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature,
          },
        }),
      });
      if (!geminiRes.ok) {
        return new Response(
          JSON.stringify({ error: await geminiRes.text() }),
          {
            status: geminiRes.status,
            headers: { ...cors, "Content-Type": "application/json" },
          },
        );
      }
      const data = (await geminiRes.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      return new Response(text, {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};
