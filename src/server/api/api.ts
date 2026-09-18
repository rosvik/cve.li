import { z } from "zod";
import { env } from "../../env.mjs";
import { GithubAdvisory } from "../../types/GithubAdvisory";
import { Published } from "../../types/v5-cve";
import {
  formatOpenGraphDataResponse,
  OpenGraphData,
  OpenGraphDataResponse,
} from "../../utils/opengraph";
import { isDefined } from "../../utils/utils";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { getHackerNewsUrl } from "../../utils/hacker-news";
import { HNSearchHit } from "../../types/HNSearch";

const API_BASE_URL = env.API_BASE_URL;
const GITHUB_TOKEN = env.GITHUB_TOKEN;
const GITHUB_API_BASE_URL = "https://api.github.com/";

export const appRouter = createTRPCRouter({
  getCVE: publicProcedure
    .input(z.object({ id: z.string() }))
    .query<Published | undefined>(({ input }) => getCVE(input.id)),
  getCVEs: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query<Published[] | undefined>(({ input }) => getCVEs(input.ids)),
  getRecentCVE: publicProcedure
    .input(z.object({ count: z.number() }))
    .query<Published[] | undefined>(({ input }) => getRecentCVEs(input.count)),
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query<Published[] | undefined>(({ input }) => search(input.query)),
  getOpenGraphData: publicProcedure
    .input(z.object({ url: z.string() }))
    .query<OpenGraphData | undefined>(({ input }) =>
      getOpenGraphData(input.url)
    ),
  getGithubAdvisories: publicProcedure
    .input(z.object({ cveId: z.string() }))
    .query<GithubAdvisory[] | undefined>(({ input }) =>
      getGithubAdvisories(input.cveId)
    ),
  getHackerNewsUrl: publicProcedure
    .input(z.object({ url: z.string() }))
    .query<HNSearchHit | undefined>(({ input }) => getHackerNewsUrl(input.url)),
});

export async function getCVE(id: string) {
  const result = await fetch(`${API_BASE_URL}cve/v1/cve?id=` + id);
  const re = Published.safeParse(await result.json());
  if (re.error) {
    console.error(re.error);
  }
  return re.data;
}

export async function getCVEs(ids: string[]) {
  if (ids.length === 0) return [];
  let result = await fetch(`${API_BASE_URL}cve/v1/cves?ids=` + ids.join(","));
  let data = await result.json();
  if (!Array.isArray(data)) return [];
  let cves = data
    .map((item) => {
      const re = Published.safeParse(item);
      if (re.error) console.error(re.error);
      return re.data;
    })
    .filter(isDefined);
  return cves;
}

export async function getRecentCVEs(count: number): Promise<Published[]> {
  const result = await fetch(`${API_BASE_URL}cve/v1/recent?count=` + count);
  let data = await result.json();
  if (!Array.isArray(data)) return [];
  let cves = data
    .map((item) => {
      const re = Published.safeParse(item);
      if (re.error) console.error(re.error);
      return re.data;
    })
    .filter(isDefined);
  return cves;
}

export async function search(query: string) {
  const result = await fetch(`${API_BASE_URL}cve/v1/search?query=` + query);
  const re = z.array(Published).safeParse(await result.json());
  if (re.error) {
    console.error(re.error);
  }
  return re.data;
}

export async function getOpenGraphData(
  url: string
): Promise<OpenGraphData | undefined> {
  const response = await fetch(`https://og.248.no/api?url=${url}`);
  const ogdResponse = OpenGraphDataResponse.safeParse(await response.json());
  if (ogdResponse.error) console.error(ogdResponse.error);
  return ogdResponse.data
    ? formatOpenGraphDataResponse(ogdResponse.data, url)
    : undefined;
}

export async function getGithubAdvisories(
  cveId: string
): Promise<GithubAdvisory[]> {
  const result = await fetch(
    `${GITHUB_API_BASE_URL}advisories?cve_id=${cveId}`,
    {
      headers: {
        Authorization: GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : "",
      },
    }
  );
  if (!result.ok) {
    console.error("getGithubAdvisories error", result.status);
  }
  const data = await result.json();
  return data;
}

export type AppRouter = typeof appRouter;
