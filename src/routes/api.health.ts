import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/health")({
  GET: async () => {
    const gemini = !!process.env.GEMINI_API_KEY;
    const firebase = !!process.env.FIREBASE_API_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID ?? "missing";

    // Test Gemini connectivity
    let geminiStatus = "not tested";
    if (gemini) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say OK" }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          }
        );
        if (res.ok) geminiStatus = "✅ connected";
        else {
          const j = await res.json();
          geminiStatus = `❌ ${j?.error?.message ?? res.status}`;
        }
      } catch (e: any) {
        geminiStatus = `❌ ${e?.message}`;
      }
    } else {
      geminiStatus = "❌ key missing";
    }

    return Response.json({
      ok: true,
      env: {
        GEMINI_API_KEY: gemini ? "✅ set" : "❌ missing",
        FIREBASE_API_KEY: firebase ? "✅ set" : "❌ missing",
        FIREBASE_PROJECT_ID: projectId !== "missing" ? `✅ ${projectId}` : "❌ missing",
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? "✅ set" : "❌ missing",
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? "✅ set" : "❌ missing",
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? "✅ set" : "❌ missing",
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? "✅ set" : "❌ missing",
      },
      geminiTest: geminiStatus,
    });
  },
});
