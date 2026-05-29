import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/health")({
  GET: async () => {
    const openrouter = !!process.env.OPENROUTER_API_KEY;
    const firebase = !!process.env.FIREBASE_API_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID ?? "missing";

    // Test OpenRouter connectivity
    let openrouterStatus = "not tested";
    if (openrouter) {
      try {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://hirelocal-ai.vercel.app",
              "X-Title": "HireLocal AI",
            },
            body: JSON.stringify({
              model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
              messages: [
                { role: "user", content: "Say OK" },
              ],
              max_tokens: 10,
            }),
          }
        );
        if (res.ok) openrouterStatus = "✅ connected";
        else {
          const j = await res.json();
          openrouterStatus = `❌ ${j?.error?.message ?? j?.error ?? res.status}`;
        }
      } catch (e: any) {
        openrouterStatus = `❌ ${e?.message}`;
      }
    } else {
      openrouterStatus = "❌ key missing";
    }

    return Response.json({
      ok: true,
      env: {
        OPENROUTER_API_KEY: openrouter ? "✅ set" : "❌ missing",
        OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free (default)",
        FIREBASE_API_KEY: firebase ? "✅ set" : "❌ missing",
        FIREBASE_PROJECT_ID: projectId !== "missing" ? `✅ ${projectId}` : "❌ missing",
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? "✅ set" : "❌ missing",
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? "✅ set" : "❌ missing",
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? "✅ set" : "❌ missing",
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? "✅ set" : "❌ missing",
      },
      openrouterTest: openrouterStatus,
    });
  },
});
