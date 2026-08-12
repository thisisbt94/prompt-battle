import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

// Vercel's "Upstash for Redis" marketplace integration injects either
// KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/_TOKEN
// depending on how it was connected — check both.
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
