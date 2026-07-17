import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs/promises";
import type { IncomingMessage, ServerResponse } from "http";

const STORAGE_ROOT = path.resolve(__dirname, "storage");
const LOCAL_UPLOAD_ROUTE = "/__local_storage/upload";
const STORAGE_PUBLIC_ROUTE = "/storage/";

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

function normalizeFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const safeBase = sanitizeSegment(baseName || "file") || "file";
  return extension ? `${safeBase}.${extension}` : safeBase;
}

function guessMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function collectBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handleUpload(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const folder = sanitizeSegment(url.searchParams.get("folder") ?? "uploads") || "uploads";
  const fileName = normalizeFileName(url.searchParams.get("fileName") ?? "file");
  const mimeType = (url.searchParams.get("mimeType") ?? req.headers["content-type"] ?? "application/octet-stream").toString();

  const body = await collectBody(req);
  if (!body.length) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ message: "Upload body is empty." }));
    return;
  }

  const relativePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;
  const outputPath = path.resolve(STORAGE_ROOT, relativePath);
  if (!outputPath.startsWith(STORAGE_ROOT)) {
    res.statusCode = 400;
    res.end("Invalid upload path.");
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, body);

  const payload = {
    name: fileName,
    url: `/storage/${relativePath.replace(/\\/g, "/")}`,
    path: relativePath.replace(/\\/g, "/"),
    mimeType,
    size: body.length,
    bucket: "storage",
    uploadedAt: new Date().toISOString(),
  };

  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

async function handleStorageFile(res: ServerResponse, requestPath: string): Promise<void> {
  const decodedPath = decodeURIComponent(requestPath.slice(STORAGE_PUBLIC_ROUTE.length));
  const normalizedPath = path.posix.normalize(decodedPath).replace(/^\/+/, "");
  if (!normalizedPath || normalizedPath.startsWith("..")) {
    res.statusCode = 400;
    res.end("Invalid file path.");
    return;
  }

  const absolutePath = path.resolve(STORAGE_ROOT, normalizedPath);
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    res.statusCode = 400;
    res.end("Invalid file path.");
    return;
  }

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    res.statusCode = 200;
    res.setHeader("content-type", guessMimeType(absolutePath));
    res.setHeader("cache-control", "no-cache");
    res.end(fileBuffer);
  } catch {
    res.statusCode = 404;
    res.end("File not found.");
  }
}

function localStoragePlugin() {
  return {
    name: "worknest-local-storage",
    async configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      await fs.mkdir(STORAGE_ROOT, { recursive: true });

      server.middlewares.use((req, res, next) => {
        const method = req.method?.toUpperCase();
        const requestUrl = req.url ? new URL(req.url, "http://localhost") : null;
        const requestPath = requestUrl?.pathname ?? "";

        if (!requestUrl) {
          next();
          return;
        }

        if (method === "POST" && requestPath === LOCAL_UPLOAD_ROUTE) {
          handleUpload(req, res, requestUrl).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Unknown upload error";
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ message }));
          });
          return;
        }

        if ((method === "GET" || method === "HEAD") && requestPath.startsWith(STORAGE_PUBLIC_ROUTE)) {
          handleStorageFile(res, requestPath).catch(() => {
            res.statusCode = 500;
            res.end("Failed to serve storage file.");
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localStoragePlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/")) return "react";
          if (id.includes("react-router-dom")) return "router";
          if (id.includes("@stomp/stompjs") || id.includes("axios")) return "network";
          if (id.includes("zustand")) return "state";
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
