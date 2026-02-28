export const CACHE_TAGS = {
  githubReleases: "github-releases",
  githubIssues: "github-issues",
  npm: "npm",
  blog: "blog",
  twitterAlt: "twitter-alt",
  japaneseTech: "japanese-tech",
} as const;

export const REVALIDATE = {
  githubReleases: 3600,
  npm: 3600,
  githubIssues: 300,
  blog: 1800,
  twitterAlt: 600,
  japaneseTech: 1800,
} as const;
