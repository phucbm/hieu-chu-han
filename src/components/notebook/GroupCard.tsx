"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Music, BookOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotebookGroup } from "@/core/notebook-types";

interface GroupCardProps {
  group: NotebookGroup;
  wordCount: number;
  onOpen: () => void;
  onDelete: () => void;
}

export function GroupCard({ group, wordCount, onOpen, onDelete }: GroupCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-0 rounded-lg border bg-card overflow-hidden"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex items-center px-2 text-muted-foreground hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex-1 flex items-center gap-3 px-3 py-3 text-left hover:bg-muted transition-colors min-w-0"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
          {group.type === "lyrics" ? (
            <Music className="h-4 w-4 text-muted-foreground" />
          ) : (
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{group.title}</span>
            {group.type === "lyrics" && (
              <Badge variant="secondary" className="text-xs shrink-0">Lời bài hát</Badge>
            )}
          </div>
          {group.description && (
            <span className="text-xs text-muted-foreground truncate">{group.description}</span>
          )}
          <span className="text-xs text-muted-foreground">{wordCount} từ</span>
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="flex items-center px-3 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        aria-label="Xóa nhóm"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
