import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext → Cloudflare Workers adapter config for the Champey frontend.
 * Created per https://opennext.js.org/cloudflare/get-started (step 4).
 *
 * Incremental cache defaults to static-assets-only. Add an R2-backed cache
 * (r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache"
 * + a NEXT_INC_CACHE_R2_BUCKET binding in wrangler.jsonc) once ISR caching
 * across isolates matters.
 */
export default defineCloudflareConfig({});
