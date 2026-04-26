"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Check, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateWordNote, removeWordFromGroup } from "@/app/actions/notebook";
import type { GroupWord } from "@/app/actions/notebook";

interface GroupWordRowProps {
  groupId: string;
  groupWord: GroupWord;
  wordDisplay?: { pinyin: string; vi: string };
  onRemoved: (simp: string) => void;
}

export function GroupWordRow({ groupId, groupWord, wordDisplay, onRemoved }: GroupWordRowProps) {
  const router = useRouter();
  const { userWord, hskLevel, etymologySuggestions } = groupWord;
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(userWord.note ?? "");
  const [savingNote, setSavingNote] = useState(false);

  const firstViewed = new Date(userWord.firstViewedAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const lastViewed = new Date(userWord.lastViewedAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      await updateWordNote(userWord.simp, noteValue);
      toast.success("Đã lưu ghi chú");
      setEditingNote(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingNote(false);
    }
  }

  async function handleRemove() {
    await removeWordFromGroup(groupId, userWord.simp);
    onRemoved(userWord.simp);
    toast.success("Đã xóa khỏi nhóm");
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => router.push(`/word/${encodeURIComponent(userWord.simp)}`)}
          className="font-chinese text-xl font-medium shrink-0 hover:text-primary transition-colors"
        >
          {userWord.simp}
        </button>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {wordDisplay?.pinyin && (
              <span className="text-xs text-muted-foreground">{wordDisplay.pinyin}</span>
            )}
            {hskLevel && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">HSK {hskLevel}</Badge>
            )}
          </div>
          {wordDisplay?.vi && (
            <span className="text-xs truncate">{wordDisplay.vi}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {userWord.viewCount}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · {firstViewed === lastViewed ? firstViewed : `${firstViewed} – ${lastViewed}`}
          </span>

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingNote(true)}
              title="Ghi chú"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              title="Xóa khỏi nhóm"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {etymologySuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-8">
          <span className="text-xs text-muted-foreground">Liên quan:</span>
          {etymologySuggestions.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => router.push(`/word/${encodeURIComponent(w)}`)}
              className="font-chinese text-xs text-primary hover:underline"
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {userWord.note && !editingNote && (
        <p className="text-xs text-muted-foreground pl-8 italic">{userWord.note}</p>
      )}

      {editingNote && (
        <div className="flex items-center gap-1.5 pl-8">
          <Input
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Ghi chú của bạn..."
            className="h-7 text-xs flex-1"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); if (e.key === "Escape") setEditingNote(false); }}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSaveNote} disabled={savingNote}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingNote(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
