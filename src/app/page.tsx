import { fetchGitHubReleases, fetchGitHubIssues } from "@/lib/fetchers/github";
import { fetchNpmInfo } from "@/lib/fetchers/npm";
import { fetchAnthropicBlog } from "@/lib/fetchers/rss";
import { fetchTwitterAlt } from "@/lib/fetchers/twitter-alt";
import { fetchJapaneseTech } from "@/lib/fetchers/japanese-tech";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RefreshButton } from "@/components/dashboard/RefreshButton";
import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { ReleasesCard } from "@/components/cards/ReleasesCard";
import { NpmCard } from "@/components/cards/NpmCard";
import { IssuesCard } from "@/components/cards/IssuesCard";
import { BlogCard } from "@/components/cards/BlogCard";
import { TwitterAltCard } from "@/components/cards/TwitterAltCard";
import { JapaneseTechCard } from "@/components/cards/JapaneseTechCard";

export default async function DashboardPage() {
  const [releases, npmInfo, issues, blog, twitterAlt, japaneseTech] = await Promise.allSettled([
    fetchGitHubReleases(),
    fetchNpmInfo(),
    fetchGitHubIssues(),
    fetchAnthropicBlog(),
    fetchTwitterAlt(),
    fetchJapaneseTech(),
  ]);

  const now = new Date();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Claude Code Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GitHub・npm・ブログ・Xの最新情報を一画面で確認
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <RefreshButton />
          <LastUpdated date={now} />
        </div>
      </div>

      {/* グリッド */}
      <DashboardGrid>
        {/* 上段：日本語コンテンツ */}
        <JapaneseTechCard
          articles={japaneseTech.status === "fulfilled" ? japaneseTech.value : null}
          error={japaneseTech.status === "rejected" ? String(japaneseTech.reason) : undefined}
        />
        <TwitterAltCard
          tweets={twitterAlt.status === "fulfilled" ? twitterAlt.value : null}
          error={twitterAlt.status === "rejected" ? String(twitterAlt.reason) : undefined}
        />
        <BlogCard
          posts={blog.status === "fulfilled" ? blog.value : null}
          error={blog.status === "rejected" ? String(blog.reason) : undefined}
        />
        {/* 下段：GitHub / npm */}
        <ReleasesCard
          releases={releases.status === "fulfilled" ? releases.value : null}
          error={releases.status === "rejected" ? String(releases.reason) : undefined}
        />
        <NpmCard
          info={npmInfo.status === "fulfilled" ? npmInfo.value : null}
          error={npmInfo.status === "rejected" ? String(npmInfo.reason) : undefined}
        />
        <IssuesCard
          issues={issues.status === "fulfilled" ? issues.value : null}
          error={issues.status === "rejected" ? String(issues.reason) : undefined}
        />
      </DashboardGrid>
    </main>
  );
}
