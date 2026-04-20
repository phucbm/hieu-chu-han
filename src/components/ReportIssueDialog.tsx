"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import pkg from "../../package.json";

interface ReportIssueDialogProps {
  children: React.ReactNode;
  url?: string;
}

type Status = "idle" | "sending" | "success" | "error";

export function ReportIssueDialog({ children, url }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit() {
    if (!message.trim()) return;
    setStatus("sending");
    const footer = [url ? `<${url}>` : null, `\`v${pkg.version}\``].filter(Boolean).join("  ");
    const content = `${message.trim()}\n\n${footer}`;
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setMessage("");
      setStatus("idle");
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <span onClick={() => setOpen(true)}>{children}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo lỗi / Report issue</DialogTitle>
          <DialogDescription>
            Mô tả lỗi hoặc góp ý — sẽ được gửi thẳng đến Discord.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <p className="text-sm text-green-600 py-2">Đã gửi! Cảm ơn bạn.</p>
        ) : (
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
            placeholder="Nhập nội dung..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === "sending"}
          />
        )}

        {status === "error" && (
          <p className="text-xs text-destructive">Gửi thất bại, thử lại sau.</p>
        )}

        {status !== "success" && (
          <DialogFooter showCloseButton>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || status === "sending"}
            >
              {status === "sending" ? "Đang gửi..." : "Gửi"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
