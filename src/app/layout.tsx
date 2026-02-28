import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Code Dashboard",
  description: "Claude Code の最新情報をまとめたダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-slate-900">
        {children}
      </body>
    </html>
  );
}
