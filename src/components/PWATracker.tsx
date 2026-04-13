"use client";

/**
 * PWATracker — tracks page visits and PWA installs.
 * Calls trackPageVisit() once on mount; listens for the `appinstalled`
 * browser event to call trackInstall(). No visible UI.
 */

import { useEffect } from "react";
import { trackPageVisit, trackInstall } from "@/core/pwa";

export function PWATracker() {
  useEffect(() => {
    trackPageVisit();

    const handleInstall = () => {
      trackInstall();
    };

    window.addEventListener("appinstalled", handleInstall);

    return () => {
      window.removeEventListener("appinstalled", handleInstall);
    };
  }, []);

  return null;
}
