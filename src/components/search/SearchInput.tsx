"use client";

/**
 * SearchInput — Thanh tìm kiếm đơn giản
 * No search button — debounce + auto-suggest is handled by the parent.
 * Escape key calls onEscape callback.
 */

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { X, Loader2, PenLine } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  onEscape?: () => void;
  /** Fired only when the <input> itself receives focus */
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Opens the handwriting input modal */
  onHandwriting?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      isLoading,
      onEscape,
      onFocus,
      onBlur,
      placeholder = "Nhập chữ Hán, pinyin...",
      onHandwriting,
    },
    ref
  ) {
    return (
      <div className="relative">
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onEscape?.();
              (ref as React.RefObject<HTMLInputElement>)?.current?.blur();
            }
          }}
          placeholder={placeholder}
          className="pr-16 text-base h-11 [&::-webkit-search-cancel-button]:hidden"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Tìm kiếm chữ Hán"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Loading spinner */}
          {isLoading && (
            <span className="text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          )}

          {/* Clear button */}
          {!isLoading && value.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Xóa"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Handwriting input button */}
          {onHandwriting && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onHandwriting}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Vẽ chữ Hán"
            >
              <PenLine className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
