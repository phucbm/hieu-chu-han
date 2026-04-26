"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus, Music, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GroupCard } from "@/components/notebook/GroupCard";
import { CreateGroupDialog } from "@/components/notebook/CreateGroupDialog";
import { toast } from "sonner";
import {
  getGroups,
  createGroup,
  createLyricsGroup,
  deleteGroup,
  reorderGroups,
} from "@/app/actions/notebook";
import type { NotebookGroup } from "@/core/notebook-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotebookPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [groups, setGroups] = useState<NotebookGroup[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"manual" | "lyrics">("manual");
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchGroups = useCallback(async () => {
    const result = await getGroups();
    setGroups(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchGroups();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, fetchGroups]);

  async function handleCreate(
    title: string,
    description?: string,
    lyricsContent?: string,
    youtubeUrl?: string,
    autoExtract?: boolean,
  ) {
    let group: NotebookGroup | null;
    if (createMode === "lyrics" && lyricsContent) {
      group = await createLyricsGroup(title, lyricsContent, youtubeUrl, autoExtract ?? false);
    } else {
      group = await createGroup(title, description, "manual");
    }
    if (!group) { toast.error("createGroup returned null — check server logs"); return; }
    setGroups((prev) => [...prev, group!]);
    toast.success(`Đã tạo nhóm "${group.title}"`);
    setCreateDialogOpen(false);
  }

  async function handleDelete(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    await deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast.success(`Đã xóa nhóm "${group?.title ?? ""}"`);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setGroups((prev) => {
      const oldIndex = prev.findIndex((g) => g.id === active.id);
      const newIndex = prev.findIndex((g) => g.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderGroups(reordered.map((g) => g.id));
      return reordered;
    });
  }

  const headerActions = isSignedIn ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tạo nhóm</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => { setCreateMode("manual"); setCreateDialogOpen(true); }}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Nhóm từ vựng
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => { setCreateMode("lyrics"); setCreateDialogOpen(true); }}
        >
          <Music className="h-4 w-4 mr-2" />
          Lời bài hát
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined;

  const breadcrumb = (
    <BreadcrumbItem>
      <BreadcrumbPage>Sổ tay</BreadcrumbPage>
    </BreadcrumbItem>
  );

  if (!isLoaded || loading) {
    return (
      <AppLayout breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center flex-1 p-8 text-muted-foreground text-sm">
          Đang tải...
        </div>
      </AppLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <AppLayout breadcrumb={breadcrumb}>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
          <p className="text-muted-foreground text-sm">Đăng nhập để sử dụng Sổ tay</p>
          <SignInButton mode="redirect">
            <Button>Đăng nhập</Button>
          </SignInButton>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout breadcrumb={breadcrumb} headerActions={headerActions}>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-muted-foreground text-sm">Chưa có nhóm nào.</p>
            <p className="text-xs text-muted-foreground/60">
              Tạo nhóm để tổ chức từ vựng hoặc lời bài hát.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 max-w-2xl">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    wordCount={0}
                    onOpen={() => router.push(`/notebook/${group.slug}`)}
                    onDelete={() => handleDelete(group.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </AppLayout>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        mode={createMode}
      />
    </>
  );
}
