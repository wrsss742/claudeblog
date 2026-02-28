import { NpmPackageInfo, NpmRegistryResponse } from "@/types/npm";
import { CACHE_TAGS, REVALIDATE } from "@/lib/cache";

const PACKAGE_NAME = "@anthropic-ai/claude-code";

export async function fetchNpmInfo(): Promise<NpmPackageInfo> {
  const encodedName = encodeURIComponent(PACKAGE_NAME);
  const res = await fetch(
    `https://registry.npmjs.org/${encodedName}`,
    {
      next: {
        revalidate: REVALIDATE.npm,
        tags: [CACHE_TAGS.npm],
      },
    }
  );

  if (!res.ok) {
    throw new Error(`npm fetch failed: ${res.status} ${res.statusText}`);
  }

  const data: NpmRegistryResponse = await res.json();

  const latestVersion = data["dist-tags"].latest;
  const allVersions = Object.keys(data.versions).reverse();
  const recentVersions = allVersions.slice(0, 5).map((version) => ({
    version,
    date: data.time[version] ?? "",
  }));

  return {
    name: data.name,
    latestVersion,
    recentVersions,
    description: data.description ?? "",
    homepage: data.homepage ?? `https://www.npmjs.com/package/${PACKAGE_NAME}`,
    npmUrl: `https://www.npmjs.com/package/${encodeURIComponent(PACKAGE_NAME)}`,
  };
}
