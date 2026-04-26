"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GroupWordRow } from "@/components/notebook/GroupWordRow";
import { LyricsPanel } from "@/components/notebook/LyricsPanel";
import { toast } from "sonner";
import {
  getGroupBySlug,
  getGroupWords,
  getLyrics,
  addWordToGroup,
  type GroupWord,
} from "@/app/actions/notebook";
import { getWordDetail } from "@/core/client-dictionary";
import type { NotebookGroup, NotebookLyrics, UserWordExtended } from "@/core/notebook-types";

export default function GroupDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  const [group, setGroup] = useState<NotebookGroup | null>(null);
  const [groupWords, setGroupWords] = useState<GroupWord[]>([]);
  const [lyrics, setLyrics] = useState<NotebookLyrics | null>(null);
  const [wordDisplayMap, setWordDisplayMap] = useState<
    Map<string, { pinyin: string; vi: string }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    const found = await getGroupBySlug(slug);
    setGroup(found);
    if (!found) { setLoading(false); return; }

    const words = await getGroupWords(found.id);
    setGroupWords(words);

    if (found.type === "lyrics") {
      const lyricsData = await getLyrics(found.id);
      setLyrics(lyricsData);
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
      setWordDisplayMap(
        new Map(results.map((r) => [r.simp, { pinyin: r.pinyin, vi: r.vi }])),
      );
    });
  }, [groupWords]);

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
      <AppLayout breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
          Đang tải...
        </div>
      </AppLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <AppLayout breadcrumb={breadcrumb}>
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
      <AppLayout breadcrumb={breadcrumb}>
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
    <AppLayout breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-4 max-w-2xl">
        {group.type === "lyrics" && lyrics && (
          <div className="rounded-lg border p-4">
            <LyricsPanel lyrics={lyrics} userWords={userWords} />
          </div>
        )}

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
