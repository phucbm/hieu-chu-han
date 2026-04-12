"use client";

/**
 * CopyShareButton — Copies the ?word= share URL to clipboard.
 * Shows a brief checkmark animation on success.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyShareButtonProps {
  simp: string;
}

export function CopyShareButton({ simp }: CopyShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}${window.location.pathname}?word=${encodeURIComponent(simp)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS)
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      title="Sao chép liên kết"
      aria-label="Sao chép liên kết"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
