import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

/**
 * OpenNext → Cloudflare Workers adapter config for the Champey frontend.
 * Created per https://opennextjs.org/cloudflare/get-started (step 4).
 *
 * The incremental cache is R2-backed (`NEXT_INC_CACHE_R2_BUCKET` binding in
 * wrangler.jsonc) so Next.js ISR/fetch cache entries survive across Worker
 * isolates instead of being static-assets-only. The R2 keys can be scoped
 * with the NEXT_INC_CACHE_R2_PREFIX env var (defaults to "incremental-cache").
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
