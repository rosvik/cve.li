import { createClient } from "redis";
import { env } from "../env.mjs";

type RedisClient = ReturnType<typeof createClient>;

// Shared Redis client for all operations.
let clientPromise: Promise<RedisClient> | null = null;

/**
 * Get a re-used redis client.
 *
 * @throws Connection error if connection fails
 */
export function getRedisClient(): Promise<RedisClient> | null {
  if (!env.REDIS_URL) return null;
  if (clientPromise) return clientPromise;

  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      keepAlive: true,
      reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
    },
  });

  client.on("error", (err) =>
    console.warn("Redis Client Error", err instanceof Error ? err.message : err)
  );

  clientPromise = client.connect().catch((err) => {
    // Don't cache a failed connection
    clientPromise = null;
    throw err;
  });

  return clientPromise;
}

export async function addToRedis(key: string, value: string) {
  try {
    const client = await getRedisClient();
    if (!client) return null;
    console.info("REDIS: adding", key);
    return await client.set(key, value, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 7, // 7 days
      },
    });
  } catch (err) {
    console.warn("REDIS: add failed", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getFromRedis(key: string) {
  try {
    const client = await getRedisClient();
    if (!client) return null;
    console.info("REDIS: getting", key);
    return await client.get(key);
  } catch (err) {
    console.warn("REDIS: get failed", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function deleteFromRedis(key: string) {
  try {
    const client = await getRedisClient();
    if (!client) return null;
    console.info("REDIS: deleting", key);
    return await client.del(key);
  } catch (err) {
    console.warn(
      "REDIS: delete failed",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Returns the cached value if it exists, otherwise calls `fn` and caches the
 * result in Redis.
 *
 * On my machine with Redis running in a docker container:
 * - `getFromRedis` takes between 5 and 20ms
 * - `addToRedis` takes around 300ms (but is not blocking)
 * - Fetching from the GitHub API takes around 300ms
 */
export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = await getFromRedis(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Ignore invalid result and recompute.
      console.warn("REDIS: invalid cached result", key);
    }
  }
  const value = await fn();
  addToRedis(key, JSON.stringify(value)).catch(console.error);
  return value;
}

export const cveKey = (cveId: string) => {
  return `cve:${cveId}`;
};
export const githubAdvisoriesKey = (cveId: string) => {
  return `github_advisories:${cveId}`;
};
export const openGraphDataKey = (url: string) => {
  return `open_graph_data:${url}`;
};
