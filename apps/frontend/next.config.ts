import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const minioHost = `${process.env.MINIO_ENDPOINT || "localhost"}:${
  process.env.MINIO_PORT || "9000"
}`;
const minioProtocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";

const nextConfig: NextConfig = {
  // Standalone output + monorepo tracing root are required for a lean Docker image.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // @theo/ui is raw TS source and must be transpiled. @react-pdf/renderer ships
  // consumable ESM — transpiling its entire tree was a big SWC/native-memory
  // cost during the production compile for no benefit.
  transpilePackages: ["@theo/ui"],
  // Memory-constrained builders (2GB CI/sandbox containers) OOM during the
  // webpack production compile: the graph (mermaid, @imgly, react-pdf, tiptap)
  // is huge. Reduce peak RSS: serialize build workers, drop the build-time
  // webpack filesystem cache (PackFileCacheStrategy serialization), and enable
  // webpack's memory-optimization experiment. (swcMinify is dead in Next 15 —
  // SWC minify is already the default.)
  productionBrowserSourceMaps: false,
  experimental: {
    webpackMemoryOptimizations: true,
    // Run the webpack production compile inside a dedicated build worker and
    // serialize module processing — both cut peak RSS on 2GB builders.
    webpackBuildWorker: true,
    cpus: 1,
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config, { dev }) => {
    // Production-only memory caps: no build-time webpack cache, serialized
    // module processing, and no source-map generation — the largest burst
    // allocator in the compile (hundreds of MB in seconds, enough to OOM-kill
    // 2GB builders with no swap; none are served anyway since
    // productionBrowserSourceMaps is false). Dev keeps its filesystem cache
    // for fast HMR.
    if (!dev) {
      config.cache = false;
      config.parallelism = 1;
      config.devtool = false;
    }
    return config;
  },
  // Keep Prisma external to the server bundle: the query engine DLL is resolved
  // at runtime from node_modules (the store's .prisma/client), and bundling it
  // makes the client look for the engine next to .next/server, which fails.
  serverExternalPackages: ["@prisma/client", "@prisma/engines", "@theo/database"],
  images: {
    // Allow-list only: localhost dev servers and the MinIO upload endpoint.
    // Never use hostname "**" here — it turns the image optimizer into an
    // open proxy for arbitrary remote hosts.
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: minioProtocol as "http" | "https", hostname: minioHost.split(":")[0] },
      // Clerk-hosted avatars: the proxy serves dev and prod images alike.
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      ...(process.env.IMAGE_HOSTS || "")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean)
        .map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
