"use client";

/**
 * InstallBadge — displays visit and install counts fetched from counterapi.dev.
 * Renders nothing while loading or on error.
 */

import { useEffect, useState } from "react";
import { getStats, type Stats } from "@/core/pwa";

export function InstallBadge() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then((data) => {
      if (data.visits > 0 || data.installs > 0) setStats(data);
    });
  }, []);

  if (!stats) return null;

  return (
    <span className="text-xs text-muted-foreground/40">
      {stats.visits.toLocaleString("vi-VN")} lượt truy cập
      {" · "}
      {stats.installs.toLocaleString("vi-VN")} lượt cài đặt
    </span>
  );
}
