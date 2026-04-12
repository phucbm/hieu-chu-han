"use client";

/**
 * SearchBar — Thanh tìm kiếm
 * Supports Chinese characters, pinyin with/without tones.
 * Uses shadcn Input + Button components.
 */

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  /** Current search query */
  value: string;
  /** Called when user changes the input */
  onChange: (value: string) => void;
  /** Called when user submits the search */
  onSearch: (value: string) => void;
  /** Whether search is loading */
  loading?: boolean;
}

/**
 * Search bar component with clear button and submit action.
 * Vietnamese placeholder. Supports CJK input, pinyin, and pinyin without tones.
 */
export function SearchBar({ value, onChange, onSearch, loading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      onSearch(value.trim());
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md gap-2"
      role="search"
    >
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập chữ Hán, pinyin..."
          className="pr-8 text-base h-11"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Tìm kiếm chữ Hán"
          disabled={loading}
        />
        {/* Clear button — shown only when input has content */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Xóa nội dung tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        disabled={!value.trim() || loading}
        className="h-11 px-4"
        aria-label="Tìm kiếm"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
