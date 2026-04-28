"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Pencil, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GroupWordRow } from "@/components/notebook/GroupWordRow";
import { LyricsPanel } from "@/components/notebook/LyricsPanel";
import { toast } from "sonner";
import {
  getGroupBySlug,
  getGroupWords,
  getLyrics,
  addWordToGroup,
  updateGroup,
  updateLyrics,
  type GroupWord,
} from "@/app/actions/notebook";
import { getWordDetail } from "@/core/client-dictionary";
import type { NotebookGroup, NotebookLyrics, UserWordExtended } from "@/core/notebook-types";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupDetailClientProps {
  slug: string;
  initialGroups?: NotebookGroup[];
}

export function GroupDetailClient({ slug, initialGroups }: GroupDetailClientProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  const [group, setGroup] = useState<NotebookGroup | null>(null);
  const [groupWords, setGroupWords] = useState<GroupWord[]>([]);
  const [lyrics, setLyrics] = useState<NotebookLyrics | null>(null);
  const [wordDisplayMap, setWordDisplayMap] = useState<Map<string, { pinyin: string; vi: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);

  // Editable meta
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Lyrics editing
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [lyricsContent, setLyricsContent] = useState("");
  const [lyricsYoutubeUrl, setLyricsYoutubeUrl] = useState("");
  const [savingLyrics, setSavingLyrics] = useState(false);


  const fetchData = useCallback(async () => {
    const found = await getGroupBySlug(slug);
    setGroup(found);
    if (!found) { setLoading(false); return; }

    setTitleValue(found.title);
    setDescValue(found.description ?? "");

    const words = await getGroupWords(found.id);
    setGroupWords(words);

    if (found.type === "lyrics") {
      const lyricsData = await getLyrics(found.id);
      setLyrics(lyricsData);
      if (lyricsData) {
        setLyricsContent(lyricsData.content);
        setLyricsYoutubeUrl(lyricsData.youtubeUrl ?? "");
      }
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchData();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, fetchData]);

  // Enrich display data from client dictionary
  useEffect(() => {
    if (groupWords.length === 0) return;
    Promise.all(
      groupWords.map(({ userWord }) =>
        getWordDetail(userWord.simp).then((entry) => ({
          simp: userWord.simp,
          pinyin: entry?.pinyin ?? "",
          vi: entry?.definitionVi ?? entry?.definitionsEn[0] ?? "",
        })),
      ),
    ).then((results) => {
      setWordDisplayMap(new Map(results.map((r) => [r.simp, { pinyin: r.pinyin, vi: r.vi }])));
    });
  }, [groupWords]);

  async function handleSaveTitle() {
    if (!group || !titleValue.trim() || titleValue.trim() === group.title) {
      setEditingTitle(false);
      setTitleValue(group?.title ?? "");
      return;
    }
    setSavingMeta(true);
    try {
      await updateGroup(group.id, titleValue.trim(), descValue.trim() || undefined);
      setGroup((prev) => prev ? { ...prev, title: titleValue.trim() } : prev);
      toast.success("Đã lưu tên nhóm");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setTitleValue(group.title);
    } finally {
      setSavingMeta(false);
      setEditingTitle(false);
    }
  }

  async function handleSaveDesc() {
    if (!group || descValue.trim() === (group.description ?? "")) {
      setEditingDesc(false);
      return;
    }
    setSavingMeta(true);
    try {
      await updateGroup(group.id, group.title, descValue.trim() || undefined);
      setGroup((prev) => prev ? { ...prev, description: descValue.trim() || undefined } : prev);
      toast.success("Đã lưu mô tả");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setDescValue(group.description ?? "");
    } finally {
      setSavingMeta(false);
      setEditingDesc(false);
    }
  }

  async function handleSaveLyrics() {
    if (!group) return;
    setSavingLyrics(true);
    try {
      await updateLyrics(group.id, lyricsContent, lyricsYoutubeUrl || undefined);
      setLyrics((prev) => prev
        ? { ...prev, content: lyricsContent, youtubeUrl: lyricsYoutubeUrl || undefined }
        : prev
      );
      toast.success("Đã lưu lời bài hát");
      setLyricsExpanded(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingLyrics(false);
    }
  }

  async function handleAddWord() {
    const simp = addInput.trim();
    if (!simp || !group) return;
    setAdding(true);
    try {
      await addWordToGroup(group.id, simp);
      setAddInput("");
      await fetchData();
      toast.success(`Đã thêm "${simp}" vào nhóm`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }

  function handleWordRemoved(simp: string) {
    setGroupWords((prev) => prev.filter((gw) => gw.userWord.simp !== simp));
  }

  const userWords: UserWordExtended[] = groupWords.map((gw) => gw.userWord);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const breadcrumb = (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink href="/notebook">Sổ tay</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="truncate">{group?.title ?? slug}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );

  if (!isLoaded || loading) {
    return (
      <AppLayout breadcrumb={breadcrumb} initialGroups={initialGroups}>
        <div className="flex flex-col gap-4 max-w-2xl">
          {/* Group title + description skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
          {/* Word rows skeleton */}
          <div className="rounded-lg border divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5">
                <Skeleton className="h-7 w-7 rounded shrink-0" />
                <div className="flex flex-col gap-1 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-10 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <AppLayout breadcrumb={breadcrumb} initialGroups={initialGroups}>
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground text-sm">Đăng nhập để xem Sổ tay</p>
          <SignInButton mode="redirect">
            <Button>Đăng nhập</Button>
          </SignInButton>
        </div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout breadcrumb={breadcrumb} initialGroups={initialGroups}>
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-muted-foreground text-sm">Không tìm thấy nhóm.</p>
          <Button variant="outline" onClick={() => router.push("/notebook")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Quay lại Sổ tay
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumb={breadcrumb} initialGroups={initialGroups}>
      <div className="flex flex-col gap-4 max-w-2xl">

        {/* ── Group meta: editable title, description, dates ── */}
        <div className="flex flex-col gap-1">
          {/* Title */}
          {editingTitle ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") { setEditingTitle(false); setTitleValue(group.title); }
                }}
                className="text-lg font-semibold h-auto py-1 flex-1"
                disabled={savingMeta}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSaveTitle} disabled={savingMeta}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setEditingTitle(false); setTitleValue(group.title); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="group/title flex items-center gap-1.5 text-left w-fit"
            >
              <h1 className="text-lg font-semibold">{group.title}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Description */}
          {editingDesc ? (
            <div className="flex items-start gap-1.5">
              <Textarea
                autoFocus
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setEditingDesc(false); setDescValue(group.description ?? ""); }
                }}
                placeholder="Thêm mô tả..."
                className="text-sm min-h-[60px] flex-1 resize-none"
                disabled={savingMeta}
              />
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSaveDesc} disabled={savingMeta}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setEditingDesc(false); setDescValue(group.description ?? ""); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingDesc(true)}
              className="group/desc flex items-center gap-1.5 text-left w-fit"
            >
              <p className="text-sm text-muted-foreground">
                {group.description ?? <span className="italic opacity-50">Thêm mô tả...</span>}
              </p>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0" />
            </button>
          )}

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 mt-0.5">
            <span>Tạo: {formatDate(group.createdAt)}</span>
            {group.updatedAt !== group.createdAt && (
              <>
                <span>·</span>
                <span>Cập nhật: {formatDate(group.updatedAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Lyrics display panel ── */}
        {group.type === "lyrics" && lyrics && (
          <div className="rounded-lg border p-4">
            <LyricsPanel lyrics={lyrics} userWords={userWords} />
          </div>
        )}

        {/* ── Lyrics editor (for lyrics type) ── */}
        {group.type === "lyrics" && (
          <div className="rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setLyricsExpanded((v) => !v)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <span>Chỉnh sửa lời bài hát</span>
              {lyricsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {lyricsExpanded && (
              <div className="flex flex-col gap-3 p-4 border-t">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Lời bài hát</label>
                  <Textarea
                    value={lyricsContent}
                    onChange={(e) => setLyricsContent(e.target.value)}
                    placeholder="Dán lời bài hát vào đây..."
                    className="h-64 text-sm font-chinese resize-y overflow-y-auto field-sizing-fixed"
                    disabled={savingLyrics}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Link YouTube (tùy chọn)</label>
                  <Input
                    value={lyricsYoutubeUrl}
                    onChange={(e) => setLyricsYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-8 text-sm"
                    disabled={savingLyrics}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setLyricsExpanded(false);
                      setLyricsContent(lyrics?.content ?? "");
                      setLyricsYoutubeUrl(lyrics?.youtubeUrl ?? "");
                    }}
                    disabled={savingLyrics}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={handleSaveLyrics}
                    disabled={savingLyrics || !lyricsContent.trim()}
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Word list ── */}
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">
            Từ vựng
            {groupWords.length > 0 && (
              <span className="text-muted-foreground font-normal ml-1.5">
                ({groupWords.length})
              </span>
            )}
          </h2>

          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleAddWord(); }}
          >
            <Input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="Thêm từ (vd: 你好)..."
              className="h-8 text-sm font-chinese flex-1"
              disabled={adding}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8"
              disabled={adding || !addInput.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>

          {groupWords.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Chưa có từ nào trong nhóm này.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden divide-y divide-border">
              {groupWords.map((gw) => (
                <GroupWordRow
                  key={gw.userWord.simp}
                  groupId={group.id}
                  groupWord={gw}
                  wordDisplay={wordDisplayMap.get(gw.userWord.simp)}
                  onRemoved={handleWordRemoved}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
