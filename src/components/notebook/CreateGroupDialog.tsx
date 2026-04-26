"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, description?: string, lyricsContent?: string, youtubeUrl?: string, autoExtract?: boolean) => Promise<void>;
  mode: "manual" | "lyrics";
}

export function CreateGroupDialog({ open, onOpenChange, onSubmit, mode }: CreateGroupDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lyricsContent, setLyricsContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [autoExtract, setAutoExtract] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setLyricsContent("");
    setYoutubeUrl("");
    setAutoExtract(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit(
        title,
        description || undefined,
        mode === "lyrics" ? lyricsContent : undefined,
        mode === "lyrics" ? (youtubeUrl || undefined) : undefined,
        mode === "lyrics" ? autoExtract : undefined,
      );
      reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "lyrics" ? "Tạo nhóm lời bài hát" : "Tạo nhóm mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-title">Tên nhóm</Label>
            <Input
              id="group-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Từ HSK 3, Lời bài hát..."
              autoFocus
              required
            />
          </div>

          {mode === "manual" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-desc">Mô tả (tùy chọn)</Label>
              <Input
                id="group-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về nhóm này"
              />
            </div>
          )}

          {mode === "lyrics" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lyrics-content">Lời bài hát</Label>
                <Textarea
                  id="lyrics-content"
                  value={lyricsContent}
                  onChange={(e) => setLyricsContent(e.target.value)}
                  placeholder="Dán lời bài hát vào đây..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="youtube-url">Link YouTube (tùy chọn)</Label>
                <Input
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="flex items-start gap-3">
                <Switch
                  id="auto-extract"
                  checked={autoExtract}
                  onCheckedChange={setAutoExtract}
                />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="auto-extract" className="cursor-pointer">
                    Tự động thêm từ mới vào nhóm
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sau khi lưu, các từ chưa có trong nhóm này sẽ được trích xuất và thêm tự động.
                  </p>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); reset(); }} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Tạo nhóm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
