export interface NpmPackageInfo {
  name: string;
  latestVersion: string;
  recentVersions: Array<{
    version: string;
    date: string;
  }>;
  description: string;
  homepage: string;
  npmUrl: string;
  weeklyDownloads?: number;
}

export interface NpmRegistryResponse {
  name: string;
  description: string;
  "dist-tags": {
    latest: string;
    [key: string]: string;
  };
  versions: Record<string, {
    version: string;
    description?: string;
    homepage?: string;
  }>;
  time: Record<string, string>;
  homepage?: string;
}
