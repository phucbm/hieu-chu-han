"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { BookMarked, Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner";
import {
  getGroups,
  addWordToGroup,
  removeWordFromGroup,
  createGroup,
} from "@/app/actions/notebook";
import { CreateGroupDialog } from "@/components/notebook/CreateGroupDialog";
import type { NotebookGroup } from "@/core/notebook-types";

interface AddToGroupButtonProps {
  simp: string;
  /** Current group_ids for this word — pass if known to skip an extra fetch */
  initialGroupIds?: string[];
  /** Compact icon-only variant for use in WordRow */
  compact?: boolean;
}

export function AddToGroupButton({ simp, initialGroupIds, compact = false }: AddToGroupButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<NotebookGroup[]>([]);
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>(initialGroupIds ?? []);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    const result = await getGroups();
    setGroups(result);
  }, []);

  useEffect(() => {
    if (open && isSignedIn) fetchGroups();
  }, [open, isSignedIn, fetchGroups]);

  async function handleToggle(groupId: string) {
    setLoading(true);
    const isActive = activeGroupIds.includes(groupId);
    try {
      if (isActive) {
        await removeWordFromGroup(groupId, simp);
        setActiveGroupIds((prev) => prev.filter((id) => id !== groupId));
        toast.success("Đã xóa khỏi nhóm");
      } else {
        await addWordToGroup(groupId, simp);
        setActiveGroupIds((prev) => [...prev, groupId]);
        toast.success("Đã thêm vào nhóm");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(title: string, description?: string) {
    const group = await createGroup(title, description, "manual");
    if (!group) { toast.error("Không thể tạo nhóm"); return; }
    await addWordToGroup(group.id, simp);
    setActiveGroupIds((prev) => [...prev, group.id]);
    setGroups((prev) => [...prev, group]);
    toast.success(`Đã tạo nhóm "${group.title}" và thêm từ vào`);
    setCreateDialogOpen(false);
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect">
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={compact ? "h-7 w-7 text-muted-foreground hover:text-foreground" : "gap-1.5 text-xs h-7"}
          title="Đăng nhập để thêm vào sổ tay"
        >
          <BookMarked className="h-3.5 w-3.5" />
          {!compact && <span>Lưu</span>}
        </Button>
      </SignInButton>
    );
  }

  const isInAnyGroup = activeGroupIds.length > 0;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size={compact ? "icon" : "sm"}
              className={
                compact
                  ? "h-7 w-7 text-muted-foreground hover:text-foreground"
                  : "gap-1.5 text-xs h-7"
              }
              title="Thêm vào sổ tay"
              aria-label="Thêm vào sổ tay"
            />
          }
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookMarked
              className={`h-3.5 w-3.5 ${isInAnyGroup ? "fill-current text-primary" : ""}`}
            />
          )}
          {!compact && <span>{isInAnyGroup ? "Đã lưu" : "Lưu"}</span>}
        </PopoverTrigger>

        <PopoverContent className="p-0 w-64" align="end">
          <Command>
            <CommandInput placeholder="Tìm nhóm..." />
            <CommandList>
              <CommandEmpty>Chưa có nhóm nào.</CommandEmpty>
              {groups.length > 0 && (
                <CommandGroup heading="Nhóm của bạn">
                  {groups.map((group) => {
                    const isActive = activeGroupIds.includes(group.id);
                    return (
                      <CommandItem
                        key={group.id}
                        onSelect={() => handleToggle(group.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-100 text-primary" : "opacity-0"}`}
                        />
                        <span className="truncate">{group.title}</span>
                        {group.type === "lyrics" && (
                          <span className="ml-auto text-xs text-muted-foreground">lời bài hát</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => { setOpen(false); setCreateDialogOpen(true); }}
                  className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tạo nhóm mới</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateGroup}
        mode="manual"
      />
    </>
  );
}
