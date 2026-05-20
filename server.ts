import path from "path";
import express from "express";
import dotenv from "dotenv";
import app from "./api/app";

dotenv.config();

const PORT = 3000;

// Vite Middleware & SPA serving
async function setupViteStaticServing() {
  if (process.env.VERCEL) {
    console.log("[CARDNET] Running on Vercel. Static assets serving is offloaded directly to Vercel edge.");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // Mounting Vite middleware in development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[CARDNET] Vite development middleware mounted.");
  } else {
    // Production serving static assets and spa fallback
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[CARDNET] Static assets production serving configured.");
  }
}

setupViteStaticServing().catch(err => {
  console.error("[CARDNET] Failed to set up Vite Serving Middleware:", err);
});

// Bypass regular port listening when running on Vercel as a Serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CARDNET] Full-Stack server running on http://localhost:${PORT}`);
  });
}

// Export the underlying app for Vercel/Serverless deployment compatibility
export default app;
