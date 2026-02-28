interface LastUpdatedProps {
  date: Date;
}

export function LastUpdated({ date }: LastUpdatedProps) {
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);

  return (
    <p className="text-xs text-gray-400 dark:text-gray-500">
      最終更新: {formatted} (JST)
    </p>
  );
}
