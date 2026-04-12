"use client";

/**
 * SwAutoUpdate — registers a one-time listener that reloads the page when
 * the service worker updates and claims control (skipWaiting + clientsClaim
 * are set in sw.ts, so this fires automatically on every new deploy).
 *
 * Rendered once in RootLayout; no UI output.
 */

import { useEffect } from "react";

export function SwAutoUpdate() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  return null;
}
