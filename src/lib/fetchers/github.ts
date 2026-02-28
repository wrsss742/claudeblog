import { GitHubRelease, GitHubIssue } from "@/types/github";
import { CACHE_TAGS, REVALIDATE } from "@/lib/cache";

const REPO = "anthropics/claude-code";
const BASE_URL = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  const res = await fetch(
    `${BASE_URL}/repos/${REPO}/releases?per_page=5`,
    {
      headers: getHeaders(),
      next: {
        revalidate: REVALIDATE.githubReleases,
        tags: [CACHE_TAGS.githubReleases],
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub Releases fetch failed: ${res.status} ${res.statusText}`);
  }

  const data: GitHubRelease[] = await res.json();
  return data.filter((r) => !r.draft);
}

export async function fetchGitHubIssues(): Promise<GitHubIssue[]> {
  const res = await fetch(
    `${BASE_URL}/repos/${REPO}/issues?state=open&per_page=10&sort=updated`,
    {
      headers: getHeaders(),
      next: {
        revalidate: REVALIDATE.githubIssues,
        tags: [CACHE_TAGS.githubIssues],
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub Issues fetch failed: ${res.status} ${res.statusText}`);
  }

  const data: GitHubIssue[] = await res.json();
  return data;
}
