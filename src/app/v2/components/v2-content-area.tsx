"use client"

import Image from "next/image"
import { WordTabs } from "@/components/word/WordTabs"
import type { WordEntry } from "@/core/types"

interface V2ContentAreaProps {
  entries: WordEntry[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  onWordClick: (simp: string) => void
}

export function V2ContentArea({ entries, activeTab, onTabChange, onWordClick }: V2ContentAreaProps) {
  if (entries.length === 0) {
    return (
      <div className="content-area-welcome flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Image src="/icon.png" alt="Hiểu Chữ Hán" width={72} height={72} className="rounded-2xl shadow-md" />
        <p className="text-sm text-muted-foreground">
          Nhấn{" "}
          <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">⌘K</kbd>{" "}
          hoặc nút tìm kiếm để bắt đầu
        </p>
        <a
          href="https://launch.j2team.dev/products/hieu-chu-han?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-hieu-chu-han"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2"
        >
          <img
            src="https://launch.j2team.dev/badge/hieu-chu-han/light"
            alt="Hiểu Chữ Hán - Launched on J2TEAM Launch"
            width="250"
            height="54"
            loading="lazy"
          />
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-4">
      <WordTabs
        entries={entries}
        onWordClick={onWordClick}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  )
}
